import { createMaskedPreview } from '../engine/normalizer';
import { validateIPv4 } from '../engine/validator';
import { CATEGORY_PRIORITY } from '../types/pii';
import { RecognizerContext, RecognizerOutput } from './types';

// Boundary avoids matching version numbers like v1.2.3.4 or embedded decimals
const IPV4_CANDIDATE_REGEX = /(?<![A-Za-z0-9.])\d{1,3}(?:\.\d{1,3}){3}(?![\d.])/g;

export function recognizeIPv4(text: string, ctx: RecognizerContext): RecognizerOutput {
  const accepted: RecognizerOutput['accepted'] = [];
  const rejected: RecognizerOutput['rejected'] = [];

  IPV4_CANDIDATE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = IPV4_CANDIDATE_REGEX.exec(text)) !== null) {
    const raw = match[0];
    const start = match.index;
    const end = start + raw.length;
    const validation = validateIPv4(raw);
    const maskedPreview = createMaskedPreview(raw, 'IPV4');

    if (!validation.valid) {
      rejected.push({
        id: ctx.createId('rej_ipv4'),
        category: 'IPV4',
        start,
        end,
        maskedPreview,
        validationMethod: 'ipaddr.js Strict 4-Part Decimal Parser',
        rejectionReason: validation.reason,
      });
      continue;
    }

    accepted.push({
      id: ctx.createId('ent_ipv4'),
      category: 'IPV4',
      start,
      end,
      maskedPreview,
      length: raw.length,
      validationMethod: 'ipaddr.js IPv4 Parser',
      validationStatus: 'valid',
      detectionReason: validation.reason,
      reviewStatus: 'confirmed',
      suggestedAction: 'pseudonym',
      priority: CATEGORY_PRIORITY.IPV4,
      technicalDetails: {
        ipScope: validation.range,
      },
    });
  }

  return { accepted, rejected };
}
