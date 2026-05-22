/**
 * sql-guard.ts
 *
 * A heuristic, regex-based SQL safety analyzer. It does NOT parse SQL —
 * it uses pattern matching to detect dangerous constructs. False negatives
 * are possible with sufficiently obfuscated input. Always have a human
 * review generated SQL before running it.
 *
 * See SECURITY.md for the full threat model.
 */

export type StatementType =
  | 'SELECT'
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE'
  | 'DROP'
  | 'CREATE'
  | 'ALTER'
  | 'TRUNCATE'
  | 'GRANT'
  | 'REVOKE'
  | 'UNKNOWN';

export interface GuardResult {
  isReadOnly: boolean;
  statementType: StatementType;
  warnings: string[];
}

// Strips single-line and block comments to surface hidden statements
function stripComments(sql: string): string {
  // Remove block comments /* ... */
  let stripped = sql.replace(/\/\*[\s\S]*?\*\//g, ' ');
  // Remove line comments -- ...
  stripped = stripped.replace(/--[^\n]*/g, ' ');
  return stripped;
}

// Check if the original SQL (before stripping) contains suspicious comments
function hasCommentInjection(sql: string): boolean {
  // A comment that contains a keyword hint is suspicious
  const INJECTION_PATTERNS = [
    /--[^\n]*(select|insert|update|delete|drop|alter|grant|truncate)/i,
    /\/\*[\s\S]*(select|insert|update|delete|drop|alter|grant|truncate)[\s\S]*?\*\//i,
  ];
  return INJECTION_PATTERNS.some((p) => p.test(sql));
}

// Detect the primary statement type from (comment-stripped) SQL
function detectStatementType(stripped: string): StatementType {
  const trimmed = stripped.trimStart().toUpperCase();
  if (/^SELECT\b/.test(trimmed)) return 'SELECT';
  if (/^INSERT\b/.test(trimmed)) return 'INSERT';
  if (/^UPDATE\b/.test(trimmed)) return 'UPDATE';
  if (/^DELETE\b/.test(trimmed)) return 'DELETE';
  if (/^DROP\b/.test(trimmed)) return 'DROP';
  if (/^CREATE\b/.test(trimmed)) return 'CREATE';
  if (/^ALTER\b/.test(trimmed)) return 'ALTER';
  if (/^TRUNCATE\b/.test(trimmed)) return 'TRUNCATE';
  if (/^GRANT\b/.test(trimmed)) return 'GRANT';
  if (/^REVOKE\b/.test(trimmed)) return 'REVOKE';
  return 'UNKNOWN';
}

// Detect multiple statements by counting unquoted semicolons
function hasMultipleStatements(stripped: string): boolean {
  // Remove string literals (basic heuristic: single-quoted strings)
  const noStrings = stripped.replace(/'(?:[^'\\]|\\.)*'/g, "''");
  const semicolons = (noStrings.match(/;/g) ?? []).length;
  // One trailing semicolon is fine; more than one means multiple statements
  const trimmedEnd = noStrings.trimEnd();
  if (trimmedEnd.endsWith(';')) {
    return semicolons > 1;
  }
  return semicolons > 0;
}

// Dangerous keywords that should never appear in a read-only SELECT
const DANGEROUS_KEYWORDS = [
  /\bDROP\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bEXEC(UTE)?\b/i,
  /\bXP_CMDSHELL\b/i,
  /\bINTO\s+OUTFILE\b/i,
  /\bINTO\s+DUMPFILE\b/i,
  /\bLOAD_FILE\b/i,
  /\bBENCHMARK\s*\(/i,
  /\bSLEEP\s*\(/i,
  /\bWAITFOR\s+DELAY\b/i,
  /\bINFORMATION_SCHEMA\b/i,
];

/**
 * Analyzes a SQL string and returns a safety verdict.
 * This is a heuristic — see SECURITY.md.
 */
export function analyzeSql(sql: string): GuardResult {
  const warnings: string[] = [];

  // 1. Check for comment-based injection in the raw SQL
  if (hasCommentInjection(sql)) {
    warnings.push(
      'Suspicious keywords found inside SQL comments — possible prompt injection attempt.'
    );
  }

  // 2. Strip comments for structural analysis
  const stripped = stripComments(sql);

  // 3. Detect primary statement type
  const statementType = detectStatementType(stripped);

  // 4. Non-SELECT types are never read-only
  const writingTypes: StatementType[] = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE'];
  if (writingTypes.includes(statementType)) {
    warnings.push(
      `Statement type "${statementType}" modifies or destroys data — this is not a read-only SELECT.`
    );
  }

  if (statementType === 'UNKNOWN') {
    warnings.push(
      'Could not determine statement type — treat as unsafe until manually reviewed.'
    );
  }

  // 5. Multiple statements
  if (hasMultipleStatements(stripped)) {
    warnings.push(
      'Multiple SQL statements detected (extra semicolons) — only a single statement is allowed.'
    );
  }

  // 6. Dangerous keyword scan (even inside a SELECT context)
  for (const pattern of DANGEROUS_KEYWORDS) {
    if (pattern.test(stripped)) {
      const keyword = stripped.match(pattern)?.[0] ?? pattern.source;
      warnings.push(`Dangerous keyword detected: "${keyword.toUpperCase()}".`);
    }
  }

  const isReadOnly =
    statementType === 'SELECT' &&
    !hasMultipleStatements(stripped) &&
    warnings.length === 0;

  return { isReadOnly, statementType, warnings };
}
