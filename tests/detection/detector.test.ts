import { describe, expect, it } from 'vitest';
import { detectPII, scanResidualPII } from '../../src/engine/detector';
import { resolveOverlaps } from '../../src/engine/overlapResolver';
import { Pseudonymizer } from '../../src/engine/pseudonymizer';
import { redactText } from '../../src/engine/redactor';
import { CATEGORY_PRIORITY, DetectionEntity } from '../../src/types/pii';
import { SYNTHETIC_AADHAAR_1, SYNTHETIC_INVALID_AADHAAR } from '../../src/utils/sampleData';

describe('Detection Engine & Overlap Resolution', () => {
  it('detects all 7 mandatory PII categories accurately', () => {
    const sample = [
      'Email: rahul@example.org',
      'Phone: +91 98765 43210',
      'IPv4: 10.0.0.25',
      'IPv6: 2001:db8::1',
      'PAN: ABCPK1234M',
      `Aadhaar: ${SYNTHETIC_AADHAAR_1}`,
      'Card: 4111-1111-1111-1111',
    ].join(' | ');

    const result = detectPII(sample);
    const categories = result.entities.map((e) => e.category);

    expect(categories).toContain('EMAIL');
    expect(categories).toContain('PHONE');
    expect(categories).toContain('IPV4');
    expect(categories).toContain('IPV6');
    expect(categories).toContain('PAN');
    expect(categories).toContain('AADHAAR');
    expect(categories).toContain('CREDIT_CARD');
    expect(result.entities).toHaveLength(7);
  });

  it('prevents Aadhaar and Credit Card digits from being detected as Phone numbers', () => {
    const text = `Aadhaar ${SYNTHETIC_AADHAAR_1} and Card 4111-1111-1111-1111`;
    const result = detectPII(text);

    expect(result.entities.map((e) => e.category)).toEqual(['AADHAAR', 'CREDIT_CARD']);
    expect(result.categoryCounts.PHONE).toBe(0);
  });

  it('rejects invalid Luhn, Verhoeff, and IPv4 candidates without false positives', () => {
    const text = `Bad card 4111-1111-1111-1112, bad Aadhaar ${SYNTHETIC_INVALID_AADHAAR}, bad IP 999.1.2.3, version v1.2.3.4, time 12:34:56.`;
    const result = detectPII(text);

    expect(result.entities).toHaveLength(0);
    expect(result.rejectedCandidates.length).toBeGreaterThanOrEqual(3);
  });

  it('resolves synthetic overlapping spans deterministically by priority', () => {
    const aadhaarEntity: DetectionEntity = {
      id: 'a1',
      category: 'AADHAAR',
      start: 0,
      end: 14,
      maskedPreview: 'XXXX XXXX 0123',
      length: 14,
      validationMethod: 'Verhoeff',
      validationStatus: 'valid',
      detectionReason: 'test',
      reviewStatus: 'confirmed',
      suggestedAction: 'full',
      priority: CATEGORY_PRIORITY.AADHAAR,
    };
    const overlappingPhone: DetectionEntity = {
      id: 'p1',
      category: 'PHONE',
      start: 2,
      end: 14,
      maskedPreview: 'XXXXXX0123',
      length: 12,
      validationMethod: 'libphonenumber',
      validationStatus: 'valid',
      detectionReason: 'test',
      reviewStatus: 'confirmed',
      suggestedAction: 'partial',
      priority: CATEGORY_PRIORITY.PHONE,
    };

    const { resolved, conflicts } = resolveOverlaps([overlappingPhone, aadhaarEntity]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].category).toBe('AADHAAR');
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].discardedCategory).toBe('PHONE');
  });

  it('runs residual PII scanner cleanly after full/pseudonym redaction', () => {
    const text = 'Contact rahul@example.org or +91 98765 43210 with PAN ABCPK1234M.';
    const detected = detectPII(text);
    const pseudo = new Pseudonymizer();
    const redacted = redactText(text, detected.entities, 'pseudonym', pseudo);
    const residual = scanResidualPII(redacted.sanitizedText);

    expect(residual.status).toBe('clean');
    expect(residual.remainingCount).toBe(0);
  });
});
