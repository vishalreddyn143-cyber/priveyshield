import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Info,
  Layers,
  RefreshCw,
  RotateCcw,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Table,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { TooltipBadge } from '../components/common/TooltipBadge';
import { usePrivyShield } from '../context/PrivyShieldContext';
import { DetectionEntity, RedactionMode } from '../types/pii';
import { CATEGORY_THEME } from '../utils/categoryTheme';

const MODE_OPTIONS: Array<{ id: RedactionMode; label: string; example: string }> = [
  { id: 'full', label: 'Full Masking', example: '[REDACTED]' },
  { id: 'partial', label: 'Partial Masking', example: 'r***@domain / XXXX-1234' },
  { id: 'pseudonym', label: 'Pseudonymization', example: 'EMAIL_01, PHONE_01' },
];

export const SanitizeWorkspace: React.FC = () => {
  const {
    documentText,
    documentMeta,
    isScanning,
    scanProgress,
    scanStage,
    detectionResult,
    sanitizedText,
    spanMappings,
    appliedCount,
    mappingCount,
    defaultMode,
    residualScan,
    selectedEntityId,
    setSelectedEntityId,
    csvOriginalRows,
    csvSanitizedRows,
    demoGuideActive,
    setDemoGuideActive,
    setActivePage,
    updateDocumentText,
    uploadDocumentFile,
    loadSyntheticTextSample,
    loadSyntheticCsvSample,
    clearWorkspace,
    cancelProcessing,
    setRedactionMode,
    resetPseudonymMappings,
    reapplySanitization,
    runResidualScanNow,
    exportSanitizedDocument,
  } = usePrivyShield();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalPreRef = useRef<HTMLDivElement>(null);
  const sanitizedPreRef = useRef<HTMLDivElement>(null);

  const [leftView, setLeftView] = useState<'highlight' | 'edit' | 'table'>('highlight');
  const [rightView, setRightView] = useState<'preview' | 'table'>('preview');
  const [middleTab, setMiddleTab] = useState<'entities' | 'rejected' | 'conflicts'>('entities');
  const [syncScroll, setSyncScroll] = useState<boolean>(true);
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isCSV = documentMeta?.fileType === 'csv' && csvOriginalRows.length > 0;

  const selectedEntity: DetectionEntity | null = useMemo(() => {
    if (!detectionResult.entities.length) return null;
    return (
      detectionResult.entities.find((e) => e.id === selectedEntityId) ??
      detectionResult.entities[0]
    );
  }, [detectionResult.entities, selectedEntityId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    try {
      await uploadDocumentFile(file);
      if (file.name.toLowerCase().endsWith('.csv')) {
        setLeftView('table');
        setRightView('table');
      } else {
        setLeftView('highlight');
        setRightView('preview');
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to read selected file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSyncScroll = (source: 'left' | 'right') => {
    if (!syncScroll) return;
    const leftEl = originalPreRef.current;
    const rightEl = sanitizedPreRef.current;
    if (!leftEl || !rightEl) return;
    if (source === 'left') {
      rightEl.scrollTop = leftEl.scrollTop;
    } else {
      leftEl.scrollTop = rightEl.scrollTop;
    }
  };

  // Build highlighted segments safely without innerHTML (XSS-safe React nodes)
  const highlightedOriginalSegments = useMemo(() => {
    if (!documentText) return null;
    if (isCSV || detectionResult.entities.length === 0) {
      return <span>{documentText}</span>;
    }

    const parts: React.ReactNode[] = [];
    let cursor = 0;
    for (const entity of detectionResult.entities) {
      if (entity.start < cursor || entity.end > documentText.length) continue;
      if (entity.start > cursor) {
        parts.push(<span key={`txt_${cursor}`}>{documentText.slice(cursor, entity.start)}</span>);
      }
      const cfg = CATEGORY_THEME[entity.category];
      const isSelected = selectedEntity?.id === entity.id;
      const Icon = cfg.icon;
      parts.push(
        <button
          key={entity.id}
          type="button"
          onClick={() => setSelectedEntityId(entity.id)}
          title={`${cfg.label} (${entity.validationMethod})`}
          className={`mx-0.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-left font-mono text-xs transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${cfg.highlightClasses} ${
            isSelected ? 'ring-2 ring-white/80 shadow-md' : ''
          }`}
        >
          <Icon className="h-3 w-3 shrink-0" />
          <span>{documentText.slice(entity.start, entity.end)}</span>
          <span className="rounded bg-slate-950/60 px-1 text-[10px] font-bold">{cfg.shortTag}</span>
        </button>
      );
      cursor = entity.end;
    }
    if (cursor < documentText.length) {
      parts.push(<span key={`tail_${cursor}`}>{documentText.slice(cursor)}</span>);
    }
    return parts;
  }, [documentText, detectionResult.entities, isCSV, selectedEntity, setSelectedEntityId]);

  const highlightedSanitizedSegments = useMemo(() => {
    if (!sanitizedText) return null;
    if (isCSV || spanMappings.length === 0) {
      return <span>{sanitizedText}</span>;
    }
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    for (const span of spanMappings) {
      if (span.sanitizedStart < cursor || span.sanitizedEnd > sanitizedText.length) continue;
      if (span.sanitizedStart > cursor) {
        parts.push(
          <span key={`stxt_${cursor}`}>{sanitizedText.slice(cursor, span.sanitizedStart)}</span>
        );
      }
      const cfg = CATEGORY_THEME[span.category];
      const isSelected = selectedEntity?.id === span.entityId;
      parts.push(
        <span
          key={`rep_${span.entityId}`}
          className={`mx-0.5 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-xs ${cfg.badgeClasses} ${
            isSelected ? 'ring-2 ring-cyan-300' : ''
          }`}
        >
          {sanitizedText.slice(span.sanitizedStart, span.sanitizedEnd)}
        </span>
      );
      cursor = span.sanitizedEnd;
    }
    if (cursor < sanitizedText.length) {
      parts.push(<span key={`stail_${cursor}`}>{sanitizedText.slice(cursor)}</span>);
    }
    return parts;
  }, [sanitizedText, spanMappings, isCSV, selectedEntity]);

  return (
    <div className="space-y-5 animate-page-enter">
      {/* Guided Synthetic Demo Banner */}
      {demoGuideActive && (
        <div className="glass-panel ps-shimmer-overlay flex flex-wrap items-center justify-between gap-3 rounded-2xl border-cyan-400/40 bg-cyan-500/10 px-4 py-3 text-xs animate-glow-ring">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <div>
              <span className="font-semibold text-cyan-200">
                Synthetic Demonstration Mode Active:
              </span>{' '}
              <span className="text-slate-200">
                Inspect detected spans, switch between Full / Partial / Pseudonym modes, view rejected
                Luhn/Verhoeff false positives, then verify in Privacy Center.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActivePage('privacy')}
              className="rounded-lg bg-cyan-500 px-3 py-1.5 font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Verify in Privacy Center →
            </button>
            <button
              type="button"
              onClick={() => setDemoGuideActive(false)}
              className="rounded-lg border border-slate-600 px-2.5 py-1.5 text-slate-300 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Top Input & Redaction Control Toolbar */}
      <section className="glass-panel hover-section section-theme-purple rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,text/plain,text/csv"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload TXT or CSV document"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-glow inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 px-3.5 py-2 text-xs font-semibold text-white shadow transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload TXT / CSV
            </button>

            <button
              type="button"
              onClick={() => {
                loadSyntheticTextSample();
                setLeftView('highlight');
                setRightView('preview');
              }}
              className="btn-glow inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-neon-cyan transition hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <FileText className="h-3.5 w-3.5" />
              Load Synthetic TXT
            </button>

            <button
              type="button"
              onClick={() => {
                loadSyntheticCsvSample();
                setLeftView('table');
                setRightView('table');
              }}
              className="btn-glow inline-flex items-center gap-1.5 rounded-xl border border-purple-400/40 bg-purple-500/10 px-3 py-2 text-xs font-medium text-neon-purple transition hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Load Synthetic CSV
            </button>

            <button
              type="button"
              onClick={clearWorkspace}
              disabled={!documentText}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-rose-400/40 hover:text-rose-200 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>

          {/* File Metadata Badge */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="rounded-lg border border-slate-700/80 bg-slate-900/70 px-2.5 py-1.5">
              File:{' '}
              <strong className="text-white">
                {documentMeta?.name ?? 'None'}
              </strong>
            </span>
            <span className="rounded-lg border border-slate-700/80 bg-slate-900/70 px-2.5 py-1.5">
              Type: <strong className="uppercase text-cyan-300">{documentMeta?.fileType ?? '—'}</strong>
            </span>
            <span className="rounded-lg border border-slate-700/80 bg-slate-900/70 px-2.5 py-1.5">
              Size: <strong>{documentMeta?.sizeBytes ?? 0} B</strong>
            </span>
            <span className="rounded-lg border border-slate-700/80 bg-slate-900/70 px-2.5 py-1.5">
              Status: <strong className="text-teal-300">{scanStage}</strong>
            </span>
          </div>
        </div>

        {uploadError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Redaction Mode Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Layers className="h-4 w-4 text-cyan-400" />
              Redaction Mode:
            </span>
            {MODE_OPTIONS.map((opt) => {
              const selected = defaultMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRedactionMode(opt.id)}
                  aria-pressed={selected}
                  className={`rounded-xl border px-3 py-1.5 text-left text-xs transition focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                    selected
                      ? 'border-cyan-400/60 bg-cyan-500/20 text-white shadow-sm'
                      : 'border-slate-700/80 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-semibold">{opt.label}</span>
                  <span className="ml-1.5 hidden text-[10px] text-slate-400 sm:inline">
                    ({opt.example})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={resetPseudonymMappings}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-purple-400/50 hover:text-purple-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Pseudonym Map ({mappingCount})
            </button>
            <button
              type="button"
              onClick={reapplySanitization}
              disabled={!documentText}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-200 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reprocess
            </button>
            <button
              type="button"
              onClick={() => setActivePage('privacy')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              Category Policies →
            </button>
          </div>
        </div>
      </section>

      {/* Progress & Before-After Transformation Path */}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-cyan-400" />
          <span className="font-semibold text-slate-200">Transformation Pipeline:</span>
          <span className="text-slate-400">
            Original ({documentText.length} chars) → {detectionResult.entities.length} validated →{' '}
            {appliedCount} replaced ({defaultMode})
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isScanning ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
              <span className="text-cyan-300">{scanProgress}%</span>
              <button
                type="button"
                onClick={cancelProcessing}
                className="rounded border border-rose-400/40 px-2 py-0.5 text-[11px] text-rose-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={syncScroll}
                onChange={(e) => setSyncScroll(e.target.checked)}
                aria-label="Synchronize scrolling between original and sanitized documents"
                className="rounded border-slate-600 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
              />
              Sync Scroll
            </label>
          )}
        </div>
      </div>

      {/* Main 3-Panel Sanitization Workspace */}
      <div className="grid gap-4 xl:grid-cols-12">
        {/* LEFT PANEL — ORIGINAL DOCUMENT */}
        <section className="glass-panel hover-section section-theme-cyan flex flex-col rounded-2xl p-4 xl:col-span-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-heading-cyan section-heading">1. Original Document</h2>
              <p className="text-[11px] text-slate-400">
                Local browser editor & category highlights
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/60 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setLeftView('highlight')}
                className={`rounded-md px-2 py-1 font-medium ${
                  leftView === 'highlight' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400'
                }`}
              >
                <Eye className="mr-1 inline h-3 w-3" />
                Highlights
              </button>
              <button
                type="button"
                onClick={() => setLeftView('edit')}
                className={`rounded-md px-2 py-1 font-medium ${
                  leftView === 'edit' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400'
                }`}
              >
                Edit
              </button>
              {isCSV && (
                <button
                  type="button"
                  onClick={() => setLeftView('table')}
                  className={`rounded-md px-2 py-1 font-medium ${
                    leftView === 'table' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-400'
                  }`}
                >
                  <Table className="mr-1 inline h-3 w-3" />
                  Table
                </button>
              )}
            </div>
          </div>

          {leftView === 'edit' ? (
            <textarea
              aria-label="Original document text editor"
              value={documentText}
              onChange={(e) => updateDocumentText(e.target.value)}
              placeholder="Paste sensitive text here or upload a TXT / CSV file above. Nothing leaves your browser..."
              className="h-[430px] w-full resize-none rounded-xl border border-slate-800 bg-slate-950/75 p-3 font-mono text-xs leading-relaxed text-slate-200 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
            />
          ) : leftView === 'table' && isCSV ? (
            <div className="h-[430px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/70">
              <table className="w-full border-collapse text-left text-xs" aria-label="Original CSV data preview">
                <thead className="sticky top-0 bg-slate-900 text-slate-200">
                  <tr>
                    {csvOriginalRows[0]?.map((cell, cIdx) => (
                      <th key={cIdx} scope="col" className="border-b border-slate-800 px-2.5 py-2 font-semibold">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvOriginalRows.slice(1).map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-slate-800/60 hover:bg-slate-900/50">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="max-w-[180px] truncate px-2.5 py-2 text-slate-300" title={cell}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              ref={originalPreRef}
              onScroll={() => handleSyncScroll('left')}
              className="relative h-[430px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/75 p-3 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap"
            >
              {documentText ? (
                highlightedOriginalSegments
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center font-sans text-slate-400">
                  <FileText className="mb-2 h-8 w-8 text-slate-600" />
                  <p className="text-sm font-medium text-slate-300">No document loaded</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">
                    Switch to <strong>Edit</strong> to paste text, upload a TXT/CSV file, or click{' '}
                    <strong>Load Synthetic TXT</strong> above.
                  </p>
                  <button
                    type="button"
                    onClick={() => setLeftView('edit')}
                    className="mt-3 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200"
                  >
                    Paste Text Now
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* MIDDLE PANEL — DETECTION RESULTS & SMART EXPLANATION */}
        <section className="glass-panel hover-section section-theme-purple flex flex-col rounded-2xl p-4 xl:col-span-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-heading-purple section-heading">2. Detection & Explanations</h2>
              <p className="text-[11px] text-slate-400">
                Validated entities, rejected noise & conflict resolution
              </p>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl border border-slate-800 bg-slate-950/60 p-1 text-[11px]">
            <button
              type="button"
              onClick={() => setMiddleTab('entities')}
              className={`rounded-lg py-1.5 font-semibold ${
                middleTab === 'entities'
                  ? 'bg-cyan-500/20 text-cyan-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Detected ({detectionResult.entities.length})
            </button>
            <button
              type="button"
              onClick={() => setMiddleTab('rejected')}
              className={`rounded-lg py-1.5 font-semibold ${
                middleTab === 'rejected'
                  ? 'bg-amber-500/20 text-amber-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rejected ({detectionResult.rejectedCandidates.length})
            </button>
            <button
              type="button"
              onClick={() => setMiddleTab('conflicts')}
              className={`rounded-lg py-1.5 font-semibold ${
                middleTab === 'conflicts'
                  ? 'bg-purple-500/20 text-purple-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overlaps ({detectionResult.conflictsResolved.length})
            </button>
          </div>

          {middleTab === 'entities' && (
            <div className="flex flex-1 flex-col gap-3">
              {/* Entity List */}
              <div className="max-h-[215px] space-y-1.5 overflow-auto pr-1">
                {detectionResult.entities.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
                    {documentText
                      ? 'No supported PII patterns validated in this document.'
                      : 'Load or paste text to inspect detected entities.'}
                  </div>
                ) : (
                  detectionResult.entities.map((ent) => {
                    const cfg = CATEGORY_THEME[ent.category];
                    const Icon = cfg.icon;
                    const isSelected = selectedEntity?.id === ent.id;
                    return (
                      <button
                        key={ent.id}
                        type="button"
                        onClick={() => setSelectedEntityId(ent.id)}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs transition focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                          isSelected
                            ? 'border-cyan-400/60 bg-cyan-500/15'
                            : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${cfg.badgeClasses}`}
                          >
                            <Icon className="h-3 w-3" />
                            {cfg.shortTag}
                          </span>
                          <span className="truncate font-mono text-slate-200">
                            {ent.maskedPreview}
                          </span>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            ent.validationStatus === 'review_required'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-teal-500/20 text-teal-300'
                          }`}
                        >
                          {ent.validationStatus === 'review_required' ? 'Review' : 'Valid'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Smart Detection Explanation Card */}
              {selectedEntity && (
                <div className="rounded-xl border border-cyan-500/30 bg-slate-900/75 p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">
                      Explainable Detection Details
                    </span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                      Offsets [{selectedEntity.start}, {selectedEntity.end}]
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">Category:</span>{' '}
                      <strong className="text-white">
                        {CATEGORY_THEME[selectedEntity.category].label}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Masked:</span>{' '}
                      <code className="text-cyan-200">{selectedEntity.maskedPreview}</code>
                    </div>
                    <div>
                      <span className="text-slate-400">Validation:</span>{' '}
                      <strong className="text-slate-200">{selectedEntity.validationMethod}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Suggested:</span>{' '}
                      <strong className="capitalize text-purple-300">
                        {selectedEntity.suggestedAction} masking
                      </strong>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    <strong className="text-slate-200">Reason:</strong> {selectedEntity.detectionReason}
                  </p>

                  {selectedEntity.technicalDetails && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowTechDetails((v) => !v)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300"
                      >
                        {showTechDetails ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                        Technical Details
                      </button>
                      {showTechDetails && (
                        <div className="mt-1.5 rounded-lg border border-slate-800 bg-slate-950/70 p-2 font-mono text-[10px] text-slate-300">
                          {Object.entries(selectedEntity.technicalDetails).map(([k, v]) => (
                            <div key={k}>
                              {k}: <span className="text-cyan-300">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {middleTab === 'rejected' && (
            <div className="h-[390px] space-y-2 overflow-auto pr-1">
              {detectionResult.rejectedCandidates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
                  No rejected false-positive candidates in the current document.
                </div>
              ) : (
                detectionResult.rejectedCandidates.map((rej) => (
                  <div
                    key={rej.id}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-300">
                        {CATEGORY_THEME[rej.category].label} Rejected
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-200">
                        <XCircle className="h-3 w-3" /> False-Positive Prevented
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-300">
                      Preview: {rej.maskedPreview}
                    </p>
                    <p className="text-[11px] text-slate-400">{rej.rejectionReason}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {middleTab === 'conflicts' && (
            <div className="h-[390px] space-y-2 overflow-auto pr-1">
              {detectionResult.conflictsResolved.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
                  No overlapping span conflicts detected (boundary guards already prevented partial
                  slices).
                </div>
              ) : (
                detectionResult.conflictsResolved.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs space-y-1"
                  >
                    <div className="font-semibold text-purple-200">
                      Kept {c.keptCategory} over {c.discardedCategory}
                    </div>
                    <p className="text-[11px] text-slate-300">{c.reason}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* RIGHT PANEL — SANITIZED DOCUMENT & RESIDUAL SCAN */}
        <section className="glass-panel hover-section section-theme-emerald flex flex-col rounded-2xl p-4 xl:col-span-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-heading-emerald section-heading">3. Sanitized Output</h2>
              <p className="text-[11px] text-slate-400">
                Mode: <strong className="capitalize text-cyan-300">{defaultMode}</strong> •{' '}
                {appliedCount} replacement(s)
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {isCSV && (
                <button
                  type="button"
                  onClick={() => setRightView((v) => (v === 'table' ? 'preview' : 'table'))}
                  className="rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[11px] text-slate-200 hover:border-cyan-400/50"
                >
                  {rightView === 'table' ? 'Raw CSV' : 'Table View'}
                </button>
              )}
              <button
                type="button"
                disabled={!sanitizedText}
                onClick={() => exportSanitizedDocument(isCSV ? 'csv' : 'txt')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-teal-400 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-teal-300"
              >
                <Download className="h-3.5 w-3.5" />
                Download {isCSV ? 'CSV' : 'TXT'}
              </button>
            </div>
          </div>

          {rightView === 'table' && isCSV && csvSanitizedRows.length > 0 ? (
            <div className="h-[340px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/70">
              <table className="w-full border-collapse text-left text-xs" aria-label="Sanitized CSV data preview">
                <thead className="sticky top-0 bg-slate-900 text-teal-200">
                  <tr>
                    {csvSanitizedRows[0]?.map((cell, cIdx) => (
                      <th key={cIdx} scope="col" className="border-b border-slate-800 px-2.5 py-2 font-semibold">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvSanitizedRows.slice(1).map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-slate-800/60 hover:bg-slate-900/50">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="max-w-[180px] truncate px-2.5 py-2 text-slate-200" title={cell}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              ref={sanitizedPreRef}
              onScroll={() => handleSyncScroll('right')}
              data-testid="sanitized-preview"
              className="h-[340px] overflow-auto rounded-xl border border-slate-800 bg-slate-950/75 p-3 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap"
            >
              {sanitizedText ? (
                highlightedSanitizedSegments
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center font-sans text-slate-500">
                  <Sparkles className="mb-2 h-8 w-8 text-slate-600" />
                  <p className="text-sm font-medium text-slate-400">Sanitized preview appears here</p>
                </div>
              )}
            </div>
          )}

          {/* Residual PII Scanner Panel */}
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/75 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-semibold text-white">
                <ScanSearch className="h-4 w-4 text-cyan-400" />
                <TooltipBadge term="ResidualScan" label="Residual PII Scanner" />
              </span>
              <button
                type="button"
                disabled={!sanitizedText}
                onClick={runResidualScanNow}
                className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-40"
              >
                Re-Scan Output
              </button>
            </div>

            {residualScan.status === 'not_run' ? (
              <p className="text-[11px] text-slate-400">Not run yet — load or paste a document.</p>
            ) : residualScan.status === 'clean' ? (
              <div className="flex items-start gap-2 text-[11px] text-teal-300">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <strong>No supported patterns detected.</strong>{' '}
                  <span className="text-slate-400">{residualScan.disclaimer}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-[11px] text-amber-300">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <strong>
                    Review required: {residualScan.remainingCount} supported pattern(s) remain.
                  </strong>{' '}
                  <button
                    type="button"
                    onClick={reapplySanitization}
                    className="underline hover:text-amber-200"
                  >
                    Reapply sanitization
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom Summary Strip */}
      <footer className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-4">
          <span>
            Scan Time: <strong className="text-white">{detectionResult.processingTimeMs} ms</strong>
          </span>
          <span>
            Validated Entities:{' '}
            <strong className="text-cyan-300">{detectionResult.entities.length}</strong>
          </span>
          <span>
            Rejected False Positives:{' '}
            <strong className="text-amber-300">{detectionResult.rejectedCandidates.length}</strong>
          </span>
          <span>
            Resolved Overlaps:{' '}
            <strong className="text-purple-300">{detectionResult.conflictsResolved.length}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Info className="h-3.5 w-3.5 text-cyan-400" />
          Exported file matches the exact sanitized output preview.
        </div>
      </footer>
    </div>
  );
};
