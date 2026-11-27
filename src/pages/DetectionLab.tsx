import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  Play,
  ScanLine,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { TooltipBadge } from '../components/common/TooltipBadge';
import { usePrivyShield } from '../context/PrivyShieldContext';
import { detectPII } from '../engine/detector';
import { DetectionResult } from '../types/pii';
import { CATEGORY_THEME } from '../utils/categoryTheme';
import {
  LAB_BENCHMARK_CASES,
  SYNTHETIC_AADHAAR_1,
  SYNTHETIC_INVALID_AADHAAR,
} from '../utils/sampleData';

const PRESET_SCENARIOS = [
  {
    id: 'luhn',
    label: 'Credit Card (Luhn)',
    text: 'Valid synthetic Visa: 4111-1111-1111-1111 | Valid Mastercard: 5500-0000-0000-0004 | Invalid Luhn (rejected): 4111-1111-1111-1112',
  },
  {
    id: 'verhoeff',
    label: 'Aadhaar (Verhoeff)',
    text: `Valid synthetic Aadhaar: ${SYNTHETIC_AADHAAR_1} | Invalid Verhoeff checksum (rejected): ${SYNTHETIC_INVALID_AADHAAR} | Leading zero (rejected): 0123 4567 8901`,
  },
  {
    id: 'overlap',
    label: 'Overlap Guard',
    text: `Aadhaar ${SYNTHETIC_AADHAAR_1} and Visa 4111-1111-1111-1111 must not trigger partial phone detections, while +91 98765 43210 and +1 415 555 0198 should.`,
  },
  {
    id: 'net_pan',
    label: 'PAN, Email & IPs',
    text: 'PAN: ABCPK1234M | Review PAN (unusual 4th char): ABCDE1234F | Email: analyst@privyshield.example | IPv4: 10.20.30.40 | Invalid IPv4: 999.10.20.30 | IPv6: 2001:db8::1',
  },
];

interface BenchmarkRunSummary {
  tp: number;
  fp: number;
  fn: number;
  precision: number;
  recall: number;
  f1: number;
  caseDetails: Array<{
    id: string;
    label: string;
    expectedCount: number;
    actualCount: number;
    matched: boolean;
    notes: string;
  }>;
}

export const DetectionLab: React.FC = () => {
  const { visualEffects, recordValidationBenchmarkResult } = usePrivyShield();
  const [labText, setLabText] = useState<string>(PRESET_SCENARIOS[0].text);
  const [isScanningLab, setIsScanningLab] = useState<boolean>(false);
  const [labResult, setLabResult] = useState<DetectionResult>(() =>
    detectPII(PRESET_SCENARIOS[0].text)
  );
  const [benchmarkSummary, setBenchmarkSummary] = useState<BenchmarkRunSummary | null>(null);

  const runLabScan = (input: string) => {
    setLabText(input);
    setIsScanningLab(true);
    // Drive visual scan-line strictly from actual engine execution lifecycle
    requestAnimationFrame(() => {
      const result = detectPII(input);
      setLabResult(result);
      setTimeout(() => setIsScanningLab(false), visualEffects === 'full' ? 280 : 0);
    });
  };

  const runLabelledBenchmark = () => {
    let tp = 0;
    let fp = 0;
    let fn = 0;

    const caseDetails = LAB_BENCHMARK_CASES.map((tc) => {
      const res = detectPII(tc.text);
      const expectedKeys = tc.expected.map((e) => `${e.category}:${e.snippet}`);
      const actualKeys = res.entities.map(
        (ent) => `${ent.category}:${tc.text.slice(ent.start, ent.end)}`
      );

      const remainingExpected = [...expectedKeys];
      let caseTp = 0;
      let caseFp = 0;

      for (const act of actualKeys) {
        const idx = remainingExpected.indexOf(act);
        if (idx !== -1) {
          caseTp += 1;
          remainingExpected.splice(idx, 1);
        } else {
          caseFp += 1;
        }
      }
      const caseFn = remainingExpected.length;

      tp += caseTp;
      fp += caseFp;
      fn += caseFn;

      return {
        id: tc.id,
        label: tc.label,
        expectedCount: expectedKeys.length,
        actualCount: actualKeys.length,
        matched: caseFp === 0 && caseFn === 0,
        notes: tc.notes,
      };
    });

    const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 1;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    const summary: BenchmarkRunSummary = { tp, fp, fn, precision, recall, f1, caseDetails };
    setBenchmarkSummary(summary);
    recordValidationBenchmarkResult(
      fp === 0 && fn === 0,
      `Benchmark executed on ${LAB_BENCHMARK_CASES.length} synthetic cases: TP=${tp}, FP=${fp}, FN=${fn}, F1=${(
        f1 * 100
      ).toFixed(1)}%.`
    );
  };

  const highlightedPreview = useMemo(() => {
    if (!labText) return null;
    if (labResult.entities.length === 0) return <span>{labText}</span>;
    const nodes: React.ReactNode[] = [];
    let cursor = 0;
    for (const ent of labResult.entities) {
      if (ent.start < cursor || ent.end > labText.length) continue;
      if (ent.start > cursor) {
        nodes.push(<span key={`l_${cursor}`}>{labText.slice(cursor, ent.start)}</span>);
      }
      const cfg = CATEGORY_THEME[ent.category];
      const Icon = cfg.icon;
      nodes.push(
        <span
          key={ent.id}
          className={`mx-0.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs ${cfg.highlightClasses}`}
        >
          <Icon className="h-3 w-3" />
          <span>{labText.slice(ent.start, ent.end)}</span>
          <span className="rounded bg-slate-950/65 px-1 text-[10px] font-bold">{cfg.shortTag}</span>
        </span>
      );
      cursor = ent.end;
    }
    if (cursor < labText.length) {
      nodes.push(<span key={`ltail_${cursor}`}>{labText.slice(cursor)}</span>);
    }
    return nodes;
  }, [labText, labResult.entities]);

  return (
    <div className="space-y-6 animate-page-enter">
      <header className="glass-panel ps-shimmer-overlay section-theme-emerald rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-rainbow">
              <FlaskConical className="h-5 w-5 text-cyan-400" />
              Interactive PII Detection & Validation Lab
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Test <TooltipBadge term="Luhn" label="Luhn" />,{' '}
              <TooltipBadge term="Verhoeff" label="Verhoeff" />, PAN entity codes,{' '}
              <code>libphonenumber-js</code>, <code>ipaddr.js</code>, and overlap conflict guards
              using synthetic data only.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESET_SCENARIOS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => runLabScan(preset.text)}
                className="btn-glow rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-neon-cyan transition hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Real-time Document Scanning Visualization + Results */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="glass-panel hover-section section-theme-cyan rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-heading-cyan section-heading">
              <ScanLine className="h-4 w-4 text-neon-cyan" />
              Synthetic Test Input & Scan Beam
            </h2>
            <span className="text-xs text-slate-400">
              {isScanningLab ? 'Scanning...' : `Completed in ${labResult.processingTimeMs} ms`}
            </span>
          </div>

          <textarea
            aria-label="Detection lab synthetic test input"
            value={labText}
            onChange={(e) => runLabScan(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/75 p-3 font-mono text-xs text-slate-200 focus:border-cyan-400/60 focus:outline-none"
          />

          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-xs leading-relaxed text-slate-200">
            {isScanningLab && visualEffects === 'full' && (
              <div
                aria-hidden="true"
                className="animate-scan-beam pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent"
              />
            )}
            <div className="relative z-10 whitespace-pre-wrap">{highlightedPreview}</div>
          </div>
        </section>

        <section className="glass-panel hover-section section-theme-purple rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-heading-purple section-heading">
            Validated Detections vs Rejected False Positives
          </h2>

          <div className="space-y-2 max-h-[220px] overflow-auto pr-1">
            {labResult.entities.map((ent) => {
              const cfg = CATEGORY_THEME[ent.category];
              return (
                <div
                  key={ent.id}
                  className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-teal-300">
                      <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                      {cfg.label}: <code className="text-white">{ent.maskedPreview}</code>
                    </span>
                    <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] uppercase text-slate-300">
                      {ent.validationStatus}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300">{ent.detectionReason}</p>
                </div>
              );
            })}

            {labResult.rejectedCandidates.map((rej) => (
              <div
                key={rej.id}
                className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-300">
                    <XCircle className="mr-1 inline h-3.5 w-3.5" />
                    Rejected {CATEGORY_THEME[rej.category].label}:{' '}
                    <code className="text-white">{rej.maskedPreview}</code>
                  </span>
                  <span className="rounded bg-amber-950/60 px-2 py-0.5 text-[10px] text-amber-200">
                    REJECTED
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-300">{rej.rejectionReason}</p>
              </div>
            ))}

            {labResult.entities.length === 0 && labResult.rejectedCandidates.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-400">
                No PII candidates detected or rejected in current input.
              </div>
            )}
          </div>

          {labResult.conflictsResolved.length > 0 && (
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs">
              <p className="font-semibold text-purple-200">Overlap Conflicts Resolved:</p>
              {labResult.conflictsResolved.map((c) => (
                <p key={c.id} className="mt-1 text-[11px] text-slate-300">
                  {c.reason}
                </p>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Labelled Synthetic Benchmark Metrics */}
      <section className="glass-panel hover-section section-theme-emerald rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-heading-emerald section-heading">
              <ShieldCheck className="h-4 w-4 text-neon-emerald" />
              Labelled Synthetic Benchmark Suite
            </h2>
            <p className="text-xs text-slate-400">
              Computes actual True Positives, False Positives, False Negatives, Precision, Recall,
              and F1 Score from {LAB_BENCHMARK_CASES.length} labelled synthetic test cases. Never
              hardcoded.
            </p>
          </div>
          <button
            type="button"
            onClick={runLabelledBenchmark}
            className="btn-glow inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <Play className="h-3.5 w-3.5" />
            Run Labelled Benchmark
          </button>
        </div>

        {!benchmarkSummary ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-xs text-slate-400">
            <AlertCircle className="mx-auto mb-2 h-6 w-6 text-slate-500" />
            Benchmark status: <strong>Not Tested</strong>. Click{' '}
            <strong>Run Labelled Benchmark</strong> to execute live validation metrics.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-[11px] text-slate-400">True Positives</p>
                <p className="text-xl font-bold text-teal-300">{benchmarkSummary.tp}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-[11px] text-slate-400">False Positives</p>
                <p className="text-xl font-bold text-amber-300">{benchmarkSummary.fp}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-[11px] text-slate-400">False Negatives</p>
                <p className="text-xl font-bold text-rose-300">{benchmarkSummary.fn}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-[11px] text-slate-400">Precision</p>
                <p className="text-xl font-bold text-cyan-300">
                  {(benchmarkSummary.precision * 100).toFixed(1)}%
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-[11px] text-slate-400">Recall</p>
                <p className="text-xl font-bold text-blue-300">
                  {(benchmarkSummary.recall * 100).toFixed(1)}%
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-[11px] text-slate-400">F1 Score</p>
                <p className="text-xl font-bold text-purple-300">
                  {(benchmarkSummary.f1 * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {benchmarkSummary.caseDetails.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-xl border p-3 text-xs ${
                    c.matched
                      ? 'border-teal-500/30 bg-teal-500/5'
                      : 'border-rose-500/35 bg-rose-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-white">{c.label}</span>
                    <span className={c.matched ? 'text-teal-300' : 'text-rose-300'}>
                      {c.matched ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{c.notes}</p>
                  <p className="mt-1 text-[11px] text-slate-300">
                    Expected: {c.expectedCount} • Detected: {c.actualCount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
