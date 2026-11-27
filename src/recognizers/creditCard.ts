import { createMaskedPreview } from '../engine/normalizer';
import { validateCreditCard } from '../engine/validator';
import { CATEGORY_PRIORITY } from '../types/pii';
import { RecognizerContext, RecognizerOutput } from './types';

// Matches 13 to 19 digits grouped by spaces or hyphens, bounded away from adjacent digits
const CARD_CANDIDATE_REGEX = /(?<![\d-])(?:\d[\s-]?){12,18}\d(?![\d-])/g;

export function recognizeCreditCards(text: string, ctx: RecognizerContext): RecognizerOutput {
  const accepted: RecognizerOutput['accepted'] = [];
  const rejected: RecognizerOutput['rejected'] = [];

  CARD_CANDIDATE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = CARD_CANDIDATE_REGEX.exec(text)) !== null) {
    const raw = match[0];
    const start = match.index;
    const end = start + raw.length;

    // Avoid matching phone numbers with parentheses or timestamps/dates with slashes
    const prevChar = text[start - 1];
    const nextChar = text[end];
    if (prevChar === '+' || prevChar === '/' || nextChar === '/') {
      continue;
    }

    const digitsOnly = raw.replace(/[\s-]/g, '');
    if (digitsOnly.length < 13 || digitsOnly.length > 19) {
      continue;
    }

    const validation = validateCreditCard(raw);
    const maskedPreview = createMaskedPreview(raw, 'CREDIT_CARD');

    if (!validation.valid) {
      rejected.push({
        id: ctx.createId('rej_card'),
        category: 'CREDIT_CARD',
        start,
        end,
        maskedPreview,
        validationMethod: 'Luhn Mod-10 Checksum & Length Check',
        rejectionReason: validation.reason,
      });
      continue;
    }

    accepted.push({
      id: ctx.createId('ent_card'),
      category: 'CREDIT_CARD',
      start,
      end,
      maskedPreview,
      length: raw.length,
      validationMethod: 'Luhn Mod-10 Checksum + IIN Network Check',
      validationStatus: 'valid',
      detectionReason: validation.reason,
      reviewStatus: 'confirmed',
      suggestedAction: 'full',
      priority: CATEGORY_PRIORITY.CREDIT_CARD,
      technicalDetails: {
        digitLength: validation.digits.length,
        detectedNetwork: validation.network,
        luhnChecksum: 'passed',
      },
    });
  }

  return { accepted, rejected };
}
