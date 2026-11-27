import {
  ALL_PII_CATEGORIES,
  AuditLogEntry,
  CATEGORY_LABELS,
  DocumentMetadata,
  PIICategory,
  RedactionMode,
  ResidualScanResult,
} from '../types/pii';

/**
 * Triggers a client-side file download via Blob URL and revokes it immediately afterwards.
 */
export function downloadBlobFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildSanitizedFilename(
  originalName: string,
  extension: 'txt' | 'csv'
): string {
  const base = originalName.replace(/\.[^/.]+$/, '').trim() || 'document';
  return `${base}.sanitized.${extension}`;
}

export interface AuditReportPayload {
  reportGeneratedAt: string;
  application: string;
  processingMode: 'strict-client-side-browser';
  documentMetadata: {
    name: string;
    fileType: string;
    sizeBytes: number;
    rowCount?: number;
    columnCount?: number;
  } | null;
  detectionSummary: {
    totalEntitiesDetected: number;
    categoryCounts: Record<PIICategory, number>;
    rejectedCandidatesCount: number;
    conflictsResolvedCount: number;
  };
  sanitizationSummary: {
    redactionMode: RedactionMode;
    entitiesSanitized: number;
    pseudonymMappingsActiveCount: number;
    note: string;
  };
  residualScan: {
    status: ResidualScanResult['status'];
    remainingSupportedPatterns: number;
    scannedAt: string | null;
    disclaimer: string;
  };
  sessionActivityLog: AuditLogEntry[];
}

export function buildAuditReportJSON(payload: AuditReportPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function buildAuditReportMarkdown(payload: AuditReportPayload): string {
  const lines: string[] = [
    '# PRIVYSHIELD — SANITIZATION & PRIVACY AUDIT REPORT',
    '',
    `- **Generated At:** ${payload.reportGeneratedAt}`,
    `- **Processing Architecture:** ${payload.processingMode} (zero original document transmission)`,
    `- **Document Name:** ${payload.documentMetadata?.name ?? 'Pasted Text'}`,
    `- **Document Type:** ${payload.documentMetadata?.fileType ?? 'text'}`,
    `- **Document Size:** ${payload.documentMetadata?.sizeBytes ?? 0} bytes`,
    '',
    '## Detection Summary',
    `- **Total Entities Detected:** ${payload.detectionSummary.totalEntitiesDetected}`,
    `- **False-Positive Candidates Rejected:** ${payload.detectionSummary.rejectedCandidatesCount}`,
    `- **Overlap Conflicts Resolved:** ${payload.detectionSummary.conflictsResolvedCount}`,
    '',
    '| PII Category | Detected Count |',
    '|---|---|',
    ...ALL_PII_CATEGORIES.map(
      (cat) => `| ${CATEGORY_LABELS[cat]} (${cat}) | ${payload.detectionSummary.categoryCounts[cat] ?? 0} |`
    ),
    '',
    '## Sanitization Summary',
    `- **Default Redaction Mode:** ${payload.sanitizationSummary.redactionMode}`,
    `- **Entities Sanitized:** ${payload.sanitizationSummary.entitiesSanitized}`,
    `- **Active In-Memory Pseudonym Mappings:** ${payload.sanitizationSummary.pseudonymMappingsActiveCount}`,
    `- **Privacy Note:** ${payload.sanitizationSummary.note}`,
    '',
    '## Residual PII Scanner',
    `- **Status:** ${payload.residualScan.status}`,
    `- **Remaining Supported Patterns:** ${payload.residualScan.remainingSupportedPatterns}`,
    `- **Scanned At:** ${payload.residualScan.scannedAt ?? 'Not Run'}`,
    `- **Scope Disclaimer:** ${payload.residualScan.disclaimer}`,
    '',
    '## Session Activity Log (Metadata Only — No Raw PII)',
    ...payload.sessionActivityLog.map(
      (entry) => `- [${entry.timestamp}] **${entry.eventType}**: ${entry.summary}`
    ),
    '',
  ];
  return lines.join('\n');
}

export function createDocumentMetadataPayload(
  meta: DocumentMetadata | null
): AuditReportPayload['documentMetadata'] {
  if (!meta) return null;
  return {
    name: meta.name,
    fileType: meta.fileType,
    sizeBytes: meta.sizeBytes,
    rowCount: meta.rowCount,
    columnCount: meta.columnCount,
  };
}
