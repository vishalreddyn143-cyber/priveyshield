import { createMaskedPreview } from '../engine/normalizer';
import { validatePhone } from '../engine/validator';
import { CATEGORY_PRIORITY } from '../types/pii';
import { RecognizerContext, RecognizerOutput } from './types';

/**
 * Matches international E.164-like numbers (+1..., +91..., +44...) and domestic formatted phone candidates.
 * Boundary checks prevent slicing numbers from inside Aadhaar or Credit Card digit blocks.
 */
const PHONE_CANDIDATE_REGEX =
  /(?<![A-Za-z0-9._-])(?:\+\d{1,3}[\s.-]?(?:\(\d{1,4}\)[\s.-]?)?[\d\s.-]{6,14}\d|\(\d{3}\)[\s.-]?\d{3}[\s.-]?\d{4}|(?:0|\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|(?:\d{3}[\s.-]\d{3}[\s.-]\d{4}))(?![\d-])/g;

export function recognizePhones(text: string, ctx: RecognizerContext): RecognizerOutput {
  const accepted: RecognizerOutput['accepted'] = [];
  const rejected: RecognizerOutput['rejected'] = [];

  PHONE_CANDIDATE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = PHONE_CANDIDATE_REGEX.exec(text)) !== null) {
    const raw = match[0].trim();
    const leadingSpaces = match[0].length - match[0].trimStart().length;
    const start = match.index + leadingSpaces;
    const end = start + raw.length;

    // Avoid matching parts of hyphenated card/serial sequences or dates
    const prevChar = text[start - 1];
    const nextChar = text[end];
    if (prevChar === '-' || prevChar === '/' || nextChar === '/') {
      continue;
    }

    // Try Indian default first for local 10-digit mobile, then US for (NNN) NNN-NNNN / NNN-NNN-NNNN
    let validation = validatePhone(raw, 'IN');
    if (!validation.valid && !raw.startsWith('+')) {
      const usTry = validatePhone(raw, 'US');
      if (usTry.valid) {
        validation = usTry;
      }
    }

    const maskedPreview = createMaskedPreview(raw, 'PHONE');

    if (!validation.valid) {
      rejected.push({
        id: ctx.createId('rej_phone'),
        category: 'PHONE',
        start,
        end,
        maskedPreview,
        validationMethod: 'libphonenumber-js National Plan Validator',
        rejectionReason: validation.reason,
      });
      continue;
    }

    accepted.push({
      id: ctx.createId('ent_phone'),
      category: 'PHONE',
      start,
      end,
      maskedPreview,
      length: raw.length,
      validationMethod: 'libphonenumber-js (Indian & International)',
      validationStatus: 'valid',
      detectionReason: validation.reason,
      reviewStatus: 'confirmed',
      suggestedAction: 'partial',
      priority: CATEGORY_PRIORITY.PHONE,
      technicalDetails: {
        country: validation.country ?? 'INTL',
        digitCount: raw.replace(/\D/g, '').length,
      },
    });
  }

  return { accepted, rejected };
}
