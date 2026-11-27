import { describe, expect, it } from 'vitest';
import { detectPII } from '../../src/engine/detector';
import { Pseudonymizer } from '../../src/engine/pseudonymizer';
import { redactText } from '../../src/engine/redactor';
import { createAuditEntry } from '../../src/services/auditService';
import { buildAuditReportJSON, buildAuditReportMarkdown } from '../../src/services/exportService';
import { runNetworkPrivacyTest } from '../../src/services/privacyService';
import { SYNTHETIC_TEXT_SAMPLE } from '../../src/utils/sampleData';

describe('Privacy Invariants & Large Document Performance', () => {
  it('never leaks raw PII or pseudonym mappings in audit logs or exported audit reports', () => {
    const rawSecretEmail = 'secret.user@example-corp.in';
    const rawSecretCard = '4111-1111-1111-1111';
    const text = `Contact ${rawSecretEmail} with card ${rawSecretCard}.`;
    const detection = detectPII(text);
    const pseudo = new Pseudonymizer();
    redactText(text, detection.entities, 'pseudonym', pseudo);

    const logEntry = createAuditEntry(
      'SCAN_COMPLETED',
      `Detected ${detection.entities.length} PII entities.`,
      { entityCount: detection.entities.length, categoryCounts: detection.categoryCounts }
    );

    const jsonReport = buildAuditReportJSON({
      reportGeneratedAt: new Date().toISOString(),
      application: 'PrivyShield',
      processingMode: 'strict-client-side-browser',
      documentMetadata: { name: 'test.txt', fileType: 'txt', sizeBytes: text.length },
      detectionSummary: {
        totalEntitiesDetected: detection.entities.length,
        categoryCounts: detection.categoryCounts,
        rejectedCandidatesCount: detection.rejectedCandidates.length,
        conflictsResolvedCount: detection.conflictsResolved.length,
      },
      sanitizationSummary: {
        redactionMode: 'pseudonym',
        entitiesSanitized: detection.entities.length,
        pseudonymMappingsActiveCount: pseudo.getTotalMappingCount(),
        note: 'Omitted',
      },
      residualScan: {
        status: 'clean',
        remainingSupportedPatterns: 0,
        scannedAt: new Date().toISOString(),
        disclaimer: 'Supported patterns only',
      },
      sessionActivityLog: [logEntry],
    });

    const mdReport = buildAuditReportMarkdown(JSON.parse(jsonReport));

    expect(jsonReport).not.toContain(rawSecretEmail);
    expect(jsonReport).not.toContain(rawSecretCard);
    expect(jsonReport).not.toContain('EMAIL_01');
    expect(mdReport).not.toContain(rawSecretEmail);
    expect(mdReport).not.toContain(rawSecretCard);
  });

  it('executes network privacy test with zero network calls during sanitization', async () => {
    const result = await runNetworkPrivacyTest();
    expect(result.passed).toBe(true);
    expect(result.requestsDuringProcessing).toBe(0);
  });

  it('processes large multi-thousand-line documents cleanly in-memory', () => {
    const repeated = Array.from({ length: 150 }, (_, idx) =>
      `Row ${idx}: ${SYNTHETIC_TEXT_SAMPLE}`
    ).join('\n');
    const detection = detectPII(repeated);
    const redacted = redactText(repeated, detection.entities, 'pseudonym', new Pseudonymizer());

    expect(detection.entities.length).toBeGreaterThan(500);
    expect(redacted.sanitizedText).not.toContain('rahul.verma@example-corp.in');
    expect(redacted.sanitizedText).not.toContain('4111-1111-1111-1111');
  });
});
