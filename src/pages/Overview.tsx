import React from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileText,
  FlaskConical,
  Lock,
  Play,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import { HolographicShieldWrapper } from '../components/common/HolographicShieldWrapper';
import { TooltipBadge } from '../components/common/TooltipBadge';
import { usePrivyShield } from '../context/PrivyShieldContext';
import { ALL_PII_CATEGORIES } from '../types/pii';
import { CATEGORY_THEME } from '../utils/categoryTheme';

export const Overview: React.FC = () => {
  const {
    visualEffects,
    webglSupported,
    setActivePage,
    loadSyntheticTextSample,
    setDemoGuideActive,
    setOnboardingOpen,
    totalDocumentsProcessed,
    totalEntitiesDetectedSession,
    totalEntitiesSanitizedSession,
    sessionCategoryTotals,
    documentMeta,
    detectionResult,
    appliedCount,
    residualScan,
    auditLog,
    privacyChecks,
  } = usePrivyShield();

  const handleStartDemo = () => {
    loadSyntheticTextSample();
    setDemoGuideActive(true);
    setActivePage('workspace');
  };

  const stages = [
    {
      step: '01',
      id: 'upload',
      title: 'UPLOAD',
      subtitle: 'Paste text or load TXT / CSV',
      icon: Upload,
      active: Boolean(documentMeta),
      statusText: documentMeta
        ? `${documentMeta.name} (${documentMeta.sizeBytes} B)`
        : 'Ready for input',
      onClick: () => setActivePage('workspace'),
    },
    {
      step: '02',
      id: 'detect',
      title: 'DETECT',
      subtitle: '7 modular validators & overlap guard',
      icon: ScanSearch,
      active: detectionResult.entities.length > 0,
      statusText:
        detectionResult.entities.length > 0
          ? `${detectionResult.entities.length} validated, ${detectionResult.rejectedCandidates.length} rejected`
          : 'Awaiting document',
      onClick: () => setActivePage('lab'),
    },
    {
      step: '03',
      id: 'sanitize',
      title: 'SANITIZE',
      subtitle: 'Full, partial, or pseudonymization',
      icon: Sparkles,
      active: appliedCount > 0,
      statusText:
        appliedCount > 0 ? `${appliedCount} span(s) transformed` : '3 modes available',
      onClick: () => setActivePage('workspace'),
    },
    {
      step: '04',
      id: 'verify',
      title: 'VERIFY',
      subtitle: 'Residual scan & local proof',
      icon: ShieldCheck,
      active: residualScan.status !== 'not_run',
      statusText:
        residualScan.status === 'clean'
          ? 'Passed (0 remaining)'
          : residualScan.status === 'residual_detected'
            ? `Review (${residualScan.remainingCount} left)`
            : 'Not Tested Yet',
      onClick: () => setActivePage('privacy'),
    },
  ];

  return (
    <div className="space-y-6 animate-page-enter">
      {/* 1 & 2. Hero Identity + Primary Actions */}
      <section className="glass-panel ps-shimmer-overlay section-theme-cyan relative overflow-hidden rounded-3xl p-6 sm:p-8 animate-rainbow-border">
        <div className="grid items-center gap-8 lg:grid-cols-[1.45fr_0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <Lock className="h-3.5 w-3.5 text-cyan-300" />
              <span>100% Client-Side Browser Processing • Zero Document Uploads</span>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-rainbow sm:text-4xl lg:text-5xl drop-shadow-[0_0_25px_rgba(34,211,238,0.4)]">
                PRIVYSHIELD
              </h1>
              <p className="mt-2 bg-gradient-to-r from-purple-300 via-pink-300 via-cyan-200 to-emerald-300 bg-clip-text text-lg font-semibold text-transparent sm:text-xl">
                Detect. Understand. Sanitize. Verify. Your data stays yours.
              </p>
            </div>

            <p className="max-w-2xl text-sm leading-relaxed text-slate-200 font-normal sm:text-base">
              PrivyShield automatically detects, validates, and redacts sensitive PII in your browser.
              Guarded by <strong className="text-neon-cyan">Luhn & Verhoeff checksums</strong>,
              strict boundary deduplication, and consistent in-memory pseudonymization.
              <strong className="text-neon-emerald"> No document or data ever leaves your device.</strong>
            </p>

            {/* Quick clarity feature chips */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="rounded-lg border border-cyan-400/40 bg-cyan-950/40 px-2.5 py-1 text-xs font-semibold text-cyan-200">
                ⚡ 7 PII Detectors
              </span>
              <span className="rounded-lg border border-purple-400/40 bg-purple-950/40 px-2.5 py-1 text-xs font-semibold text-purple-200">
                🔒 Luhn & Verhoeff
              </span>
              <span className="rounded-lg border border-emerald-400/40 bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                🛡️ Pure In-Memory
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setActivePage('workspace')}
                className="btn-glow inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/50 transition hover:brightness-110 hover:shadow-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-300 animate-neon-pulse"
              >
                <FileText className="h-4 w-4" />
                Start Sanitizing
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleStartDemo}
                className="btn-glow inline-flex items-center gap-2 rounded-2xl border border-cyan-400/50 bg-cyan-500/15 px-5 py-3 text-sm font-semibold text-neon-cyan transition hover:bg-cyan-500/25 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <Play className="h-4 w-4" />
                Try Demo with Synthetic Data
              </button>

              <button
                type="button"
                onClick={() => setOnboardingOpen(true)}
                className="btn-glow inline-flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                Interactive Guide
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <HolographicShieldWrapper
              visualEffects={visualEffects}
              webglSupported={webglSupported}
              variant="hero"
              statusState="neutral"
              className="h-72 w-72 sm:h-80 sm:w-80 lg:h-96 lg:w-96"
            />
            <p className="mt-2 text-center text-xs text-slate-300 font-medium">
              3D Quantum Cyber Shield • Verify real security in{' '}
              <button
                type="button"
                onClick={() => setActivePage('privacy')}
                className="text-neon-cyan underline decoration-cyan-500/50 hover:text-white font-semibold transition"
              >
                Privacy Center →
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* 3. Four-Stage Interactive Workflow */}
      <section aria-labelledby="workflow-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="workflow-heading" className="text-sm font-semibold uppercase tracking-wider text-heading-cyan">
            Four-Stage Privacy Workflow
          </h2>
          <span className="text-xs text-slate-400">Click any stage to open its module</span>
        </div>

        <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={stage.onClick}
                className={`glass-panel glass-card-hover neon-card group relative flex flex-col justify-between rounded-2xl p-4 text-left focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                  stage.active ? 'border-purple-400/50 animate-glow-ring' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                  stage.active
                      ? 'border-cyan-400/40 bg-cyan-500/15 text-neon-cyan'
                      : 'border-slate-700 bg-slate-900/70 text-slate-400 group-hover:text-neon-cyan group-hover:border-purple-500/40 group-hover:bg-purple-500/10'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-neon-purple">
                        STAGE {stage.step}
                      </span>
                      <h3 className="text-sm font-bold text-heading-bright">{stage.title}</h3>
                    </div>
                  </div>
                  {idx < stages.length - 1 && (
                    <ArrowRight className="hidden h-4 w-4 text-slate-600 lg:block" />
                  )}
                </div>

                <p className="mt-3 text-xs text-slate-300">{stage.subtitle}</p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[11px]">
                  <span className={stage.active ? 'font-medium text-teal-300' : 'text-slate-400'}>
                    {stage.statusText}
                  </span>
                  <span className="text-neon-cyan opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                    Open →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Actual Session Statistics (Strictly Real Data Only) */}
      <section aria-labelledby="stats-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="stats-heading" className="text-sm font-semibold uppercase tracking-wider text-heading-purple">
            Live Session Statistics
          </h2>
          <span className="text-xs text-slate-400">
            Measured directly from documents processed in this browser session
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-panel glass-card-hover neon-card rounded-2xl p-4">
            <p className="text-xs font-medium text-slate-400">Documents Processed</p>
            <p className="mt-1 text-3xl font-bold text-white">{totalDocumentsProcessed}</p>
            <p className="mt-1 text-xs text-slate-400">
              {documentMeta ? `Active: ${documentMeta.name}` : 'No document loaded yet'}
            </p>
          </div>

          <div className="glass-panel glass-card-hover neon-card rounded-2xl p-4">
            <p className="text-xs font-medium text-slate-400">Validated PII Detected</p>
            <p className="mt-1 text-3xl font-bold text-neon-cyan">{totalEntitiesDetectedSession}</p>
            <p className="mt-1 text-xs text-slate-400">
              Current doc: {detectionResult.entities.length} confirmed •{' '}
              {detectionResult.rejectedCandidates.length} false positives rejected
            </p>
          </div>

          <div className="glass-panel glass-card-hover neon-card rounded-2xl p-4">
            <p className="text-xs font-medium text-slate-400">Entities Sanitized</p>
            <p className="mt-1 text-3xl font-bold text-neon-purple">{totalEntitiesSanitizedSession}</p>
            <p className="mt-1 text-xs text-slate-400">
              Current doc: {appliedCount} sanitized locally
            </p>
          </div>

          <div className="glass-panel glass-card-hover neon-card rounded-2xl p-4">
            <p className="text-xs font-medium text-slate-400">Privacy Verification</p>
            <p className="mt-1 text-lg font-bold text-white">
              {privacyChecks.networkTest === 'passed'
                ? 'Network Check Passed'
                : privacyChecks.networkTest === 'failed'
                  ? 'Check Failed'
                  : 'Not Tested Yet'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Residual scan:{' '}
              {residualScan.status === 'clean'
                ? 'Clean (0 supported left)'
                : residualScan.status === 'residual_detected'
                  ? `${residualScan.remainingCount} remaining`
                  : 'Not run'}
            </p>
          </div>
        </div>
      </section>

      {/* 5 & 6. Supported PII Categories + Recent Session Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel hover-section section-theme-cyan rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-heading-cyan section-heading">
              <FlaskConical className="h-4 w-4 text-neon-cyan" />
              Supported PII Detectors (7)
            </h2>
            <button
              type="button"
              onClick={() => setActivePage('lab')}
              className="text-xs font-medium text-neon-cyan transition hover:brightness-125"
            >
              Test in Detection Lab →
            </button>
          </div>

          <div className="space-y-2.5">
            {ALL_PII_CATEGORIES.map((cat) => {
              const cfg = CATEGORY_THEME[cat];
              const Icon = cfg.icon;
              const sessionCount = sessionCategoryTotals[cat] ?? 0;
              return (
                <div
                  key={cat}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/45 px-3 py-2.5 row-hover"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold ${cfg.badgeClasses}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cfg.shortTag}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-100">{cfg.label}</p>
                      <p className="text-xs text-slate-400">{cfg.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-200">{sessionCount}</span>
                    <p className="text-[10px] text-slate-500">session</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Activity & Privacy Architecture */}
        <div className="space-y-6">
          <section className="glass-panel hover-section section-theme-purple rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-heading-purple section-heading">
                <Activity className="h-4 w-4 text-neon-purple" />
                Recent Session Activity
              </h2>
              <button
                type="button"
                onClick={() => setActivePage('audit')}
                className="text-xs font-medium text-neon-cyan transition hover:brightness-125"
              >
                Full Audit Log →
              </button>
            </div>

            {auditLog.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700/80 bg-slate-900/40 p-5 text-center">
                <p className="text-sm font-medium text-slate-300">No session activity recorded yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Activity events appear automatically after you upload a file, paste text, or run the
                  synthetic demo. Raw PII is never logged.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {auditLog.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/45 px-3 py-2 text-xs row-hover"
                  >
                    <div>
                      <span className="font-semibold text-cyan-300">{item.eventType}</span>
                      <p className="mt-0.5 text-slate-300">{item.summary}</p>
                    </div>
                    <time className="shrink-0 text-[11px] text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="glass-panel hover-section section-theme-emerald rounded-2xl p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-heading-emerald section-heading">
              <Cpu className="h-4 w-4 text-neon-emerald" />
              Privacy & Validation Architecture
            </h2>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
                <span>
                  <strong>Local Execution:</strong> Processing runs in-browser and via Web Workers.
                  Original document contents never leave your device.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
                <span>
                  <strong>Checksum Validation:</strong> <TooltipBadge term="Luhn" label="Luhn" /> and{' '}
                  <TooltipBadge term="Verhoeff" label="Verhoeff" /> reject synthetic noise before
                  acceptance.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
                <span>
                  <strong>Consistent Mapping:</strong>{' '}
                  <TooltipBadge term="Pseudonymization" label="Pseudonymization" /> uses an
                  in-memory Map with separate category namespaces.
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
