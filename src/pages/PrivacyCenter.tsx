import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  HardDrive,
  HelpCircle,
  Lock,
  Play,
  RefreshCw,
  ShieldCheck,
  Sliders,
  WifiOff,
} from 'lucide-react';
import { HolographicShieldWrapper } from '../components/common/HolographicShieldWrapper';
import { usePrivyShield } from '../context/PrivyShieldContext';
import { formatPartialMask } from '../engine/redactor';
import {
  ALL_PII_CATEGORIES,
  CategoryPolicySetting,
  PIICategory,
  VerificationState,
} from '../types/pii';
import { CATEGORY_THEME } from '../utils/categoryTheme';

const SYNTHETIC_POLICY_EXAMPLES: Record<PIICategory, string> = {
  EMAIL: 'rahul.verma@example.in',
  PHONE: '9876543210',
  IPV4: '192.168.10.45',
  IPV6: '2001:db8::1',
  PAN: 'ABCPK1234M',
  AADHAAR: '2345 6789 0123',
  CREDIT_CARD: '4111-1111-1111-1111',
};

const PSEUDO_EXAMPLES: Record<PIICategory, string> = {
  EMAIL: 'EMAIL_01',
  PHONE: 'PHONE_01',
  IPV4: 'IPV4_01',
  IPV6: 'IPV6_01',
  PAN: 'PAN_01',
  AADHAAR: 'AADHAAR_01',
  CREDIT_CARD: 'CARD_01',
};

function renderPreviewForSetting(cat: PIICategory, setting: CategoryPolicySetting, defaultMode: string) {
  const effective = setting === 'default' ? defaultMode : setting;
  if (effective === 'full') return '[REDACTED]';
  if (effective === 'partial') return formatPartialMask(cat, SYNTHETIC_POLICY_EXAMPLES[cat]);
  return PSEUDO_EXAMPLES[cat];
}

function StatusPill({ state }: { state: VerificationState }) {
  switch (state) {
    case 'passed':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-teal-400/40 bg-teal-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-teal-200">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Passed
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-rose-200">
          <AlertTriangle className="h-3.5 w-3.5" />
          Failed
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-200">
          <Clock className="h-3.5 w-3.5" />
          Pending
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
          <HelpCircle className="h-3.5 w-3.5" />
          Not Tested
        </span>
      );
  }
}

export const PrivacyCenter: React.FC = () => {
  const {
    visualEffects,
    webglSupported,
    categoryPolicies,
    defaultMode,
    updateCategoryPolicies,
    privacyChecks,
    runPrivacyNetworkCheck,
    refreshOfflineCheck,
    detectionResult,
    appliedCount,
    residualScan,
    setActivePage,
  } = usePrivyShield();

  const states = [
    privacyChecks.networkTest,
    privacyChecks.residualScan,
    privacyChecks.offlineCache,
    privacyChecks.validationSuite,
  ];
  const passedCount = states.filter((s) => s === 'passed').length;
  const hasFailure = states.some((s) => s === 'failed');
  const shieldState = hasFailure ? 'warning' : passedCount === 4 ? 'passed' : 'neutral';
  const progressPct = Math.round((passedCount / states.length) * 100);

  const handlePolicyChange = (cat: PIICategory, value: CategoryPolicySetting) => {
    updateCategoryPolicies({
      ...categoryPolicies,
      [cat]: value,
    });
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Privacy Proof Center */}
      <section className="glass-panel ps-shimmer-overlay section-theme-rose rounded-3xl p-6 animate-rainbow-border">
        <div className="grid items-center gap-6 lg:grid-cols-[1.5fr_0.75fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/50 bg-purple-500/15 px-3 py-1 text-xs font-medium text-purple-200 animate-neon-pulse">
              <Lock className="h-3.5 w-3.5" />
              <span>Privacy Proof Center • Verified Checks vs Architecture Claims</span>
            </div>
            <h1 className="text-2xl font-bold text-rainbow">
              Client-Side Privacy Verification & Control
            </h1>
            <p className="text-sm text-slate-300">
              Green verification states appear <strong>only after real checks execute and pass</strong>.
              Static hosting delivers application assets initially; original document contents are
              never transmitted to external APIs or stored on servers.
            </p>

            {/* Summary counts */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
                <span className="text-slate-400">Active Doc Entities</span>
                <p className="mt-0.5 text-xl font-bold text-cyan-300">
                  {detectionResult.entities.length} detected / {appliedCount} sanitized
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
                <span className="text-slate-400">Executed Checks Passed</span>
                <p className="mt-0.5 text-xl font-bold text-white">
                  {passedCount} / {states.length} ({progressPct}%)
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
                <span className="text-slate-400">Observed Processing Requests</span>
                <p className="mt-0.5 text-xl font-bold text-teal-300">
                  {privacyChecks.networkTest === 'not_tested'
                    ? 'Not Tested'
                    : privacyChecks.networkRequestsObservedDuringScan}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            <HolographicShieldWrapper
              visualEffects={visualEffects}
              webglSupported={webglSupported}
              variant="proof"
              statusState={shieldState}
              className="h-44 w-44"
            />
            <div className="mt-2 text-center text-xs">
              <span className="font-semibold text-slate-200">
                Verification Completion: {progressPct}%
              </span>
              <div className="mt-1.5 h-2 w-44 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full transition-all ${
                    hasFailure ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-400 to-teal-400'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4 Explicit Verification Cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="neon-card section-theme-cyan rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-heading-cyan">1. Live Network Privacy Test</h2>
              <StatusPill state={privacyChecks.networkTest} />
            </div>
            <p className="text-xs text-slate-300">{privacyChecks.networkTestDetails}</p>
            <button
              type="button"
              onClick={() => void runPrivacyNetworkCheck()}
              className="btn-glow inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:brightness-110"
            >
              <Play className="h-3.5 w-3.5" />
              Run Network Privacy Test
            </button>
          </div>

          <div className="neon-card section-theme-purple rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-heading-purple">2. Residual PII Scanner</h2>
              <StatusPill state={privacyChecks.residualScan} />
            </div>
            <p className="text-xs text-slate-300">{privacyChecks.residualScanDetails}</p>
            <p className="text-[11px] text-slate-400">{residualScan.disclaimer}</p>
            <button
              type="button"
              onClick={() => setActivePage('workspace')}
              className="btn-glow inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-neon-purple hover:border-purple-400/50"
            >
              Open Sanitize Workspace →
            </button>
          </div>

          <div className="neon-card section-theme-emerald rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-heading-emerald">
                <WifiOff className="h-4 w-4 text-neon-emerald" />
                3. Offline App Shell Cache (PWA)
              </h2>
              <StatusPill state={privacyChecks.offlineCache} />
            </div>
            <p className="text-xs text-slate-300">{privacyChecks.offlineCacheDetails}</p>
            <button
              type="button"
              onClick={() => void refreshOfflineCheck()}
              className="btn-glow inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-neon-emerald hover:border-emerald-400/50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Re-check Cache Status
            </button>
          </div>

          <div className="neon-card section-theme-amber rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-heading-amber">
                <ShieldCheck className="h-4 w-4 text-neon-amber" />
                4. Automated Validation Benchmark
              </h2>
              <StatusPill state={privacyChecks.validationSuite} />
            </div>
            <p className="text-xs text-slate-300">{privacyChecks.validationSuiteDetails}</p>
            <button
              type="button"
              onClick={() => setActivePage('lab')}
              className="btn-glow inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-neon-amber hover:border-amber-400/50"
            >
              Run Benchmark in Detection Lab →
            </button>
          </div>
        </div>

        {/* Architecture Info (explicitly separated from executed tests) */}
        <div className="mt-5 grid gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 text-xs md:grid-cols-2">
          <div className="flex items-start gap-2.5">
            <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
            <div>
              <strong className="text-slate-100">Architecture: Volatile Browser Memory</strong>
              <p className="mt-0.5 text-slate-400">
                Original document text and pseudonym Maps live strictly in React/Worker memory and
                are never written to localStorage, sessionStorage, or remote endpoints.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
            <div>
              <strong className="text-slate-100">Important Scope Note</strong>
              <p className="mt-0.5 text-slate-400">
                No automated client-side tool can guarantee 100% security or removal of every
                unstructured identifier. Always review sanitized output before external sharing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Control Center — Category-Level Redaction Policies */}
      <section className="glass-panel hover-section section-theme-rose rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-heading-bright section-heading">
              <Sliders className="h-5 w-5 text-neon-cyan" />
              Privacy Control Center — Category Policies
            </h2>
            <p className="text-xs text-slate-400">
              Override the workspace default redaction mode per PII category. Changes immediately
              update the live sanitization engine.
            </p>
          </div>
          <span className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-300">
            Workspace Default: <strong className="capitalize text-cyan-300">{defaultMode}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 pr-4 font-semibold">PII Category</th>
                <th className="py-2.5 pr-4 font-semibold">Policy Setting</th>
                <th className="py-2.5 font-semibold">Live Synthetic Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {ALL_PII_CATEGORIES.map((cat) => {
                const cfg = CATEGORY_THEME[cat];
                const Icon = cfg.icon;
                const setting = categoryPolicies[cat];
                return (
                  <tr key={cat} className="row-hover hover:bg-slate-900/40">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${cfg.badgeClasses}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {cfg.shortTag}
                        </span>
                        <span className="font-medium text-slate-100">{cfg.label}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        aria-label={`Redaction policy for ${cfg.label}`}
                        value={setting}
                        onChange={(e) =>
                          handlePolicyChange(cat, e.target.value as CategoryPolicySetting)
                        }
                        className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-cyan-400 focus:outline-none"
                      >
                        <option value="default">Use Default ({defaultMode})</option>
                        <option value="full">Full Masking ([REDACTED])</option>
                        <option value="partial">Partial Masking</option>
                        <option value="pseudonym">Pseudonymization</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <code className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-cyan-200">
                        {renderPreviewForSetting(cat, setting, defaultMode)}
                      </code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
