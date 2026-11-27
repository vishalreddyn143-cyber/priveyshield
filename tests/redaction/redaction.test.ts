import { describe, expect, it } from 'vitest';
import { detectPII } from '../../src/engine/detector';
import { Pseudonymizer } from '../../src/engine/pseudonymizer';
import { redactText } from '../../src/engine/redactor';
import { DEFAULT_CATEGORY_POLICIES } from '../../src/types/pii';
import { SYNTHETIC_AADHAAR_1 } from '../../src/utils/sampleData';

describe('Pseudonymization & Three Redaction Modes', () => {
  it('assigns consistent pseudonyms across repeated values and separate category namespaces', () => {
    const pseudo = new Pseudonymizer();
    expect(pseudo.getOrCreate('EMAIL', 'rahul@gmail.com')).toBe('EMAIL_01');
    expect(pseudo.getOrCreate('EMAIL', 'priya@gmail.com')).toBe('EMAIL_02');
    expect(pseudo.getOrCreate('EMAIL', 'rahul@gmail.com')).toBe('EMAIL_01');
    expect(pseudo.getOrCreate('PHONE', '9876543210')).toBe('PHONE_01');
    expect(pseudo.getTotalMappingCount()).toBe(3);

    pseudo.reset();
    expect(pseudo.getTotalMappingCount()).toBe(0);
    expect(pseudo.getOrCreate('EMAIL', 'priya@gmail.com')).toBe('EMAIL_01');
  });

  it('applies full, partial, and pseudonymization modes preserving text offsets', () => {
    const text = `Email rahul@gmail.com and priya@gmail.com then rahul@gmail.com | Card 4111-1111-1111-1111 | Aadhaar ${SYNTHETIC_AADHAAR_1} | PAN ABCPK1234M | Phone 9876543210`;
    const detection = detectPII(text);

    // Mode A: Full
    const fullOut = redactText(text, detection.entities, 'full', new Pseudonymizer());
    expect(fullOut.sanitizedText).not.toContain('rahul@gmail.com');
    expect(fullOut.sanitizedText).not.toContain('4111-1111-1111-1111');
    expect(fullOut.sanitizedText).toContain('[REDACTED]');

    // Mode B: Partial
    const partialOut = redactText(text, detection.entities, 'partial', new Pseudonymizer());
    expect(partialOut.sanitizedText).toContain('r***@gmail.com');
    expect(partialOut.sanitizedText).toContain('XXXX-XXXX-XXXX-1111');
    expect(partialOut.sanitizedText).toContain('XXXXX1234X');
    expect(partialOut.sanitizedText).toContain('XXXXXX3210');

    // Mode C: Consistent Pseudonymization
    const pseudoOut = redactText(text, detection.entities, 'pseudonym', new Pseudonymizer());
    expect(pseudoOut.sanitizedText).toContain('Email EMAIL_01 and EMAIL_02 then EMAIL_01');
    expect(pseudoOut.sanitizedText).toContain('Card CARD_01');
    expect(pseudoOut.sanitizedText).toContain('Aadhaar AADHAAR_01');
    expect(pseudoOut.sanitizedText).toContain('PAN PAN_01');
    expect(pseudoOut.sanitizedText).toContain('Phone PHONE_01');
  });

  it('honors category-level policy overrides from Privacy Control Center', () => {
    const text = 'Email rahul@gmail.com and Card 4111-1111-1111-1111';
    const detection = detectPII(text);
    const policies = {
      ...DEFAULT_CATEGORY_POLICIES,
      EMAIL: 'partial' as const,
      CREDIT_CARD: 'full' as const,
    };

    const out = redactText(text, detection.entities, 'pseudonym', new Pseudonymizer(), policies);
    expect(out.sanitizedText).toBe('Email r***@gmail.com and Card [REDACTED]');
  });
});
