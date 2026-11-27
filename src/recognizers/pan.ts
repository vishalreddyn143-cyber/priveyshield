import { createMaskedPreview } from '../engine/normalizer';
import { validatePAN } from '../engine/validator';
import { CATEGORY_PRIORITY } from '../types/pii';
import { RecognizerContext, RecognizerOutput } from './types';

const PAN_CANDIDATE_REGEX = /(?<![A-Za-z0-9])[A-Z]{5}[0-9]{4}[A-Z](?![A-Za-z0-9])/g;

export function recognizePAN(text: string, ctx: RecognizerContext): RecognizerOutput {
  const accepted: RecognizerOutput['accepted'] = [];
  const rejected: RecognizerOutput['rejected'] = [];

  PAN_CANDIDATE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = PAN_CANDIDATE_REGEX.exec(text)) !== null) {
    const raw = match[0];
    const start = match.index;
    const end = start + raw.length;
    const validation = validatePAN(raw);
    const maskedPreview = createMaskedPreview(raw, 'PAN');

    if (!validation.valid) {
      rejected.push({
        id: ctx.createId('rej_pan'),
        category: 'PAN',
        start,
        end,
        maskedPreview,
        validationMethod: 'Indian PAN Structure (AAAAA9999A)',
        rejectionReason: validation.reason,
      });
      continue;
    }

    accepted.push({
      id: ctx.createId('ent_pan'),
      category: 'PAN',
      start,
      end,
      maskedPreview,
      length: raw.length,
      validationMethod: 'PAN Format + 4th Character Entity Code Check',
      validationStatus: validation.reviewRequired ? 'review_required' : 'valid',
      detectionReason: validation.reason,
      reviewStatus: validation.reviewRequired ? 'review_required' : 'confirmed',
      suggestedAction: 'full',
      priority: CATEGORY_PRIORITY.PAN,
      technicalDetails: {
        entityType: validation.entityType,
        formatPattern: 'AAAAA9999A',
      },
    });
  }

  return { accepted, rejected };
}
