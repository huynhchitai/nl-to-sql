import type { SafetyResult } from '@/lib/types';

interface SafetyPanelProps {
  safety: SafetyResult;
}

export default function SafetyPanel({ safety }: SafetyPanelProps) {
  const { isReadOnly, statementType, warnings } = safety;

  const panelClass = isReadOnly
    ? 'safety-ok'
    : warnings.length > 0
    ? 'safety-error'
    : 'safety-warn';

  const icon = isReadOnly ? '✓' : '✗';
  const statusText = isReadOnly
    ? 'READ-ONLY — SAFE TO REVIEW'
    : 'NOT READ-ONLY — DO NOT EXECUTE';

  return (
    <div className={`${panelClass} p-4 rounded-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span
            className="text-xl font-bold leading-none"
            aria-hidden
          >
            {icon}
          </span>
          <div>
            <div className="font-display text-sm tracking-wider uppercase">
              safety verdict
            </div>
            <div className="text-xs opacity-80 font-mono mt-0.5">
              {statusText}
            </div>
          </div>
        </div>
        <span className="crt-badge text-xs">
          {statementType}
        </span>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mt-3 border-t border-current border-opacity-20 pt-3">
          <div className="text-xs uppercase tracking-wider opacity-70 mb-2 font-mono">
            warnings ({warnings.length})
          </div>
          <ul className="space-y-1.5">
            {warnings.map((w, i) => (
              <li key={i} className="flex gap-2 text-xs font-mono leading-relaxed">
                <span className="opacity-60 shrink-0">▶</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Human review reminder */}
      <div className="mt-3 pt-3 border-t border-current border-opacity-20 text-xs font-mono opacity-60">
        {isReadOnly
          ? 'sql-guard passed — still review before running against real data.'
          : 'this query was flagged. do not execute on any database.'}
      </div>
    </div>
  );
}
