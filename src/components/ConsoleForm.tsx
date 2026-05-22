'use client';

import { useState, useRef, useId } from 'react';
import SqlOutput from './SqlOutput';
import SafetyPanel from './SafetyPanel';
import type { GenerateSqlApiResponse } from '@/lib/types';

const SAMPLE_SCHEMA = `CREATE TABLE users (
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

CREATE TABLE order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INT REFERENCES orders(id),
  product    TEXT NOT NULL,
  quantity   INT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL
);`;

const SAMPLE_QUESTION =
  'Show me the top 5 users by total spending, including their name, email, and total spent — only for completed orders.';

type Dialect = 'postgres' | 'mysql' | 'sqlite';

export default function ConsoleForm() {
  const schemaId = useId();
  const questionId = useId();
  const dialectId = useId();

  const [schema, setSchema] = useState('');
  const [question, setQuestion] = useState('');
  const [dialect, setDialect] = useState<Dialect>('postgres');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateSqlApiResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function loadSample() {
    setSchema(SAMPLE_SCHEMA);
    setQuestion(SAMPLE_QUESTION);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema, question, dialect }),
      });

      const data: GenerateSqlApiResponse = await res.json();
      setResult(data);

      // Scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch {
      setErrorMsg('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    schema.trim().length >= 20 &&
    question.trim().length >= 5 &&
    !loading;

  return (
    <div className="space-y-6">
      {/* Sample data loader */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-mono"
          style={{ color: 'var(--crt-text-muted)' }}
        >
          ∷ no data? load a sample
        </span>
        <button
          type="button"
          onClick={loadSample}
          className="crt-button-ghost"
        >
          load sample schema
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Schema input */}
        <div className="terminal-window">
          <div className="terminal-titlebar">
            <div className="terminal-dot terminal-dot-red" />
            <div className="terminal-dot terminal-dot-yellow" />
            <div className="terminal-dot terminal-dot-green" />
            <span className="terminal-title">schema-input.sql — DDL or plain description</span>
          </div>
          <div className="p-4">
            <label htmlFor={schemaId} className="crt-label">
              Database Schema
              <span
                className="ml-2 text-xs normal-case tracking-normal"
                style={{ color: 'var(--crt-text-muted)' }}
              >
                (20–20,000 chars)
              </span>
            </label>
            <textarea
              id={schemaId}
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              className="crt-input"
              rows={12}
              placeholder={`-- Paste your DDL here, e.g.\nCREATE TABLE users (\n  id   SERIAL PRIMARY KEY,\n  name TEXT NOT NULL\n);\n\n-- Or describe your tables in plain English:\n-- users: id, name, email, created_at\n-- orders: id, user_id, total, status`}
              spellCheck={false}
              autoComplete="off"
              aria-describedby={`${schemaId}-hint`}
            />
            <div
              id={`${schemaId}-hint`}
              className="mt-1.5 text-xs font-mono"
              style={{ color: 'var(--crt-text-muted)' }}
            >
              {schema.length} / 20,000 chars
            </div>
          </div>
        </div>

        {/* Dialect + Question row */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[200px_1fr]">
          {/* Dialect */}
          <div>
            <label htmlFor={dialectId} className="crt-label">
              SQL Dialect
            </label>
            <select
              id={dialectId}
              value={dialect}
              onChange={(e) => setDialect(e.target.value as Dialect)}
              className="crt-select w-full"
            >
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>

          {/* Question */}
          <div>
            <label htmlFor={questionId} className="crt-label">
              Question in Plain English
              <span
                className="ml-2 text-xs normal-case tracking-normal"
                style={{ color: 'var(--crt-text-muted)' }}
              >
                (5–600 chars)
              </span>
            </label>
            <input
              id={questionId}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="crt-input"
              placeholder="e.g. Show me the top 10 users by total spending in the last 30 days"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={!canSubmit}
            className="crt-button"
          >
            {loading ? (
              <>
                <span
                  className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"
                  aria-hidden
                />
                generating
              </>
            ) : (
              <>
                <span aria-hidden>▶</span>
                generate sql
              </>
            )}
          </button>

          {!loading && result && (
            <button
              type="button"
              onClick={() => { setResult(null); setErrorMsg(null); }}
              className="crt-button-ghost"
            >
              clear
            </button>
          )}
        </div>
      </form>

      {/* Error state */}
      {errorMsg && (
        <div className="safety-error p-4 rounded-sm font-mono text-sm">
          <span className="font-bold">error:</span> {errorMsg}
        </div>
      )}

      {/* Result */}
      {result && (
        <div ref={resultRef} className="space-y-5 pt-2">
          <hr className="crt-rule" />

          {/* API error */}
          {!result.ok && (
            <div className="safety-error p-4 rounded-sm">
              <div className="font-display text-sm tracking-wider uppercase mb-1">
                generation failed
              </div>
              <div className="font-mono text-xs mt-1">
                code: {result.error}
              </div>
              <div className="font-mono text-sm mt-1 opacity-80">
                {result.message}
              </div>
            </div>
          )}

          {/* Success */}
          {result.ok && (
            <>
              {/* Safety verdict — prominent */}
              <div>
                <div className="crt-label mb-3">
                  Safety Verdict
                </div>
                <SafetyPanel safety={result.safety} />
              </div>

              {/* SQL output */}
              <div>
                <div className="crt-label mb-3">
                  Generated SQL
                </div>
                <SqlOutput sql={result.sql} dialect={dialect} />
              </div>

              {/* Tables touched */}
              {result.tables.length > 0 && (
                <div>
                  <div className="crt-label mb-2">Tables Referenced</div>
                  <div className="flex flex-wrap gap-2">
                    {result.tables.map((t) => (
                      <span
                        key={t}
                        className="crt-badge"
                        style={{
                          color: 'var(--crt-amber-dim)',
                          borderColor: 'var(--crt-border)',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="terminal-window">
                <div className="terminal-titlebar">
                  <div className="terminal-dot terminal-dot-red" />
                  <div className="terminal-dot terminal-dot-yellow" />
                  <div className="terminal-dot terminal-dot-green" />
                  <span className="terminal-title">explanation.txt</span>
                </div>
                <div className="p-5">
                  <p
                    className="font-mono text-sm leading-relaxed"
                    style={{ color: 'var(--crt-text-soft)' }}
                  >
                    {result.explanation}
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div
                className="text-xs font-mono leading-relaxed border border-current p-3"
                style={{ color: 'var(--crt-text-muted)', borderColor: 'var(--crt-border)' }}
              >
                <strong style={{ color: 'var(--crt-amber-dim)' }}>⚠ disclaimer:</strong>{' '}
                this app never executes sql. generated queries are for review only — always
                validate against your actual schema and test in a safe environment before
                running on production data. sql-guard is a heuristic, not a parser.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
