// ─── API types ────────────────────────────────────────────────────────────────

export type SqlDialect = 'postgres' | 'mysql' | 'sqlite';

export interface SafetyResult {
  isReadOnly: boolean;
  statementType: string;
  warnings: string[];
}

export interface GenerateSqlResponse {
  ok: true;
  sql: string;
  explanation: string;
  tables: string[];
  safety: SafetyResult;
}

export type SqlErrorCode =
  | 'INVALID_INPUT'
  | 'RATE_LIMIT'
  | 'GENERATION_FAIL'
  | 'VALIDATION_FAIL'
  | 'INTERNAL_ERROR';

export interface GenerateSqlError {
  ok: false;
  error: SqlErrorCode;
  message: string;
}

export type GenerateSqlApiResponse = GenerateSqlResponse | GenerateSqlError;
