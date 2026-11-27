import { describe, expect, it } from 'vitest';
import { recognizeAadhaar } from '../../src/recognizers/aadhaar';
import { recognizeCreditCards } from '../../src/recognizers/creditCard';
import { recognizeEmails } from '../../src/recognizers/email';
import { recognizeIPv4 } from '../../src/recognizers/ipv4';
import { recognizeIPv6 } from '../../src/recognizers/ipv6';
import { recognizePAN } from '../../src/recognizers/pan';
import { recognizePhones } from '../../src/recognizers/phone';
import { RecognizerContext } from '../../src/recognizers/types';
import { SYNTHETIC_AADHAAR_1, SYNTHETIC_INVALID_AADHAAR } from '../../src/utils/sampleData';

function createTestContext(): RecognizerContext {
  let counter = 0;
  return {
    createId: (prefix: string) => `${prefix}_${++counter}`,
  };
}

describe('Specialized Recognizers Unit Tests', () => {
  it('recognizeEmails detects valid emails and separates malformed candidates', () => {
    const ctx = createTestContext();
    const text = 'Valid rahul@example.com and alert@cyber.org, but not user@localhost or broken..dots@ex.com.';
    const output = recognizeEmails(text, ctx);

    expect(output.accepted).toHaveLength(2);
    expect(output.accepted.map((e) => text.slice(e.start, e.end))).toEqual([
      'rahul@example.com',
      'alert@cyber.org',
    ]);
    expect(output.rejected.length).toBeGreaterThanOrEqual(1);
  });

  it('recognizePhones detects national and international phone numbers with boundary checks', () => {
    const ctx = createTestContext();
    const text = 'Call +91 98765 43210 or 9876543210 or US +1 415 555 0198. Ignore 12345.';
    const output = recognizePhones(text, ctx);

    expect(output.accepted.length).toBeGreaterThanOrEqual(3);
    const previews = output.accepted.map((e) => e.category);
    expect(previews.every((cat) => cat === 'PHONE')).toBe(true);
  });

  it('recognizeIPv4 identifies valid IPv4 addresses and rejects false positives like version numbers', () => {
    const ctx = createTestContext();
    const text = 'Server at 192.168.1.100 and 10.0.0.1. Rejects 999.1.2.3 and v1.2.3.4 and 12:34:56.';
    const output = recognizeIPv4(text, ctx);

    expect(output.accepted.map((e) => text.slice(e.start, e.end))).toEqual([
      '192.168.1.100',
      '10.0.0.1',
    ]);
    expect(output.rejected.length).toBeGreaterThanOrEqual(1);
  });

  it('recognizeIPv6 handles compressed, localhost, and full IPv6 addresses', () => {
    const ctx = createTestContext();
    const text = 'Host ::1 or 2001:db8::1 or 2001:0db8:85a3:0000:0000:8a2e:0370:7334.';
    const output = recognizeIPv6(text, ctx);

    expect(output.accepted).toHaveLength(3);
    expect(output.accepted.every((e) => e.category === 'IPV6')).toBe(true);
  });

  it('recognizePAN detects valid PAN and flags unusual 4th character for human review', () => {
    const ctx = createTestContext();
    const text = 'Standard individual PAN ABCPK1234M and entity PAN ABCDE1234F. Invalid PAN 12345ABCD1.';
    const output = recognizePAN(text, ctx);

    expect(output.accepted).toHaveLength(2);
    const standard = output.accepted.find((e) => text.slice(e.start, e.end) === 'ABCPK1234M');
    const review = output.accepted.find((e) => text.slice(e.start, e.end) === 'ABCDE1234F');
    expect(standard?.reviewStatus).toBe('confirmed');
    expect(review?.reviewStatus).toBe('review_required');
  });

  it('recognizeAadhaar verifies Verhoeff check digit and rejects invalid checksum or leading 0/1', () => {
    const ctx = createTestContext();
    const text = `Valid Aadhaar: ${SYNTHETIC_AADHAAR_1} | Invalid Verhoeff: ${SYNTHETIC_INVALID_AADHAAR} | Leading zero: 0123 4567 8901.`;
    const output = recognizeAadhaar(text, ctx);

    expect(output.accepted).toHaveLength(1);
    expect(text.slice(output.accepted[0].start, output.accepted[0].end)).toBe(SYNTHETIC_AADHAAR_1);
    expect(output.rejected.length).toBeGreaterThanOrEqual(2);
  });

  it('recognizeCreditCards checks Luhn algorithm and rejects invalid check digit or all zeroes', () => {
    const ctx = createTestContext();
    const text = 'Valid card 4111-1111-1111-1111 and 5500 0000 0000 0004. Bad card 4111-1111-1111-1112 and 0000-0000-0000-0000.';
    const output = recognizeCreditCards(text, ctx);

    expect(output.accepted).toHaveLength(2);
    expect(output.rejected.length).toBeGreaterThanOrEqual(1);
  });
});
