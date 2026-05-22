import { NextRequest, NextResponse } from 'next/server';
import { getVertex, MODEL_ID } from '@/lib/vertex';
import { checkRate, getClientIp } from '@/lib/ratelimit';
import { generateSqlRequestSchema, geminiResponseSchema, llmOutputSchema } from '@/lib/schema';
import { buildSystemPrompt, buildUserContent } from '@/lib/prompt';
import { analyzeSql } from '@/lib/sql-guard';
import type { ResponseSchema } from '@google-cloud/vertexai';
import type {
  GenerateSqlResponse,
  GenerateSqlError,
  SqlErrorCode,
} from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function err(code: SqlErrorCode, message: string, status: number): NextResponse {
  const body: GenerateSqlError = { ok: false, error: code, message };
  return NextResponse.json(body, { status });
}

export async function POST(req: NextRequest) {
  // ── 1. Rate limit ─────────────────────────────────────────────────────────
  const ip = getClientIp(req);
  const rate = await checkRate(ip);
  if (!rate.ok) {
    return err(
      'RATE_LIMIT',
      `Rate limit exceeded (${rate.limit} requests/day). Try again later.`,
      429
    );
  }

  // ── 2. Parse + validate request body ──────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return err('INVALID_INPUT', 'Request body must be valid JSON.', 400);
  }

  const parsed = generateSqlRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join('; ');
    return err('INVALID_INPUT', `Invalid request: ${msg}`, 400);
  }

  const { schema, question, dialect } = parsed.data;

  // ── 3. Build prompt ────────────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt(dialect);
  const userContent = buildUserContent(schema, question, dialect);

  // ── 4. Call Gemini 2.5 Flash with structured output ───────────────────────
  let llmRaw: unknown;
  try {
    const vertex = getVertex();
    const model = vertex.preview.getGenerativeModel({
      model: MODEL_ID,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: geminiResponseSchema as unknown as ResponseSchema,
        maxOutputTokens: 2048,
        temperature: 0,
      },
      systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userContent }] }],
    });

    const responseText =
      result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Empty response from model.');
    }

    llmRaw = JSON.parse(responseText);
  } catch (e) {
    console.error('[generate-sql] Gemini call failed:', (e as Error).message);
    return err('GENERATION_FAIL', 'SQL generation failed. Please try again.', 502);
  }

  // ── 5. Validate LLM output ────────────────────────────────────────────────
  const validated = llmOutputSchema.safeParse(llmRaw);
  if (!validated.success) {
    console.error('[generate-sql] LLM output failed zod validation:', validated.error.message);
    return err(
      'VALIDATION_FAIL',
      'Model returned an unexpected response shape. Please try again.',
      502
    );
  }

  const { sql, explanation, tables } = validated.data;

  // ── 6. Safety analysis ────────────────────────────────────────────────────
  const safety = analyzeSql(sql);

  // ── 7. Return ─────────────────────────────────────────────────────────────
  const response: GenerateSqlResponse = {
    ok: true,
    sql,
    explanation,
    tables,
    safety,
  };

  return NextResponse.json(response);
}
