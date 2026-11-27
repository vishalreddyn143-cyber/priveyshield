import { describe, expect, it } from 'vitest';
import {
  computeVerhoeffCheckDigit,
  validateAadhaar,
  validateCreditCard,
  validateEmail,
  validateIPv4,
  validateIPv6,
  validatePAN,
  validatePhone,
  verifyLuhn,
  verifyVerhoeff,
} from '../../src/engine/validator';

describe('Validators — False-Positive Prevention', () => {
  it('validates Credit Cards with Luhn checksum and rejects invalid ones', () => {
    expect(verifyLuhn('4111111111111111')).toBe(true);
    expect(verifyLuhn('5500000000000004')).toBe(true);
    expect(verifyLuhn('4111111111111112')).toBe(false);
    expect(validateCreditCard('4111-1111-1111-1111').valid).toBe(true);
    expect(validateCreditCard('4111-1111-1111-1112').valid).toBe(false);
    expect(validateCreditCard('0000-0000-0000-0000').valid).toBe(false);
  });

  it('validates Aadhaar with Verhoeff checksum and rejects invalid checksums or leading 0/1', () => {
    const valid11 = '23456789012';
    const check = computeVerhoeffCheckDigit(valid11);
    const validAadhaar = `${valid11}${check}`;
    expect(verifyVerhoeff(validAadhaar)).toBe(true);
    expect(validateAadhaar(validAadhaar).valid).toBe(true);

    const wrongCheck = String((Number(check) + 1) % 10);
    expect(validateAadhaar(`${valid11}${wrongCheck}`).valid).toBe(false);
    expect(validateAadhaar(`03456789012${computeVerhoeffCheckDigit('03456789012')}`).valid).toBe(
      false
    );
    expect(validateAadhaar(`13456789012${computeVerhoeffCheckDigit('13456789012')}`).valid).toBe(
      false
    );
  });

  it('validates Indian PAN format and flags non-standard 4th character', () => {
    const standard = validatePAN('ABCPK1234M');
    expect(standard.valid).toBe(true);
    expect(standard.reviewRequired).toBe(false);

    const nonStandard = validatePAN('ABCDE1234F');
    expect(nonStandard.valid).toBe(true);
    expect(nonStandard.reviewRequired).toBe(true);

    expect(validatePAN('ABCPK0000M').valid).toBe(false);
    expect(validatePAN('12345ABCD1').valid).toBe(false);
  });

  it('validates Email structure and rejects malformed addresses', () => {
    expect(validateEmail('rahul.verma@example-corp.in').valid).toBe(true);
    expect(validateEmail('bad..email@example.com').valid).toBe(false);
    expect(validateEmail('no-tld@localhost').valid).toBe(false);
  });

  it('validates Indian and International phone numbers via libphonenumber-js', () => {
    expect(validatePhone('+91 98765 43210', 'IN').valid).toBe(true);
    expect(validatePhone('9876543210', 'IN').valid).toBe(true);
    expect(validatePhone('+1 415 555 0198', 'US').valid).toBe(true);
    expect(validatePhone('12345', 'IN').valid).toBe(false);
  });

  it('validates IPv4 and IPv6 addresses via ipaddr.js', () => {
    expect(validateIPv4('192.168.10.45').valid).toBe(true);
    expect(validateIPv4('999.168.10.45').valid).toBe(false);
    expect(validateIPv4('256.0.0.1').valid).toBe(false);

    expect(validateIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334').valid).toBe(true);
    expect(validateIPv6('2001:db8::1').valid).toBe(true);
    expect(validateIPv6('::1').valid).toBe(true);
    expect(validateIPv6('gggg::1').valid).toBe(false);
  });
});
