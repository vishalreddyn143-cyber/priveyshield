import { createMaskedPreview } from '../engine/normalizer';
import { validateEmail } from '../engine/validator';
import { CATEGORY_PRIORITY } from '../types/pii';
import { RecognizerContext, RecognizerOutput } from './types';

const EMAIL_CANDIDATE_REGEX =
  /(?<![A-Za-z0-9._%+-])[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?![A-Za-z0-9-])/g;

export function recognizeEmails(text: string, ctx: RecognizerContext): RecognizerOutput {
  const accepted: RecognizerOutput['accepted'] = [];
  const rejected: RecognizerOutput['rejected'] = [];

  EMAIL_CANDIDATE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = EMAIL_CANDIDATE_REGEX.exec(text)) !== null) {
    let raw = match[0];
    const start = match.index;

    // Trim trailing sentence punctuation if captured accidentally
    raw = raw.replace(/[.,;:!?]+$/, '');
    const end = start + raw.length;
    if (!raw.includes('@')) continue;

    const validation = validateEmail(raw);
    const maskedPreview = createMaskedPreview(raw, 'EMAIL');

    if (!validation.valid) {
      rejected.push({
        id: ctx.createId('rej_email'),
        category: 'EMAIL',
        start,
        end,
        maskedPreview,
        validationMethod: 'RFC-Aligned Email Syntax Validator',
        rejectionReason: validation.reason,
      });
      continue;
    }

    accepted.push({
      id: ctx.createId('ent_email'),
      category: 'EMAIL',
      start,
      end,
      maskedPreview,
      length: raw.length,
      validationMethod: 'RFC-Aligned Local & Domain Structure Check',
      validationStatus: 'valid',
      detectionReason: validation.reason,
      reviewStatus: 'confirmed',
      suggestedAction: 'partial',
      priority: CATEGORY_PRIORITY.EMAIL,
      technicalDetails: {
        domainLabels: raw.split('@')[1].split('.').length,
      },
    });
  }

  return { accepted, rejected };
}
