import type { Metadata } from 'next';
import Link from 'next/link';
import FolioBar from '@/components/FolioBar';
import ConsoleForm from '@/components/ConsoleForm';

export const metadata: Metadata = {
  title: 'NL → SQL — Tai Huynh',
  description:
    'Describe a query in plain English — get safe, read-only SQL for your schema. Powered by Gemini 2.5 Flash.',
};

export default function HomePage() {
  return (
    <>
      <FolioBar />

      <main className="mx-auto max-w-5xl px-4 sm:px-8 pb-24">
        {/* ── Hero ── */}
        <header className="pt-14 sm:pt-20 pb-12">
          {/* Eyebrow */}
          <div
            className="reveal reveal-1 text-xs font-mono tracking-[0.2em] uppercase mb-5"
            style={{ color: 'var(--crt-amber-dim)' }}
          >
            portfolio project #10 — Tai Huynh
          </div>

          {/* Title */}
          <h1
            className="reveal reveal-2 font-display leading-none mb-6"
            style={{
              fontSize: 'clamp(2.8rem, 10vw, 6rem)',
              color: 'var(--crt-amber)',
              textShadow: '0 0 40px var(--crt-amber-glow)',
            }}
          >
            nl → sql
            <span
              className="inline-block w-3 h-8 sm:h-12 ml-3 align-middle animate-blink"
              style={{ background: 'var(--crt-amber)', verticalAlign: 'middle' }}
              aria-hidden
            />
          </h1>

          {/* Pitch */}
          <p
            className="reveal reveal-3 font-mono text-base sm:text-lg leading-relaxed max-w-2xl"
            style={{ color: 'var(--crt-text-soft)' }}
          >
            Describe a query in plain English — get safe, read-only SQL for your schema.
            No execution. No write access. Every output analyzed by a heuristic safety guard.
          </p>

          {/* Never executes notice */}
          <div
            className="reveal reveal-4 mt-6 inline-flex items-center gap-3 px-4 py-2.5 text-xs font-mono tracking-wider uppercase"
            style={{
              background: 'var(--crt-ok-bg)',
              border: '1px solid var(--crt-green-dim)',
              color: 'var(--crt-ok)',
            }}
          >
            <span aria-hidden>■</span>
            this app never executes sql — generation only
          </div>

          {/* Sup links */}
          <div className="reveal reveal-5 mt-8 flex items-center gap-6 text-xs font-mono">
            <Link
              href="/how-it-works"
              className="transition-colors"
              style={{ color: 'var(--crt-amber-dim)' }}
            >
              how it works →
            </Link>
            <a
              href="https://github.com/huynhchitai"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors"
              style={{ color: 'var(--crt-text-muted)' }}
            >
              github
            </a>
            <a
              href="mailto:huynhchitai.070306@gmail.com?subject=Freelance%20enquiry%20—%20NL%20to%20SQL"
              className="transition-colors"
              style={{ color: 'var(--crt-text-muted)' }}
            >
              hire me
            </a>
          </div>
        </header>

        {/* ── Divider ── */}
        <hr className="crt-rule reveal reveal-5" />

        {/* ── Console ── */}
        <section
          className="reveal reveal-6 mt-8"
          aria-label="SQL generation console"
        >
          <ConsoleForm />
        </section>
      </main>

      {/* ── Footer ── */}
      <footer
        className="border-t"
        style={{ borderColor: 'var(--crt-border)' }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p
            className="text-xs font-mono"
            style={{ color: 'var(--crt-text-muted)' }}
          >
            tai huynh · 2026 · nl→sql · built with next.js + vertex ai
          </p>
          <p className="text-xs font-mono" style={{ color: 'var(--crt-text-muted)' }}>
            <a
              href="https://github.com/huynhchitai"
              className="hover:text-amber-500 transition-colors"
              style={{ color: 'var(--crt-text-muted)' }}
            >
              huynhchitai.com
            </a>
            <span className="mx-2">·</span>
            <a
              href="https://github.com/huynhchitai"
              className="transition-colors"
              style={{ color: 'var(--crt-text-muted)' }}
            >
              github
            </a>
            <span className="mx-2">·</span>
            <a
              href="mailto:huynhchitai.070306@gmail.com"
              className="transition-colors"
              style={{ color: 'var(--crt-text-muted)' }}
            >
              email
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
