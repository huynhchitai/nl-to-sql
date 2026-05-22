'use client';

import { useState } from 'react';

interface SqlOutputProps {
  sql: string;
  dialect: string;
}

export default function SqlOutput({ sql, dialect }: SqlOutputProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  }

  // Basic keyword highlighting via spans
  const highlighted = highlightSql(sql);

  return (
    <div className="terminal-window">
      <div className="terminal-titlebar">
        <div className="terminal-dot terminal-dot-red" />
        <div className="terminal-dot terminal-dot-yellow" />
        <div className="terminal-dot terminal-dot-green" />
        <span className="terminal-title">{dialect.toUpperCase()} — generated-query.sql</span>
        <div className="ml-auto">
          <button
            onClick={handleCopy}
            className="crt-button-ghost text-xs py-1 px-3"
            aria-label="Copy SQL to clipboard"
          >
            {copied ? '✓ copied' : 'copy'}
          </button>
        </div>
      </div>
      <div className="terminal-body p-0 overflow-auto">
        <pre
          className="sql-output text-sm p-5"
          aria-label="Generated SQL query"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </div>
  );
}

// ─── Very lightweight SQL syntax highlighter ─────────────────────────────────
// Uses only CSS variable colors — no external dependency

const KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
  'FULL', 'CROSS', 'ON', 'AND', 'OR', 'NOT', 'IN', 'BETWEEN', 'LIKE',
  'IS', 'NULL', 'AS', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT',
  'OFFSET', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'COALESCE', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'WITH',
  'UNION', 'INTERSECT', 'EXCEPT', 'ALL', 'EXISTS', 'OVER', 'PARTITION',
  'ROWS', 'RANGE', 'DESC', 'ASC', 'TRUE', 'FALSE',
];

const KW_RE = new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'gi');

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightSql(sql: string): string {
  const escaped = escapeHtml(sql);

  return escaped
    // Keywords — amber
    .replace(
      KW_RE,
      '<span style="color:var(--crt-amber);font-weight:600">$1</span>'
    )
    // String literals — muted warm
    .replace(
      /'[^']*'/g,
      (m) => `<span style="color:#B5A060">${m}</span>`
    )
    // Numbers — pale amber
    .replace(
      /\b(\d+(\.\d+)?)\b/g,
      '<span style="color:#C89A40">$1</span>'
    )
    // Line comments -- green dim
    .replace(
      /(--[^\n]*)/g,
      '<span style="color:var(--crt-green-dim);font-style:italic">$1</span>'
    )
    // Block comments /* */ — green dim
    .replace(
      /(\/\*[\s\S]*?\*\/)/g,
      '<span style="color:var(--crt-green-dim);font-style:italic">$1</span>'
    );
}
