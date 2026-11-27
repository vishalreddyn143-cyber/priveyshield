export type PIICategory =
  | 'EMAIL'
  | 'PHONE'
  | 'IPV4'
  | 'IPV6'
  | 'PAN'
  | 'AADHAAR'
  | 'CREDIT_CARD';

export type ValidationStatus = 'valid' | 'invalid' | 'review_required';

export type RedactionMode = 'full' | 'partial' | 'pseudonym';

export type CategoryPolicySetting = 'default' | RedactionMode;

export type CategoryPolicies = Record<PIICategory, CategoryPolicySetting>;

export type VerificationState = 'passed' | 'failed' | 'pending' | 'not_tested';

export type VisualEffectsMode = 'full' | 'reduced' | 'disabled';

export interface DetectionEntity {
  id: string;
  category: PIICategory;
  start: number;
  end: number;
  /** Never expose raw sensitive text in logs or audit reports; maskedPreview is safe for UI display */
  maskedPreview: string;
  /** Length of the matched original span */
  length: number;
  validationMethod: string;
  validationStatus: ValidationStatus;
  detectionReason: string;
  reviewStatus: 'confirmed' | 'review_required' | 'rejected';
  suggestedAction: RedactionMode;
  technicalDetails?: Record<string, string | number | boolean>;
  /** Priority used by overlap resolver */
  priority: number;
}

export interface RejectedCandidate {
  id: string;
  category: PIICategory;
  start: number;
  end: number;
  maskedPreview: string;
  validationMethod: string;
  rejectionReason: string;
}

export interface ConflictResolutionRecord {
  id: string;
  keptCategory: PIICategory;
  discardedCategory: PIICategory;
  keptSpan: [number, number];
  discardedSpan: [number, number];
  reason: string;
}

export interface DetectionResult {
  entities: DetectionEntity[];
  rejectedCandidates: RejectedCandidate[];
  conflictsResolved: ConflictResolutionRecord[];
  categoryCounts: Record<PIICategory, number>;
  processingTimeMs: number;
  totalScannedLength: number;
}

export interface RedactionSummary {
  sanitizedText: string;
  appliedCount: number;
  modeUsed: RedactionMode;
  categoryReplacements: Record<PIICategory, number>;
  appliedPolicies: Record<PIICategory, RedactionMode>;
  mappingCount: number;
}

export interface ResidualScanResult {
  status: 'clean' | 'residual_detected' | 'not_run';
  remainingCount: number;
  entities: DetectionEntity[];
  scannedAt: string | null;
  disclaimer: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType:
    | 'SAMPLE_LOADED'
    | 'FILE_UPLOADED'
    | 'SCAN_STARTED'
    | 'SCAN_COMPLETED'
    | 'MODE_CHANGED'
    | 'POLICY_UPDATED'
    | 'SANITIZATION_COMPLETED'
    | 'RESIDUAL_SCAN_COMPLETED'
    | 'PSEUDONYM_MAP_RESET'
    | 'FILE_EXPORTED'
    | 'PRIVACY_TEST_RUN';
  summary: string;
  metadata?: {
    fileType?: string;
    fileSizeBytes?: number;
    entityCount?: number;
    categoryCounts?: Partial<Record<PIICategory, number>>;
    redactionMode?: RedactionMode;
    residualCount?: number;
    exportFormat?: 'txt' | 'csv' | 'json' | 'md';
    passed?: boolean;
  };
}

export interface DocumentMetadata {
  name: string;
  sizeBytes: number;
  fileType: 'text' | 'txt' | 'csv';
  isSyntheticSample?: boolean;
  rowCount?: number;
  columnCount?: number;
}

export interface PrivacyVerificationChecks {
  networkTest: VerificationState;
  networkTestDetails: string;
  networkRequestsObservedDuringScan: number;
  residualScan: VerificationState;
  residualScanDetails: string;
  offlineCache: VerificationState;
  offlineCacheDetails: string;
  validationSuite: VerificationState;
  validationSuiteDetails: string;
}

export const ALL_PII_CATEGORIES: PIICategory[] = [
  'EMAIL',
  'PHONE',
  'IPV4',
  'IPV6',
  'PAN',
  'AADHAAR',
  'CREDIT_CARD',
];

export const CATEGORY_LABELS: Record<PIICategory, string> = {
  EMAIL: 'Email Address',
  PHONE: 'Phone Number',
  IPV4: 'IPv4 Address',
  IPV6: 'IPv6 Address',
  PAN: 'Indian PAN',
  AADHAAR: 'Aadhaar Number',
  CREDIT_CARD: 'Credit Card',
};

export const CATEGORY_PRIORITY: Record<PIICategory, number> = {
  CREDIT_CARD: 100,
  AADHAAR: 90,
  IPV6: 85,
  EMAIL: 80,
  PAN: 75,
  IPV4: 70,
  PHONE: 60,
};

export const DEFAULT_CATEGORY_POLICIES: CategoryPolicies = {
  EMAIL: 'default',
  PHONE: 'default',
  IPV4: 'default',
  IPV6: 'default',
  PAN: 'default',
  AADHAAR: 'default',
  CREDIT_CARD: 'default',
};
