# NL → SQL

> Describe a query in plain English — get safe, read-only SQL for your schema.

> Portfolio Project #10 — [Tai Huynh](https://github.com/0CCHacker)

Paste your database schema (DDL or a plain-English table description), pick a SQL dialect, and ask a question. The app generates a single read-only SELECT query, explains it, lists the tables touched, and runs a heuristic safety analyzer that flags anything that isn't a safe SELECT. **It never executes SQL.**

---

## Demo

### Sample schema

```sql
CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  active     BOOLEAN DEFAULT true
);

CREATE TABLE orders (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id),
  total      NUMERIC(10,2) NOT NULL,
  status     TEXT CHECK (status IN ('pending','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Sample question

> "Show me the top 5 users by total spending, including their name, email, and total spent — only for completed orders."

Hit **generate sql** — you get a `SELECT … JOIN … GROUP BY … ORDER BY … LIMIT` with a green safety verdict panel.

---

## Stack

- **Framework:** Next.js 14, App Router, `src/` directory
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 3 + CSS variables — CRT terminal / phosphor aesthetic
- **Fonts:** Major Mono Display (display) + IBM Plex Mono (body/mono) via `next/font/google`
- **AI:** Vertex AI — Gemini 2.5 Flash, structured JSON output with `responseSchema`
- **Validation:** Zod 4 — both input and LLM output validated
- **Rate limiting:** Upstash Redis (40 req/IP/day) — graceful no-op without Upstash
- **Tests:** Vitest — `sql-guard.ts` spec (21 tests)
- **Deploy:** Vercel (Node.js runtime, `maxDuration: 60`)

---

## Run locally

```bash
# 1. Install deps
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Fill in GOOGLE_CLOUD_PROJECT, GOOGLE_APPLICATION_CREDENTIALS (or _JSON),
# and optionally UPSTASH_REDIS_REST_URL + _TOKEN

# 3. Start dev server
pnpm dev
# → http://localhost:3000
```

---

## Tests

```bash
# Run Vitest (sql-guard spec)
pnpm test

# Type-check without building
pnpm typecheck
```

The Vitest spec is at `src/lib/__tests__/sql-guard.test.ts`. It covers:

- Plain SELECT (simple, with JOIN, with trailing semicolon, with subquery)
- INSERT / UPDATE / DELETE / DROP / TRUNCATE / ALTER → all flagged not-read-only
- Multiple statements via semicolons → flagged
- Comment injection (`--` and `/* */` containing SQL keywords) → flagged
- Dangerous keywords inside SELECT (SLEEP, BENCHMARK, INTO OUTFILE)
- Edge cases (empty string, whitespace-only, lowercase, mixed-case)

---

## Pipeline at a glance

```
POST /api/generate-sql
        │
        ▼
① Zod validate input (schema 20-20k, question 5-600, dialect enum)
        │
        ▼
② Rate limit — Upstash sliding window 40/day per IP
        │
        ▼
③ Build prompt — schema + question as DATA, not instructions
   system prompt: hard constraints + prompt-injection guard
        │
        ▼
④ Gemini 2.5 Flash — responseSchema: {sql, explanation, tables}
   temperature: 0 — maxOutputTokens: 2048
        │
        ▼
⑤ Zod validate LLM output — reject malformed responses
        │
        ▼
⑥ sql-guard analysis — heuristic safety check on generated SQL
   → statementType, isReadOnly, warnings[]
        │
        ▼
⑦ Return {sql, explanation, tables, safety}
   — SQL is NEVER executed
```

---

## Security stance

### Defended

| Threat | Measure |
|--------|---------|
| Oversized inputs | Zod caps: schema ≤ 20k chars, question ≤ 600 chars |
| Rate abuse | Upstash sliding window, 40/day per IP |
| Prompt injection in schema/question | Inputs labeled as DATA; system prompt explicitly instructs model to ignore embedded instructions; inputs capped before embedding |
| Malformed LLM output | Zod re-validates every LLM response; rejected before use |
| Non-read-only SQL generation | sql-guard detects statement type, multi-statement, comment injection, dangerous keywords |
| SQL execution | **The app never executes SQL, under any circumstances** |
| Secrets in client | Service-account keys are server-only; `.gitignore` blocks GCP key commits |
| Stack traces in client | All errors return typed codes; detail logged server-side only |

### Known gaps (honest)

- **sql-guard is a heuristic, not a parser.** Sufficiently obfuscated SQL may pass the guard. Human review before any execution is non-negotiable.
- **The model may hallucinate.** Generated SQL may reference columns or tables not present in the provided schema — especially if the schema is incomplete or ambiguous.
- **Dialect compliance is prompt-level only.** Edge cases in MySQL's strict mode or SQLite's type affinity may produce technically valid but incorrect queries.
- **Rate limit bucket is per-IP.** Shared-IP environments (corporate NAT, CDN) share one quota bucket.

See `SECURITY.md` for the full threat model.

---

## Known limits

- Schema must be 20–20,000 characters. Very large schemas (hundreds of tables) will work but may produce lower-quality SQL as the context gets crowded.
- Only three dialects: PostgreSQL, MySQL, SQLite. No MSSQL, Oracle, or BigQuery.
- The app generates SELECT only. If your question requires a CTE, window function, or aggregate that the model doesn't produce cleanly, rephrase the question.
- `maxOutputTokens: 2048` — very complex queries may be truncated. The Zod validator will catch empty sql fields.
