import { createMaskedPreview } from '../engine/normalizer';
import { validateAadhaar } from '../engine/validator';
import { CATEGORY_PRIORITY } from '../types/pii';
import { RecognizerContext, RecognizerOutput } from './types';

// Matches 12 digits in 4-4-4 space/hyphen format or continuous 12 digits
const AADHAAR_CANDIDATE_REGEX = /(?<![\d-])\d{4}[\s-]?\d{4}[\s-]?\d{4}(?![\d-])/g;

export function recognizeAadhaar(text: string, ctx: RecognizerContext): RecognizerOutput {
  const accepted: RecognizerOutput['accepted'] = [];
  const rejected: RecognizerOutput['rejected'] = [];

  AADHAAR_CANDIDATE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = AADHAAR_CANDIDATE_REGEX.exec(text)) !== null) {
    const raw = match[0];
    const start = match.index;
    const end = start + raw.length;
    const prevChar = text[start - 1];
    const nextChar = text[end];

    // Skip if prefixed with '+' (international phone like +919876543210) or embedded in a decimal number
    if (prevChar === '+' || prevChar === '.' || (nextChar === '.' && text[end + 1] && /\d/.test(text[end + 1]))) {
      continue;
    }

    const validation = validateAadhaar(raw);
    const maskedPreview = createMaskedPreview(raw, 'AADHAAR');

    if (!validation.valid) {
      rejected.push({
        id: ctx.createId('rej_aadhaar'),
        category: 'AADHAAR',
        start,
        end,
        maskedPreview,
        validationMethod: '12-Digit UIDAI Structure & Verhoeff Checksum',
        rejectionReason: validation.reason,
      });
      continue;
    }

    accepted.push({
      id: ctx.createId('ent_aadhaar'),
      category: 'AADHAAR',
      start,
      end,
      maskedPreview,
      length: raw.length,
      validationMethod: '12-Digit Structure + Verhoeff Checksum',
      validationStatus: 'valid',
      detectionReason: validation.reason,
      reviewStatus: 'confirmed',
      suggestedAction: 'full',
      priority: CATEGORY_PRIORITY.AADHAAR,
      technicalDetails: {
        digitLength: 12,
        leadingDigit: Number(validation.digits[0]),
        verhoeffChecksum: 'passed',
      },
    });
  }

  return { accepted, rejected };
}
