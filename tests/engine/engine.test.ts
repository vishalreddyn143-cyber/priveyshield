import { describe, expect, it } from 'vitest';
import {
  createMaskedPreview,
  isDigitChar,
  isWordBoundaryChar,
  stripSeparators,
} from '../../src/engine/normalizer';
import { resolveOverlaps } from '../../src/engine/overlapResolver';
import { Pseudonymizer } from '../../src/engine/pseudonymizer';
import { formatPartialMask, redactText } from '../../src/engine/redactor';
import { CATEGORY_PRIORITY, DetectionEntity } from '../../src/types/pii';

describe('Engine Utilities & Normalizer', () => {
  it('stripSeparators removes spaces, hyphens, parentheses, and dots', () => {
    expect(stripSeparators('+91 (987) 654-3210')).toBe('+919876543210');
    expect(stripSeparators('4111-1111-1111-1111')).toBe('4111111111111111');
    expect(stripSeparators('192.168.1.1')).toBe('19216811');
  });

  it('createMaskedPreview produces privacy-safe previews across all PII types', () => {
    expect(createMaskedPreview('rahul@example.com', 'EMAIL')).toContain('***@');
    expect(createMaskedPreview('9876543210', 'PHONE')).toBe('XXXXXX3210');
    expect(createMaskedPreview('2345 6789 0123', 'AADHAAR')).toBe('XXXX XXXX 0123');
    expect(createMaskedPreview('4111-1111-1111-1111', 'CREDIT_CARD')).toBe('XXXX-XXXX-XXXX-1111');
    expect(createMaskedPreview('ABCPK1234M', 'PAN')).toBe('XXXXX1234X');
    expect(createMaskedPreview('192.168.1.45', 'IPV4')).toBe('192.xxx.xxx.45');
    expect(createMaskedPreview('2001:db8::1', 'IPV6')).toContain(':****:');
  });

  it('isWordBoundaryChar and isDigitChar correctly classify characters', () => {
    expect(isWordBoundaryChar(' ')).toBe(true);
    expect(isWordBoundaryChar('.')).toBe(true);
    expect(isWordBoundaryChar(undefined)).toBe(true);
    expect(isWordBoundaryChar('a')).toBe(false);
    expect(isWordBoundaryChar('5')).toBe(false);

    expect(isDigitChar('9')).toBe(true);
    expect(isDigitChar('0')).toBe(true);
    expect(isDigitChar('x')).toBe(false);
    expect(isDigitChar(undefined)).toBe(false);
  });

  it('formatPartialMask formats sensitive values appropriately', () => {
    expect(formatPartialMask('EMAIL', 'alice@corp.com')).toBe('a***@corp.com');
    expect(formatPartialMask('PHONE', '9876543210')).toBe('XXXXXX3210');
    expect(formatPartialMask('CREDIT_CARD', '4111-1111-1111-1111')).toBe('XXXX-XXXX-XXXX-1111');
    expect(formatPartialMask('PAN', 'ABCPK1234M')).toBe('XXXXX1234X');
  });

  it('resolveOverlaps breaks ties using span length and category priority', () => {
    const shortAadhaar: DetectionEntity = {
      id: 'a1',
      category: 'AADHAAR',
      start: 5,
      end: 15,
      maskedPreview: 'XXXX XXXX 0123',
      length: 10,
      validationMethod: 'Verhoeff',
      validationStatus: 'valid',
      detectionReason: 'test',
      reviewStatus: 'confirmed',
      suggestedAction: 'full',
      priority: CATEGORY_PRIORITY.AADHAAR,
    };

    const longerCard: DetectionEntity = {
      id: 'c1',
      category: 'CREDIT_CARD',
      start: 0,
      end: 19,
      maskedPreview: 'XXXX-XXXX-XXXX-1111',
      length: 19,
      validationMethod: 'Luhn',
      validationStatus: 'valid',
      detectionReason: 'test',
      reviewStatus: 'confirmed',
      suggestedAction: 'full',
      priority: CATEGORY_PRIORITY.CREDIT_CARD,
    };

    const result = resolveOverlaps([shortAadhaar, longerCard]);
    expect(result.resolved).toHaveLength(1);
    expect(result.resolved[0].category).toBe('CREDIT_CARD');
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].keptCategory).toBe('CREDIT_CARD');
    expect(result.conflicts[0].discardedCategory).toBe('AADHAAR');
  });

  it('handles empty inputs safely in redactText', () => {
    const pseudo = new Pseudonymizer();
    const res = redactText('', [], 'full', pseudo);
    expect(res.sanitizedText).toBe('');
    expect(res.appliedCount).toBe(0);
    expect(res.spanMappings).toHaveLength(0);
  });
});
