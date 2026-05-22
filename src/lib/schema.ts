import { z } from 'zod';

// ─── Request / Response Zod schemas ──────────────────────────────────────────

export const SQL_DIALECTS = ['postgres', 'mysql', 'sqlite'] as const;

export const generateSqlRequestSchema = z.object({
  schema: z
    .string()
    .min(20, 'Schema must be at least 20 characters.')
    .max(20000, 'Schema must be at most 20,000 characters.'),
  question: z
    .string()
    .min(5, 'Question must be at least 5 characters.')
    .max(600, 'Question must be at most 600 characters.'),
  dialect: z.enum(SQL_DIALECTS),
});

export type GenerateSqlRequest = z.infer<typeof generateSqlRequestSchema>;

// ─── Gemini responseSchema (OpenAPI subset accepted by Vertex AI) ─────────────

/**
 * Vertex AI structured-output schema.
 * NOTE: Vertex AI does NOT support $ref, anyOf, const — only a subset of
 * OpenAPI 3.0. nullable must be expressed as nullable: true (not oneOf/null).
 */
export const geminiResponseSchema = {
  type: 'object',
  properties: {
    sql: {
      type: 'string',
      description: 'The generated SQL query, a single read-only SELECT statement.',
    },
    explanation: {
      type: 'string',
      description:
        'A plain-English explanation of what the SQL does and why it answers the question.',
    },
    tables: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of table names referenced in the SQL query.',
    },
  },
  required: ['sql', 'explanation', 'tables'],
} as const;

// ─── Zod validator for the LLM output ────────────────────────────────────────

export const llmOutputSchema = z.object({
  sql: z.string().min(1).max(10000),
  explanation: z.string().min(1).max(4000),
  tables: z.array(z.string().min(1).max(200)).max(50),
});

export type LlmOutput = z.infer<typeof llmOutputSchema>;
