import React, { useMemo, useState } from 'react';
import { Activity, Download, FileJson, FileText, Filter, Shield } from 'lucide-react';
import { usePrivyShield } from '../context/PrivyShieldContext';
import { ALL_PII_CATEGORIES } from '../types/pii';
import { CATEGORY_THEME } from '../utils/categoryTheme';

type LogFilter = 'all' | 'detection' | 'sanitization' | 'exports' | 'privacy';

export const AuditReports: React.FC = () => {
  const {
    auditLog,
    sessionCategoryTotals,
    totalDocumentsProcessed,
    totalEntitiesDetectedSession,
    totalEntitiesSanitizedSession,
    exportAuditReport,
    residualScan,
  } = usePrivyShield();

  const [filter, setFilter] = useState<LogFilter>('all');

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return auditLog;
    return auditLog.filter((entry) => {
      if (filter === 'detection') {
        return entry.eventType === 'SCAN_COMPLETED' || entry.eventType === 'SAMPLE_LOADED' || entry.eventType === 'FILE_UPLOADED';
      }
      if (filter === 'sanitization') {
        return (
          entry.eventType === 'SANITIZATION_COMPLETED' ||
          entry.eventType === 'MODE_CHANGED' ||
          entry.eventType === 'POLICY_UPDATED' ||
          entry.eventType === 'PSEUDONYM_MAP_RESET'
        );
      }
      if (filter === 'exports') return entry.eventType === 'FILE_EXPORTED';
      return (
        entry.eventType === 'RESIDUAL_SCAN_COMPLETED' || entry.eventType === 'PRIVACY_TEST_RUN'
      );
    });
  }, [auditLog, filter]);

  const maxCategoryValue = Math.max(
    1,
    ...ALL_PII_CATEGORIES.map((c) => sessionCategoryTotals[c] ?? 0)
  );

  // Build clean SVG donut segments from real sessionCategoryTotals
  const totalCategorySum = ALL_PII_CATEGORIES.reduce(
    (sum, cat) => sum + (sessionCategoryTotals[cat] ?? 0),
    0
  );

  const donutSegments = useMemo(() => {
    if (totalCategorySum === 0) return [];
    const circumference = 2 * Math.PI * 52;
    let offset = 0;
    return ALL_PII_CATEGORIES.filter((cat) => (sessionCategoryTotals[cat] ?? 0) > 0).map((cat) => {
      const val = sessionCategoryTotals[cat] ?? 0;
      const fraction = val / totalCategorySum;
      const dash = fraction * circumference;
      const segment = {
        cat,
        val,
        color: CATEGORY_THEME[cat].barColor,
        dashArray: `${dash} ${circumference - dash}`,
        dashOffset: -offset,
      };
      offset += dash;
      return segment;
    });
  }, [sessionCategoryTotals, totalCategorySum]);

  return (
    <div className="space-y-6 animate-page-enter">
      <header className="glass-panel ps-shimmer-overlay section-theme-amber flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-rainbow">
            <Activity className="h-5 w-5 text-purple-400" />
            Session Audit Log & Privacy Reports
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Zero raw PII, zero document contents, and zero pseudonym mappings are ever stored or
            exported in audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportAuditReport('json')}
            className="btn-glow inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-semibold text-neon-cyan transition hover:bg-cyan-500/25"
          >
            <FileJson className="h-4 w-4" />
            Export Audit JSON
          </button>
          <button
            type="button"
            onClick={() => exportAuditReport('md')}
            className="btn-glow inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:brightness-110"
          >
            <Download className="h-4 w-4" />
            Export Report (.md)
          </button>
        </div>
      </header>

      {/* Session Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel neon-card rounded-2xl p-4">
          <p className="text-xs text-slate-400">Documents Sanitized</p>
          <p className="mt-1 text-2xl font-bold text-white">{totalDocumentsProcessed}</p>
        </div>
        <div className="glass-panel neon-card rounded-2xl p-4">
          <p className="text-xs text-slate-400">Total Entities Detected</p>
          <p className="mt-1 text-2xl font-bold text-neon-cyan">{totalEntitiesDetectedSession}</p>
        </div>
        <div className="glass-panel neon-card rounded-2xl p-4">
          <p className="text-xs text-slate-400">Total Entities Sanitized</p>
          <p className="mt-1 text-2xl font-bold text-neon-purple">{totalEntitiesSanitizedSession}</p>
        </div>
        <div className="glass-panel neon-card rounded-2xl p-4">
          <p className="text-xs text-slate-400">Latest Residual Scan</p>
          <p className="mt-1 text-lg font-bold text-neon-emerald">
            {residualScan.status === 'clean'
              ? 'Clean (0 left)'
              : residualScan.status === 'residual_detected'
                ? `${residualScan.remainingCount} Flagged`
                : 'Not Run'}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <section className="glass-panel hover-section section-theme-purple rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-heading-purple section-heading">Category Detection Volume (Session)</h2>
          <div className="space-y-3">
            {ALL_PII_CATEGORIES.map((cat) => {
              const val = sessionCategoryTotals[cat] ?? 0;
              const pct = Math.round((val / maxCategoryValue) * 100);
              const cfg = CATEGORY_THEME[cat];
              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>{cfg.label}</span>
                    <span className="font-mono font-semibold text-white">{val}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/80">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${val > 0 ? Math.max(4, pct) : 0}%`,
                        backgroundColor: cfg.barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Donut Chart */}
        <section className="glass-panel hover-section section-theme-cyan flex flex-col justify-between rounded-2xl p-5">
          <h2 className="text-sm font-bold text-heading-cyan section-heading">Category Share Distribution</h2>

          {totalCategorySum === 0 ? (
            <div className="my-auto py-8 text-center text-xs text-slate-400">
              <Shield className="mx-auto mb-2 h-8 w-8 text-slate-600" />
              Process a document or synthetic sample to populate category distribution charts.
            </div>
          ) : (
            <div className="my-4 flex flex-wrap items-center justify-center gap-8">
              <svg role="img" width="144" height="144" viewBox="0 0 144 144" aria-label="PII category share chart">
                <title>Category Share Distribution</title>
                <desc>{donutSegments.map((s) => `${CATEGORY_THEME[s.cat]?.label ?? s.cat}: ${s.val}`).join(', ')}</desc>
                <circle
                  cx="72"
                  cy="72"
                  r="52"
                  fill="transparent"
                  stroke="#1e293b"
                  strokeWidth="18"
                />
                {donutSegments.map((seg) => (
                  <circle
                    key={seg.cat}
                    cx="72"
                    cy="72"
                    r="52"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="18"
                    strokeDasharray={seg.dashArray}
                    strokeDashoffset={seg.dashOffset}
                    transform="rotate(-90 72 72)"
                  />
                ))}
                <text
                  x="72"
                  y="70"
                  textAnchor="middle"
                  className="fill-white text-xl font-bold"
                >
                  {totalCategorySum}
                </text>
                <text
                  x="72"
                  y="88"
                  textAnchor="middle"
                  className="fill-slate-400 text-[10px]"
                >
                  Total PII
                </text>
              </svg>

              <div className="space-y-1.5 text-xs">
                {donutSegments.map((seg) => (
                  <div key={seg.cat} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-slate-300">{CATEGORY_THEME[seg.cat].label}:</span>
                    <strong className="text-white">{seg.val}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Timeline */}
      <section className="glass-panel hover-section section-theme-amber rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-heading-pink section-heading">
            <FileText className="h-4 w-4 text-neon-pink" />
            Local Session Activity Timeline ({filteredLogs.length})
          </h2>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            {(['all', 'detection', 'sanitization', 'privacy', 'exports'] as LogFilter[]).map(
              (f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-2.5 py-1 capitalize transition ${
                    filter === f
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              )
            )}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
            No matching audit events recorded yet.
          </div>
        ) : (
          <ol className="space-y-2">
            {filteredLogs.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col justify-between gap-1 rounded-xl border border-slate-800/80 bg-slate-900/50 px-4 py-2.5 text-xs sm:flex-row sm:items-center"
              >
                <div>
                  <span className="mr-2 rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-cyan-300">
                    {entry.eventType}
                  </span>
                  <span className="text-slate-200">{entry.summary}</span>
                </div>
                <time className="shrink-0 font-mono text-[11px] text-slate-500">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};
