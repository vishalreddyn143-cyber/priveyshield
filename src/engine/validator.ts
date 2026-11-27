import * as ipaddr from 'ipaddr.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Verhoeff algorithm multiplication, permutation, and inverse tables.
 * Used for validating 12-digit Indian Aadhaar structural checksums.
 */
const VERHOEFF_D: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export const VERHOEFF_INV: number[] = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Computes whether a digit string passes the Verhoeff checksum.
 */
export function verifyVerhoeff(numStr: string): boolean {
  if (!/^\d+$/.test(numStr)) return false;
  let c = 0;
  const reversed = numStr.split('').reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][reversed[i]]];
  }
  return c === 0;
}

/**
 * Generates a valid Verhoeff check digit for an 11-digit prefix (for synthetic test generation).
 */
export function computeVerhoeffCheckDigit(partialDigits: string): string {
  let c = 0;
  const reversed = partialDigits.split('').reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][reversed[i]]];
  }
  return String(VERHOEFF_INV[c]);
}

/**
 * Luhn checksum validation for payment card numbers (13-19 digits).
 */
export function verifyLuhn(digits: string): boolean {
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function detectCardNetwork(digits: string): string | null {
  if (/^4\d{12}(\d{3})?(\d{3})?$/.test(digits)) return 'Visa';
  if (/^(5[1-5]\d{14}|2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)\d{12})$/.test(digits)) {
    return 'Mastercard';
  }
  if (/^3[47]\d{13}$/.test(digits)) return 'American Express';
  if (/^(60|65|81|82|508)\d{13,17}$/.test(digits)) return 'RuPay / Discover';
  if (/^3(0[0-5]|[68]\d)\d{11,16}$/.test(digits)) return 'Diners Club';
  if (/^35(2[89]|[3-8]\d)\d{12,15}$/.test(digits)) return 'JCB';
  return null;
}

export interface CardValidationResult {
  valid: boolean;
  digits: string;
  network: string;
  reason: string;
}

export function validateCreditCard(raw: string): CardValidationResult {
  const digits = raw.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digits)) {
    return {
      valid: false,
      digits,
      network: 'Unknown',
      reason: 'Digit count outside valid payment card length (13–19 digits).',
    };
  }
  if (/^(\d)\1+$/.test(digits)) {
    return {
      valid: false,
      digits,
      network: 'Unknown',
      reason: 'Rejected repeating single-digit sequence.',
    };
  }
  const luhnOk = verifyLuhn(digits);
  if (!luhnOk) {
    return {
      valid: false,
      digits,
      network: detectCardNetwork(digits) ?? 'Unknown',
      reason: 'Failed Luhn mod-10 checksum verification.',
    };
  }
  const network = detectCardNetwork(digits) ?? 'Standard IIN';
  return {
    valid: true,
    digits,
    network,
    reason: `Matched card length (${digits.length} digits), IIN pattern (${network}), and passed Luhn checksum.`,
  };
}

export interface AadhaarValidationResult {
  valid: boolean;
  digits: string;
  reason: string;
}

export function validateAadhaar(raw: string): AadhaarValidationResult {
  const digits = raw.replace(/[\s-]/g, '');
  if (!/^\d{12}$/.test(digits)) {
    return {
      valid: false,
      digits,
      reason: 'Candidate does not contain exactly 12 digits.',
    };
  }
  if (/^[01]/.test(digits)) {
    return {
      valid: false,
      digits,
      reason: 'UIDAI Aadhaar numbers cannot begin with 0 or 1.',
    };
  }
  if (/^(\d)\1{11}$/.test(digits)) {
    return {
      valid: false,
      digits,
      reason: 'Rejected identical repeating digits.',
    };
  }
  if (!verifyVerhoeff(digits)) {
    return {
      valid: false,
      digits,
      reason: 'Failed Verhoeff checksum verification.',
    };
  }
  return {
    valid: true,
    digits,
    reason:
      'Matched 12-digit UIDAI structure (leading digit 2–9) and passed Verhoeff checksum. Note: checksum validates structure, not genuine issuance.',
  };
}

const PAN_ENTITY_CODES: Record<string, string> = {
  P: 'Individual / Person',
  C: 'Company',
  H: 'Hindu Undivided Family (HUF)',
  A: 'Association of Persons (AOP)',
  B: 'Body of Individuals (BOI)',
  G: 'Government Agency',
  J: 'Artificial Juridical Person',
  L: 'Local Authority',
  F: 'Firm / LLP',
  T: 'Trust',
};

export interface PANValidationResult {
  valid: boolean;
  reviewRequired: boolean;
  entityType: string;
  reason: string;
}

export function validatePAN(raw: string): PANValidationResult {
  const trimmed = raw.trim();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(trimmed)) {
    return {
      valid: false,
      reviewRequired: false,
      entityType: 'Invalid',
      reason: 'Does not match 10-character Indian PAN pattern (AAAAA9999A).',
    };
  }
  if (trimmed.slice(5, 9) === '0000') {
    return {
      valid: false,
      reviewRequired: false,
      entityType: 'Invalid',
      reason: 'Rejected sequential zero block (0000) in PAN numeric segment.',
    };
  }
  const fourthChar = trimmed[3];
  const entityType = PAN_ENTITY_CODES[fourthChar];
  if (!entityType) {
    return {
      valid: true,
      reviewRequired: true,
      entityType: `Unrecognized code (${fourthChar})`,
      reason: `Matched AAAAA9999A format, but 4th character "${fourthChar}" is outside standard Income Tax entity codes [PCHABGJLFT]. Marked for review.`,
    };
  }
  return {
    valid: true,
    reviewRequired: false,
    entityType,
    reason: `Matched Indian PAN structure (AAAAA9999A) with entity code "${fourthChar}" (${entityType}).`,
  };
}

export interface EmailValidationResult {
  valid: boolean;
  reason: string;
}

export function validateEmail(raw: string): EmailValidationResult {
  const trimmed = raw.trim();
  if (trimmed.length > 254) {
    return { valid: false, reason: 'Exceeds maximum RFC 5321 email length (254 chars).' };
  }
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0 || atIndex !== trimmed.lastIndexOf('@')) {
    return { valid: false, reason: 'Missing or multiple "@" separators.' };
  }
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return { valid: false, reason: 'Invalid email local-part syntax.' };
  }
  if (
    domain.length > 253 ||
    !domain.includes('.') ||
    domain.startsWith('.') ||
    domain.endsWith('.') ||
    domain.includes('..')
  ) {
    return { valid: false, reason: 'Invalid email domain syntax.' };
  }
  const labels = domain.split('.');
  const tld = labels[labels.length - 1];
  if (!/^[A-Za-z]{2,24}$/.test(tld)) {
    return { valid: false, reason: 'Invalid top-level domain label.' };
  }
  if (labels.some((l) => !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(l))) {
    return { valid: false, reason: 'Invalid domain label characters.' };
  }
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) {
    return { valid: false, reason: 'Invalid characters in local-part.' };
  }
  return {
    valid: true,
    reason:
      'Passed RFC-aligned local-part and DNS domain structure validation. Note: structural syntax does not verify mailbox existence.',
  };
}

export interface IPValidationResult {
  valid: boolean;
  kind: 'ipv4' | 'ipv6' | 'invalid';
  range: string;
  reason: string;
}

export function validateIPv4(raw: string): IPValidationResult {
  const trimmed = raw.trim();
  if (!ipaddr.IPv4.isValidFourPartDecimal(trimmed)) {
    return {
      valid: false,
      kind: 'invalid',
      range: 'unknown',
      reason: 'Rejected by ipaddr.js strict 4-part decimal IPv4 parser (invalid octets or syntax).',
    };
  }
  const parsed = ipaddr.IPv4.parse(trimmed);
  const range = parsed.range();
  return {
    valid: true,
    kind: 'ipv4',
    range,
    reason: `Parsed cleanly by ipaddr.js as valid IPv4 address (scope: ${range}).`,
  };
}

export function validateIPv6(raw: string): IPValidationResult {
  const trimmed = raw.trim();
  if (!trimmed.includes(':')) {
    return {
      valid: false,
      kind: 'invalid',
      range: 'unknown',
      reason: 'Missing colon separator required for IPv6.',
    };
  }
  if (!ipaddr.IPv6.isValid(trimmed)) {
    return {
      valid: false,
      kind: 'invalid',
      range: 'unknown',
      reason: 'Rejected by ipaddr.js IPv6 parser.',
    };
  }
  const parsed = ipaddr.IPv6.parse(trimmed);
  const range = parsed.range();
  return {
    valid: true,
    kind: 'ipv6',
    range,
    reason: `Parsed cleanly by ipaddr.js as valid IPv6 address (scope: ${range}).`,
  };
}

export interface PhoneValidationResult {
  valid: boolean;
  country: string | null;
  e164: string | null;
  reason: string;
}

export function validatePhone(raw: string, defaultCountry: 'IN' | 'US' = 'IN'): PhoneValidationResult {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  // Guard against overly short or overly long digit chains (e.g., Aadhaar 12 digits without +91, or cards)
  if (digits.length < 7 || digits.length > 15) {
    return {
      valid: false,
      country: null,
      e164: null,
      reason: 'Digit count outside valid E.164 phone length (7–15 digits).',
    };
  }
  // If 12 digits and does not start with '+' or '91' (Indian country code) or '00', avoid mistaking Aadhaar for phone
  if (digits.length === 12 && !trimmed.startsWith('+') && !digits.startsWith('91')) {
    return {
      valid: false,
      country: null,
      e164: null,
      reason: 'Rejected 12-digit non-prefixed candidate to prevent false phone matches on national IDs.',
    };
  }

  const parsed = trimmed.startsWith('+')
    ? parsePhoneNumberFromString(trimmed)
    : parsePhoneNumberFromString(trimmed, defaultCountry);

  if (!parsed) {
    return {
      valid: false,
      country: null,
      e164: null,
      reason: 'Could not be parsed by libphonenumber-js.',
    };
  }

  const isValid = parsed.isValid();
  if (!isValid) {
    return {
      valid: false,
      country: parsed.country ?? null,
      e164: null,
      reason: 'Rejected by libphonenumber-js national numbering plan validation.',
    };
  }

  return {
    valid: true,
    country: parsed.country ?? null,
    e164: parsed.number,
    reason: `Validated by libphonenumber-js (country: ${parsed.country ?? 'INTL'}, type: ${parsed.getType() ?? 'standard'}).`,
  };
}
