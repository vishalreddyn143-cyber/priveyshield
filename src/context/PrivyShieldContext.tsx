import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { detectPII, emptyCategoryCounts, scanResidualPII } from '../engine/detector';
import { Pseudonymizer } from '../engine/pseudonymizer';
import { redactText, RedactionSpanMapping } from '../engine/redactor';
import { processAndSanitizeCSV } from '../parsers/csvParser';
import { parsePlainText } from '../parsers/textParser';
import { createAuditEntry } from '../services/auditService';
import {
  buildAuditReportJSON,
  buildAuditReportMarkdown,
  buildSanitizedFilename,
  createDocumentMetadataPayload,
  downloadBlobFile,
} from '../services/exportService';
import { checkOfflineCacheStatus, runNetworkPrivacyTest } from '../services/privacyService';
import {
  ALL_PII_CATEGORIES,
  AuditLogEntry,
  CategoryPolicies,
  DEFAULT_CATEGORY_POLICIES,
  DetectionResult,
  DocumentMetadata,
  PIICategory,
  PrivacyVerificationChecks,
  RedactionMode,
  ResidualScanResult,
  VisualEffectsMode,
} from '../types/pii';
import { SYNTHETIC_CSV_SAMPLE, SYNTHETIC_TEXT_SAMPLE } from '../utils/sampleData';
import { detectWebGLAvailability, prefersReducedMotion } from '../utils/webgl';
import type { WorkerProcessResponse } from '../workers/detection.worker';

export type NavPage = 'overview' | 'workspace' | 'lab' | 'audit' | 'privacy';

interface PrivyShieldContextValue {
  activePage: NavPage;
  setActivePage: (page: NavPage) => void;
  visualEffects: VisualEffectsMode;
  setVisualEffects: (mode: VisualEffectsMode) => void;
  webglSupported: boolean;
  isOnline: boolean;
  canInstallPWA: boolean;
  triggerPWAInstall: () => Promise<void>;
  onboardingOpen: boolean;
  setOnboardingOpen: (open: boolean) => void;
  demoGuideActive: boolean;
  setDemoGuideActive: (active: boolean) => void;

  // Document & Processing State
  documentText: string;
  documentMeta: DocumentMetadata | null;
  isScanning: boolean;
  scanProgress: number;
  scanStage: string;
  detectionResult: DetectionResult;
  sanitizedText: string;
  spanMappings: RedactionSpanMapping[];
  appliedCount: number;
  mappingCount: number;
  defaultMode: RedactionMode;
  categoryPolicies: CategoryPolicies;
  residualScan: ResidualScanResult;
  selectedEntityId: string | null;
  setSelectedEntityId: (id: string | null) => void;

  // CSV Table State
  csvOriginalRows: string[][];
  csvSanitizedRows: string[][];
  csvHeaders: string[];

  // Real Session Stats & Audit
  totalDocumentsProcessed: number;
  totalEntitiesDetectedSession: number;
  totalEntitiesSanitizedSession: number;
  sessionCategoryTotals: Record<PIICategory, number>;
  auditLog: AuditLogEntry[];
  privacyChecks: PrivacyVerificationChecks;

  // Actions
  updateDocumentText: (text: string) => void;
  uploadDocumentFile: (file: File) => Promise<void>;
  loadSyntheticTextSample: () => void;
  loadSyntheticCsvSample: () => void;
  clearWorkspace: () => void;
  cancelProcessing: () => void;
  setRedactionMode: (mode: RedactionMode) => void;
  updateCategoryPolicies: (policies: CategoryPolicies) => void;
  resetPseudonymMappings: () => void;
  reapplySanitization: () => void;
  runResidualScanNow: () => void;
  runPrivacyNetworkCheck: () => Promise<void>;
  refreshOfflineCheck: () => Promise<void>;
  recordValidationBenchmarkResult: (passed: boolean, details: string) => void;
  exportSanitizedDocument: (format: 'txt' | 'csv') => void;
  exportAuditReport: (format: 'json' | 'md') => void;
}

const PrivyShieldContext = createContext<PrivyShieldContextValue | null>(null);

const EMPTY_DETECTION: DetectionResult = {
  entities: [],
  rejectedCandidates: [],
  conflictsResolved: [],
  categoryCounts: emptyCategoryCounts(),
  processingTimeMs: 0,
  totalScannedLength: 0,
};

const INITIAL_RESIDUAL: ResidualScanResult = {
  status: 'not_run',
  remainingCount: 0,
  entities: [],
  scannedAt: null,
  disclaimer:
    'Residual scan checks only the 7 supported structured PII detectors. A clean scan does not guarantee removal of unstructured names or unsupported identifiers.',
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB browser safety limit

export const PrivyShieldProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<NavPage>('overview');
  const [visualEffects, setVisualEffects] = useState<VisualEffectsMode>(() =>
    prefersReducedMotion() ? 'reduced' : 'full'
  );
  const [webglSupported] = useState<boolean>(() => detectWebGLAvailability());
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);
  const [demoGuideActive, setDemoGuideActive] = useState<boolean>(false);

  const [documentText, setDocumentText] = useState<string>('');
  const [documentMeta, setDocumentMeta] = useState<DocumentMetadata | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStage, setScanStage] = useState<string>('Idle');
  const [detectionResult, setDetectionResult] = useState<DetectionResult>(EMPTY_DETECTION);
  const [sanitizedText, setSanitizedText] = useState<string>('');
  const [spanMappings, setSpanMappings] = useState<RedactionSpanMapping[]>([]);
  const [appliedCount, setAppliedCount] = useState<number>(0);
  const [mappingCount, setMappingCount] = useState<number>(0);
  const [defaultMode, setDefaultMode] = useState<RedactionMode>('pseudonym');
  const [categoryPolicies, setCategoryPolicies] = useState<CategoryPolicies>(
    DEFAULT_CATEGORY_POLICIES
  );
  const [residualScan, setResidualScan] = useState<ResidualScanResult>(INITIAL_RESIDUAL);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  const [csvOriginalRows, setCsvOriginalRows] = useState<string[][]>([]);
  const [csvSanitizedRows, setCsvSanitizedRows] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);

  const [totalDocumentsProcessed, setTotalDocumentsProcessed] = useState<number>(0);
  const [totalEntitiesDetectedSession, setTotalEntitiesDetectedSession] = useState<number>(0);
  const [totalEntitiesSanitizedSession, setTotalEntitiesSanitizedSession] = useState<number>(0);
  const [sessionCategoryTotals, setSessionCategoryTotals] = useState<Record<PIICategory, number>>(
    emptyCategoryCounts
  );
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  const [privacyChecks, setPrivacyChecks] = useState<PrivacyVerificationChecks>({
    networkTest: 'not_tested',
    networkTestDetails: 'Run the live Network Privacy Test to verify 0 outbound requests during sanitization.',
    networkRequestsObservedDuringScan: 0,
    residualScan: 'not_tested',
    residualScanDetails: 'Sanitize a document and run the Residual PII Scanner to verify output.',
    offlineCache: 'not_tested',
    offlineCacheDetails: 'Checking Service Worker asset cache status...',
    validationSuite: 'not_tested',
    validationSuiteDetails: 'Run the labelled benchmark suite in Detection Lab to record validation metrics.',
  });

  const pseudonymizerRef = useRef<Pseudonymizer>(new Pseudonymizer());
  const workerRef = useRef<Worker | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);

  const appendAudit = useCallback((entry: AuditLogEntry) => {
    setAuditLog((prev) => [entry, ...prev].slice(0, 200));
  }, []);

  // Online/offline listeners & PWA install listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const refreshOfflineCheck = useCallback(async () => {
    const status = await checkOfflineCacheStatus();
    setPrivacyChecks((prev) => ({
      ...prev,
      offlineCache: status.available ? 'passed' : 'not_tested',
      offlineCacheDetails: status.details,
    }));
  }, []);

  useEffect(() => {
    void refreshOfflineCheck();
  }, [refreshOfflineCheck]);

  const triggerPWAInstall = useCallback(async () => {
    if (!installPromptEvent) return;
    await installPromptEvent.prompt();
    await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
  }, [installPromptEvent]);

  const applyProcessedResults = useCallback(
    (params: {
      text: string;
      fileType: 'text' | 'txt' | 'csv';
      detection: DetectionResult;
      sanitized: string;
      spans: RedactionSpanMapping[];
      applied: number;
      mappings: number;
      residual: ResidualScanResult;
      originalRows?: string[][];
      sanitizedRows?: string[][];
      headers?: string[];
      countAsNewDocument: boolean;
      modeUsed: RedactionMode;
    }) => {
      setDetectionResult(params.detection);
      setSanitizedText(params.sanitized);
      setSpanMappings(params.spans);
      setAppliedCount(params.applied);
      setMappingCount(params.mappings);
      setResidualScan(params.residual);
      setCsvOriginalRows(params.originalRows ?? []);
      setCsvSanitizedRows(params.sanitizedRows ?? []);
      setCsvHeaders(params.headers ?? []);
      setIsScanning(false);
      setScanProgress(100);
      setScanStage('Sanitization complete');

      setPrivacyChecks((prev) => ({
        ...prev,
        residualScan: params.residual.status === 'clean' ? 'passed' : 'failed',
        residualScanDetails:
          params.residual.status === 'clean'
            ? 'Residual scan found 0 remaining supported PII patterns in sanitized output.'
            : `Residual scan flagged ${params.residual.remainingCount} supported pattern(s) remaining in output.`,
      }));

      if (params.countAsNewDocument && params.text.trim().length > 0) {
        setTotalDocumentsProcessed((n) => n + 1);
        setTotalEntitiesDetectedSession((n) => n + params.detection.entities.length);
        setTotalEntitiesSanitizedSession((n) => n + params.applied);
        setSessionCategoryTotals((prev) => {
          const next = { ...prev };
          for (const cat of ALL_PII_CATEGORIES) {
            next[cat] = (next[cat] ?? 0) + (params.detection.categoryCounts[cat] ?? 0);
          }
          return next;
        });

        appendAudit(
          createAuditEntry(
            'SCAN_COMPLETED',
            `Detected ${params.detection.entities.length} PII entity(ies) (${params.detection.rejectedCandidates.length} false-positive candidate(s) rejected, ${params.detection.conflictsResolved.length} overlap conflict(s) resolved).`,
            {
              entityCount: params.detection.entities.length,
              categoryCounts: params.detection.categoryCounts,
              fileType: params.fileType,
            }
          )
        );

        appendAudit(
          createAuditEntry(
            'SANITIZATION_COMPLETED',
            `Sanitized ${params.applied} entity(ies) using "${params.modeUsed}" mode.`,
            {
              entityCount: params.applied,
              redactionMode: params.modeUsed,
            }
          )
        );

        appendAudit(
          createAuditEntry(
            'RESIDUAL_SCAN_COMPLETED',
            params.residual.status === 'clean'
              ? 'Residual scan completed: 0 supported PII patterns remaining.'
              : `Residual scan completed: ${params.residual.remainingCount} supported pattern(s) require review.`,
            {
              residualCount: params.residual.remainingCount,
              passed: params.residual.status === 'clean',
            }
          )
        );
      }
    },
    [appendAudit]
  );

  const runProcessingPipeline = useCallback(
    (
      text: string,
      fileType: 'text' | 'txt' | 'csv',
      mode: RedactionMode,
      policies: CategoryPolicies,
      options: { countAsNewDocument: boolean; resetPseudonyms: boolean }
    ) => {
      if (options.resetPseudonyms) {
        pseudonymizerRef.current.reset();
      }

      if (!text.trim()) {
        setDetectionResult(EMPTY_DETECTION);
        setSanitizedText('');
        setSpanMappings([]);
        setAppliedCount(0);
        setMappingCount(pseudonymizerRef.current.getTotalMappingCount());
        setCsvOriginalRows([]);
        setCsvSanitizedRows([]);
        setCsvHeaders([]);
        setResidualScan(INITIAL_RESIDUAL);
        setIsScanning(false);
        setScanProgress(0);
        setScanStage('Idle');
        return;
      }

      const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      activeRequestIdRef.current = requestId;
      setIsScanning(true);
      setScanProgress(15);
      setScanStage('Initializing local engine...');

      // Direct local processing (fast path & offline/worker-unavailable fallback)
      const runDirectFallback = () => {
        if (fileType === 'csv') {
          const csvResult = processAndSanitizeCSV(
            text,
            mode,
            pseudonymizerRef.current,
            policies
          );
          const residual = scanResidualPII(csvResult.sanitizedCsvString);
          applyProcessedResults({
            text,
            fileType,
            detection: csvResult.detectionResult,
            sanitized: csvResult.sanitizedCsvString,
            spans: [],
            applied: csvResult.appliedCount,
            mappings: csvResult.mappingCount,
            residual,
            originalRows: csvResult.originalRows,
            sanitizedRows: csvResult.sanitizedRows,
            headers: csvResult.headers,
            countAsNewDocument: options.countAsNewDocument,
            modeUsed: mode,
          });
        } else {
          const detection = detectPII(text);
          const redaction = redactText(
            text,
            detection.entities,
            mode,
            pseudonymizerRef.current,
            policies
          );
          const residual = scanResidualPII(redaction.sanitizedText);
          applyProcessedResults({
            text,
            fileType,
            detection,
            sanitized: redaction.sanitizedText,
            spans: redaction.spanMappings,
            applied: redaction.appliedCount,
            mappings: redaction.mappingCount,
            residual,
            countAsNewDocument: options.countAsNewDocument,
            modeUsed: mode,
          });
        }
      };

      // Use Web Worker for large inputs (> 8,000 chars) or CSV files when Worker API exists
      const useWorker = typeof Worker !== 'undefined' && (fileType === 'csv' || text.length > 8000);

      if (useWorker) {
        try {
          if (!workerRef.current) {
            workerRef.current = new Worker(
              new URL('../workers/detection.worker.ts', import.meta.url),
              { type: 'module' }
            );
          }

          const worker = workerRef.current;
          worker.onerror = () => {
            worker.terminate();
            if (workerRef.current === worker) {
              workerRef.current = null;
            }
            if (activeRequestIdRef.current === requestId) {
              runDirectFallback();
            }
          };

          worker.onmessage = (event: MessageEvent<WorkerProcessResponse>) => {
            const data = event.data;
            if (data.requestId !== activeRequestIdRef.current) return;

            if (data.type === 'PROGRESS') {
              setScanProgress(data.progress ?? 50);
              setScanStage(data.stage ?? 'Processing locally...');
              return;
            }

            if (data.type === 'ERROR') {
              runDirectFallback();
              return;
            }

            if (data.type === 'RESULT' && data.detectionResult && data.residualScan) {
              applyProcessedResults({
                text,
                fileType,
                detection: data.detectionResult,
                sanitized: data.sanitizedText ?? '',
                spans: [],
                applied: data.appliedCount ?? 0,
                mappings: data.mappingCount ?? 0,
                residual: data.residualScan,
                originalRows: data.originalRows,
                sanitizedRows: data.sanitizedRows,
                headers: data.headers,
                countAsNewDocument: options.countAsNewDocument,
                modeUsed: mode,
              });
            }
          };

          worker.postMessage(
            fileType === 'csv'
              ? {
                  type: 'PROCESS_CSV',
                  requestId,
                  csvText: text,
                  defaultMode: mode,
                  categoryPolicies: policies,
                }
              : {
                  type: 'PROCESS_TEXT',
                  requestId,
                  text,
                  defaultMode: mode,
                  categoryPolicies: policies,
                }
          );
          return;
        } catch {
          // Fall back seamlessly to synchronous local processing if worker fails to instantiate
        }
      }

      runDirectFallback();
    },
    [applyProcessedResults]
  );

  const cancelProcessing = useCallback(() => {
    activeRequestIdRef.current = null;
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsScanning(false);
    setScanProgress(0);
    setScanStage('Processing cancelled');
  }, []);

  const updateDocumentText = useCallback(
    (newText: string) => {
      setDocumentText(newText);
      setSelectedEntityId(null);
      const parsed = parsePlainText(newText);
      const nextType = documentMeta?.fileType === 'csv' ? 'csv' : documentMeta?.fileType === 'txt' ? 'txt' : 'text';
      const nextMeta: DocumentMetadata = {
        name: documentMeta?.name ?? 'Untitled Document',
        sizeBytes: parsed.byteSize,
        fileType: nextType,
        isSyntheticSample: documentMeta?.isSyntheticSample ?? false,
      };
      setDocumentMeta(nextMeta);
      runProcessingPipeline(newText, nextType, defaultMode, categoryPolicies, {
        countAsNewDocument: false,
        resetPseudonyms: true,
      });
    },
    [documentMeta, defaultMode, categoryPolicies, runProcessingPipeline]
  );

  const uploadDocumentFile = useCallback(
    async (file: File) => {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith('.txt') && !lower.endsWith('.csv')) {
        throw new Error('Unsupported file format. Please upload a .txt or .csv file.');
      }
      if (file.size > MAX_FILE_BYTES) {
        throw new Error('File exceeds the 10 MB browser processing safety limit.');
      }

      const content = await file.text();
      const fileType: 'txt' | 'csv' = lower.endsWith('.csv') ? 'csv' : 'txt';
      const meta: DocumentMetadata = {
        name: file.name,
        sizeBytes: file.size,
        fileType,
        isSyntheticSample: false,
      };

      setDocumentText(content);
      setDocumentMeta(meta);
      setSelectedEntityId(null);

      appendAudit(
        createAuditEntry('FILE_UPLOADED', `Loaded local ${fileType.toUpperCase()} file (${file.size} bytes).`, {
          fileType,
          fileSizeBytes: file.size,
        })
      );

      runProcessingPipeline(content, fileType, defaultMode, categoryPolicies, {
        countAsNewDocument: true,
        resetPseudonyms: true,
      });
    },
    [appendAudit, defaultMode, categoryPolicies, runProcessingPipeline]
  );

  const loadSyntheticTextSample = useCallback(() => {
    const bytes = new TextEncoder().encode(SYNTHETIC_TEXT_SAMPLE).length;
    setDocumentText(SYNTHETIC_TEXT_SAMPLE);
    setDocumentMeta({
      name: 'synthetic-incident-sample.txt',
      sizeBytes: bytes,
      fileType: 'txt',
      isSyntheticSample: true,
    });
    setSelectedEntityId(null);
    appendAudit(
      createAuditEntry('SAMPLE_LOADED', 'Loaded synthetic TXT demonstration dataset (zero real PII).', {
        fileType: 'txt',
        fileSizeBytes: bytes,
      })
    );
    runProcessingPipeline(SYNTHETIC_TEXT_SAMPLE, 'txt', defaultMode, categoryPolicies, {
      countAsNewDocument: true,
      resetPseudonyms: true,
    });
  }, [appendAudit, defaultMode, categoryPolicies, runProcessingPipeline]);

  const loadSyntheticCsvSample = useCallback(() => {
    const bytes = new TextEncoder().encode(SYNTHETIC_CSV_SAMPLE).length;
    setDocumentText(SYNTHETIC_CSV_SAMPLE);
    setDocumentMeta({
      name: 'synthetic-kyc-records.csv',
      sizeBytes: bytes,
      fileType: 'csv',
      isSyntheticSample: true,
      rowCount: 4,
      columnCount: 9,
    });
    setSelectedEntityId(null);
    appendAudit(
      createAuditEntry('SAMPLE_LOADED', 'Loaded synthetic CSV demonstration dataset (zero real PII).', {
        fileType: 'csv',
        fileSizeBytes: bytes,
      })
    );
    runProcessingPipeline(SYNTHETIC_CSV_SAMPLE, 'csv', defaultMode, categoryPolicies, {
      countAsNewDocument: true,
      resetPseudonyms: true,
    });
  }, [appendAudit, defaultMode, categoryPolicies, runProcessingPipeline]);

  const clearWorkspace = useCallback(() => {
    cancelProcessing();
    pseudonymizerRef.current.reset();
    setDocumentText('');
    setDocumentMeta(null);
    setDetectionResult(EMPTY_DETECTION);
    setSanitizedText('');
    setSpanMappings([]);
    setAppliedCount(0);
    setMappingCount(0);
    setCsvOriginalRows([]);
    setCsvSanitizedRows([]);
    setCsvHeaders([]);
    setSelectedEntityId(null);
    setResidualScan(INITIAL_RESIDUAL);
    setScanStage('Workspace cleared');
  }, [cancelProcessing]);

  const setRedactionMode = useCallback(
    (mode: RedactionMode) => {
      setDefaultMode(mode);
      appendAudit(
        createAuditEntry('MODE_CHANGED', `Selected redaction mode: ${mode}.`, {
          redactionMode: mode,
        })
      );
      if (documentText.trim()) {
        runProcessingPipeline(
          documentText,
          documentMeta?.fileType ?? 'text',
          mode,
          categoryPolicies,
          { countAsNewDocument: false, resetPseudonyms: true }
        );
      }
    },
    [appendAudit, documentText, documentMeta, categoryPolicies, runProcessingPipeline]
  );

  const updateCategoryPolicies = useCallback(
    (policies: CategoryPolicies) => {
      setCategoryPolicies(policies);
      appendAudit(
        createAuditEntry('POLICY_UPDATED', 'Updated category-level redaction policy configuration.')
      );
      if (documentText.trim()) {
        runProcessingPipeline(
          documentText,
          documentMeta?.fileType ?? 'text',
          defaultMode,
          policies,
          { countAsNewDocument: false, resetPseudonyms: true }
        );
      }
    },
    [appendAudit, documentText, documentMeta, defaultMode, runProcessingPipeline]
  );

  const resetPseudonymMappings = useCallback(() => {
    pseudonymizerRef.current.reset();
    setMappingCount(0);
    appendAudit(
      createAuditEntry('PSEUDONYM_MAP_RESET', 'Cleared in-memory pseudonymization mapping table.')
    );
    if (documentText.trim()) {
      runProcessingPipeline(
        documentText,
        documentMeta?.fileType ?? 'text',
        defaultMode,
        categoryPolicies,
        { countAsNewDocument: false, resetPseudonyms: true }
      );
    }
  }, [appendAudit, documentText, documentMeta, defaultMode, categoryPolicies, runProcessingPipeline]);

  const reapplySanitization = useCallback(() => {
    if (!documentText.trim()) return;
    runProcessingPipeline(
      documentText,
      documentMeta?.fileType ?? 'text',
      defaultMode,
      categoryPolicies,
      { countAsNewDocument: false, resetPseudonyms: true }
    );
  }, [documentText, documentMeta, defaultMode, categoryPolicies, runProcessingPipeline]);

  const runResidualScanNow = useCallback(() => {
    if (!sanitizedText) return;
    const result = scanResidualPII(sanitizedText);
    setResidualScan(result);
    setPrivacyChecks((prev) => ({
      ...prev,
      residualScan: result.status === 'clean' ? 'passed' : 'failed',
      residualScanDetails:
        result.status === 'clean'
          ? 'Residual scan passed: 0 supported PII patterns found in sanitized output.'
          : `Residual scan found ${result.remainingCount} supported pattern(s) remaining.`,
    }));
    appendAudit(
      createAuditEntry(
        'RESIDUAL_SCAN_COMPLETED',
        result.status === 'clean'
          ? 'Manual residual scan completed: 0 supported patterns detected.'
          : `Manual residual scan detected ${result.remainingCount} supported pattern(s).`,
        { residualCount: result.remainingCount, passed: result.status === 'clean' }
      )
    );
  }, [sanitizedText, appendAudit]);

  const runPrivacyNetworkCheck = useCallback(async () => {
    setPrivacyChecks((prev) => ({
      ...prev,
      networkTest: 'pending',
      networkTestDetails: 'Running local detection & redaction while inspecting browser network activity...',
    }));
    const result = await runNetworkPrivacyTest();
    setPrivacyChecks((prev) => ({
      ...prev,
      networkTest: result.passed ? 'passed' : 'failed',
      networkTestDetails: result.details,
      networkRequestsObservedDuringScan: result.requestsDuringProcessing,
    }));
    appendAudit(
      createAuditEntry('PRIVACY_TEST_RUN', result.details, {
        passed: result.passed,
      })
    );
  }, [appendAudit]);

  const recordValidationBenchmarkResult = useCallback(
    (passed: boolean, details: string) => {
      setPrivacyChecks((prev) => ({
        ...prev,
        validationSuite: passed ? 'passed' : 'failed',
        validationSuiteDetails: details,
      }));
    },
    []
  );

  const exportSanitizedDocument = useCallback(
    (format: 'txt' | 'csv') => {
      if (!sanitizedText) return;
      const filename = buildSanitizedFilename(documentMeta?.name ?? 'document', format);
      const mimeType = format === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8';
      downloadBlobFile(sanitizedText, filename, mimeType);
      appendAudit(
        createAuditEntry('FILE_EXPORTED', `Exported sanitized ${format.toUpperCase()} document.`, {
          exportFormat: format,
          redactionMode: defaultMode,
        })
      );
    },
    [sanitizedText, documentMeta, defaultMode, appendAudit]
  );

  const exportAuditReport = useCallback(
    (format: 'json' | 'md') => {
      const payload = {
        reportGeneratedAt: new Date().toISOString(),
        application: 'PrivyShield v1.0',
        processingMode: 'strict-client-side-browser' as const,
        documentMetadata: createDocumentMetadataPayload(documentMeta),
        detectionSummary: {
          totalEntitiesDetected: detectionResult.entities.length,
          categoryCounts: detectionResult.categoryCounts,
          rejectedCandidatesCount: detectionResult.rejectedCandidates.length,
          conflictsResolvedCount: detectionResult.conflictsResolved.length,
        },
        sanitizationSummary: {
          redactionMode: defaultMode,
          entitiesSanitized: appliedCount,
          pseudonymMappingsActiveCount: mappingCount,
          note: 'Original-to-placeholder mappings are retained in volatile memory only and intentionally omitted from this report.',
        },
        residualScan: {
          status: residualScan.status,
          remainingSupportedPatterns: residualScan.remainingCount,
          scannedAt: residualScan.scannedAt,
          disclaimer: residualScan.disclaimer,
        },
        sessionActivityLog: auditLog,
      };

      const content =
        format === 'json' ? buildAuditReportJSON(payload) : buildAuditReportMarkdown(payload);
      const filename = `privyshield-audit-report.${format}`;
      const mime = format === 'json' ? 'application/json;charset=utf-8' : 'text/markdown;charset=utf-8';
      downloadBlobFile(content, filename, mime);
      appendAudit(
        createAuditEntry('FILE_EXPORTED', `Exported privacy audit report (${format.toUpperCase()}).`, {
          exportFormat: format,
        })
      );
    },
    [
      documentMeta,
      detectionResult,
      defaultMode,
      appliedCount,
      mappingCount,
      residualScan,
      auditLog,
      appendAudit,
    ]
  );

  const value = useMemo<PrivyShieldContextValue>(
    () => ({
      activePage,
      setActivePage,
      visualEffects,
      setVisualEffects,
      webglSupported,
      isOnline,
      canInstallPWA: Boolean(installPromptEvent),
      triggerPWAInstall,
      onboardingOpen,
      setOnboardingOpen,
      demoGuideActive,
      setDemoGuideActive,
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
      categoryPolicies,
      residualScan,
      selectedEntityId,
      setSelectedEntityId,
      csvOriginalRows,
      csvSanitizedRows,
      csvHeaders,
      totalDocumentsProcessed,
      totalEntitiesDetectedSession,
      totalEntitiesSanitizedSession,
      sessionCategoryTotals,
      auditLog,
      privacyChecks,
      updateDocumentText,
      uploadDocumentFile,
      loadSyntheticTextSample,
      loadSyntheticCsvSample,
      clearWorkspace,
      cancelProcessing,
      setRedactionMode,
      updateCategoryPolicies,
      resetPseudonymMappings,
      reapplySanitization,
      runResidualScanNow,
      runPrivacyNetworkCheck,
      refreshOfflineCheck,
      recordValidationBenchmarkResult,
      exportSanitizedDocument,
      exportAuditReport,
    }),
    [
      activePage,
      visualEffects,
      webglSupported,
      isOnline,
      installPromptEvent,
      triggerPWAInstall,
      onboardingOpen,
      demoGuideActive,
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
      categoryPolicies,
      residualScan,
      selectedEntityId,
      csvOriginalRows,
      csvSanitizedRows,
      csvHeaders,
      totalDocumentsProcessed,
      totalEntitiesDetectedSession,
      totalEntitiesSanitizedSession,
      sessionCategoryTotals,
      auditLog,
      privacyChecks,
      updateDocumentText,
      uploadDocumentFile,
      loadSyntheticTextSample,
      loadSyntheticCsvSample,
      clearWorkspace,
      cancelProcessing,
      setRedactionMode,
      updateCategoryPolicies,
      resetPseudonymMappings,
      reapplySanitization,
      runResidualScanNow,
      runPrivacyNetworkCheck,
      refreshOfflineCheck,
      recordValidationBenchmarkResult,
      exportSanitizedDocument,
      exportAuditReport,
    ]
  );

  return <PrivyShieldContext.Provider value={value}>{children}</PrivyShieldContext.Provider>;
};

export function usePrivyShield(): PrivyShieldContextValue {
  const ctx = useContext(PrivyShieldContext);
  if (!ctx) {
    throw new Error('usePrivyShield must be used inside PrivyShieldProvider');
  }
  return ctx;
}
