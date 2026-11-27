import { describe, expect, it } from 'vitest';
import { createAuditEntry } from '../../src/services/auditService';
import {
  buildAuditReportJSON,
  buildAuditReportMarkdown,
  buildSanitizedFilename,
  createDocumentMetadataPayload,
} from '../../src/services/exportService';
import { checkOfflineCacheStatus } from '../../src/services/privacyService';
import { emptyCategoryCounts } from '../../src/engine/detector';

describe('PrivyShield Core Services', () => {
  it('buildSanitizedFilename appends .sanitized extension cleanly', () => {
    expect(buildSanitizedFilename('incident_report.txt', 'txt')).toBe('incident_report.sanitized.txt');
    expect(buildSanitizedFilename('customers.csv', 'csv')).toBe('customers.sanitized.csv');
    expect(buildSanitizedFilename('', 'txt')).toBe('document.sanitized.txt');
  });

  it('createAuditEntry records timestamp, type, summary, and safely masked metadata', () => {
    const entry = createAuditEntry('SCAN_COMPLETED', 'Detected 3 entities', {
      entityCount: 3,
      categoryCounts: emptyCategoryCounts(),
    });

    expect(entry.id).toContain('audit_');
    expect(entry.eventType).toBe('SCAN_COMPLETED');
    expect(entry.summary).toBe('Detected 3 entities');
    expect(entry.metadata?.entityCount).toBe(3);
    expect(new Date(entry.timestamp).getTime()).not.toBeNaN();
  });

  it('createDocumentMetadataPayload formats file metadata or returns null safely', () => {
    expect(createDocumentMetadataPayload(null)).toBeNull();

    const payload = createDocumentMetadataPayload({
      name: 'data.csv',
      fileType: 'csv',
      sizeBytes: 1024,
      rowCount: 10,
      columnCount: 5,
      isSyntheticSample: false,
    });

    expect(payload?.name).toBe('data.csv');
    expect(payload?.fileType).toBe('csv');
    expect(payload?.rowCount).toBe(10);
  });

  it('buildAuditReportMarkdown includes all detection headers and disclaimers', () => {
    const samplePayload = {
      reportGeneratedAt: '2026-11-27T10:00:00.000Z',
      application: 'PrivyShield',
      processingMode: 'strict-client-side-browser' as const,
      documentMetadata: {
        name: 'test.txt',
        fileType: 'txt',
        sizeBytes: 50,
      },
      detectionSummary: {
        totalEntitiesDetected: 1,
        categoryCounts: emptyCategoryCounts(),
        rejectedCandidatesCount: 0,
        conflictsResolvedCount: 0,
      },
      sanitizationSummary: {
        redactionMode: 'pseudonym' as const,
        entitiesSanitized: 1,
        pseudonymMappingsActiveCount: 1,
        note: 'In-memory test note',
      },
      residualScan: {
        status: 'clean' as const,
        remainingSupportedPatterns: 0,
        scannedAt: '2026-11-27T10:00:01.000Z',
        disclaimer: 'Supported patterns check only',
      },
      sessionActivityLog: [
        createAuditEntry('SAMPLE_LOADED', 'Loaded synthetic sample'),
      ],
    };

    const md = buildAuditReportMarkdown(samplePayload);
    expect(md).toContain('# PRIVYSHIELD — SANITIZATION & PRIVACY AUDIT REPORT');
    expect(md).toContain('strict-client-side-browser');
    expect(md).toContain('Supported patterns check only');

    const json = buildAuditReportJSON(samplePayload);
    expect(JSON.parse(json).application).toBe('PrivyShield');
  });

  it('checkOfflineCacheStatus evaluates cache storage without network access', async () => {
    const status = await checkOfflineCacheStatus();
    expect(typeof status.available).toBe('boolean');
    expect(status.details.length).toBeGreaterThan(0);
  });
});
