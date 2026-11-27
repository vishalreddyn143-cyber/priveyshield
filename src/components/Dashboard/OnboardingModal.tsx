import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Layers,
  ScanSearch,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import { usePrivyShield } from '../../context/PrivyShieldContext';

const ONBOARDING_STEPS = [
  {
    title: '1. What PrivyShield Does',
    icon: Shield,
    body: 'PrivyShield helps you inspect text or CSV documents for sensitive personal data and sanitize them directly inside your browser — without sending your documents to any server or external AI.',
    highlight: 'Strict Client-Side Privacy: Your document stays in browser memory.',
  },
  {
    title: '2. What PII Means',
    icon: Sparkles,
    body: 'Personally Identifiable Information (PII) includes Email addresses, Phone numbers, IPv4/IPv6 network addresses, Indian PAN numbers, Aadhaar numbers, and Credit Card numbers.',
    highlight: '7 specialized detectors work together with boundary and checksum checks.',
  },
  {
    title: '3. Upload or Paste a Document',
    icon: FileText,
    body: 'In the Sanitize Workspace, paste raw text, upload a .txt or .csv file, or load our clearly labelled synthetic sample dataset to explore safely.',
    highlight: 'CSV files are parsed with Papa Parse to preserve quotes, commas, and newlines.',
  },
  {
    title: '4. Explainable Detection & False-Positive Filtering',
    icon: ScanSearch,
    body: 'Candidates are validated using Luhn (Credit Cards), Verhoeff (Aadhaar), libphonenumber-js (Phones), and ipaddr.js (IPv4/IPv6). Overlapping matches are resolved deterministically.',
    highlight: 'Invalid checksums are rejected and shown separately in the Detection Lab.',
  },
  {
    title: '5. Three Redaction Modes',
    icon: Layers,
    body: 'Choose Full Masking ([REDACTED]), Partial Masking (e.g. XXXX-XXXX-XXXX-1234), or Consistent Pseudonymization (EMAIL_01, EMAIL_02) powered by an in-memory Map.',
    highlight: 'Note: Pseudonymization is reversible if the in-memory mapping is retained.',
  },
  {
    title: '6. Residual PII Scanner',
    icon: CheckCircle2,
    body: 'After sanitization, the Residual Scanner re-runs all 7 detectors on the output to verify no supported patterns remain before you share.',
    highlight: 'A clean scan checks supported structured patterns only — always review context.',
  },
  {
    title: '7. Export Sanitized Output & Audit Reports',
    icon: Download,
    body: 'Download the exact sanitized TXT or CSV file, plus a privacy-safe JSON or Markdown Audit Report that never includes raw PII or pseudonym mappings.',
    highlight: 'Ready to begin? Jump straight into the Workspace or try the synthetic demo.',
  },
];

export const OnboardingModal: React.FC = () => {
  const { onboardingOpen, setOnboardingOpen, setActivePage, loadSyntheticTextSample } =
    usePrivyShield();
  const [step, setStep] = useState(0);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  const current = ONBOARDING_STEPS[step];
  const Icon = current?.icon ?? Shield;
  const isLast = step === ONBOARDING_STEPS.length - 1;

  const close = () => {
    setOnboardingOpen(false);
    setStep(0);
  };

  useEffect(() => {
    if (!onboardingOpen) return;
    const container = modalContainerRef.current;
    if (!container) return;

    // Trap focus inside modal
    const getFocusables = () =>
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

    const focusables = getFocusables();
    if (focusables.length > 0) {
      // Focus close button initially
      focusables[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'Tab') {
        const elements = getFocusables();
        if (elements.length === 0) return;
        const first = elements[0];
        const last = elements[elements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onboardingOpen]);

  if (!onboardingOpen) return null;

  return (
    <div
      ref={modalContainerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-description"
    >
      <div className="glass-panel relative w-full max-w-xl rounded-2xl p-6 shadow-2xl">
        <button
          type="button"
          onClick={close}
          aria-label="Close guided tour"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/35 bg-gradient-to-br from-purple-500/25 via-blue-500/20 to-cyan-500/25 text-cyan-300 shadow-lg">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Guided Tour • Step {step + 1} of {ONBOARDING_STEPS.length}
            </p>
            <h2 id="onboarding-title" className="text-lg font-bold text-white">
              {current.title}
            </h2>
          </div>
        </div>

        <p id="onboarding-description" className="mb-4 text-sm leading-relaxed text-slate-200">
          {current.body}
        </p>

        <div className="mb-6 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-3 text-xs text-cyan-100">
          {current.highlight}
        </div>

        {/* Step dots */}
        <div className="mb-5 flex items-center justify-center gap-1.5" role="tablist" aria-label="Tour step indicators">
          {ONBOARDING_STEPS.map((item, idx) => (
            <button
              key={item.title}
              type="button"
              role="tab"
              aria-selected={idx === step}
              aria-current={idx === step ? 'step' : undefined}
              onClick={() => setStep(idx)}
              aria-label={`Step ${idx + 1}: ${item.title}`}
              className={`h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                idx === step ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={close}
            className="rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            Skip Onboarding
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={() => {
                  loadSyntheticTextSample();
                  setActivePage('workspace');
                  close();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                Finish & Load Demo
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(ONBOARDING_STEPS.length - 1, s + 1))}
                className="inline-flex items-center gap-1 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
