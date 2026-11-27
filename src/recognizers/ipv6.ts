import { createMaskedPreview } from '../engine/normalizer';
import { validateIPv6 } from '../engine/validator';
import { CATEGORY_PRIORITY } from '../types/pii';
import { RecognizerContext, RecognizerOutput } from './types';

// Broad candidate matcher for compressed & expanded IPv6 (including ::1 and IPv4-mapped forms)
const IPV6_CANDIDATE_REGEX =
  /(?<![A-Za-z0-9:])(?:(?:[0-9A-Fa-f]{1,4}:){2,7}[0-9A-Fa-f]{0,4}|:(?::[0-9A-Fa-f]{1,4}){1,7}|(?:[0-9A-Fa-f]{1,4}:){1,6}:[0-9A-Fa-f]{1,4}|::1|::)(?:\.\d{1,3}){0,3}(?![A-Za-z0-9:])/g;

export function recognizeIPv6(text: string, ctx: RecognizerContext): RecognizerOutput {
  const accepted: RecognizerOutput['accepted'] = [];
  const rejected: RecognizerOutput['rejected'] = [];

  IPV6_CANDIDATE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = IPV6_CANDIDATE_REGEX.exec(text)) !== null) {
    const raw = match[0];
    const start = match.index;
    const end = start + raw.length;

    // Ignore trivial bare "::" unless surrounded by delimiters in an IP context, or timestamps like 12:34:56
    if (raw === '::') continue;
    // Skip pure decimal HH:MM:SS timestamps (3 colon-separated 2-digit groups without hex letters or ::)
    if (!raw.includes('::') && /^\d{1,2}:\d{2}:\d{2}$/.test(raw)) {
      continue;
    }

    const validation = validateIPv6(raw);
    const maskedPreview = createMaskedPreview(raw, 'IPV6');

    if (!validation.valid) {
      // Only log plausible multi-colon IPv6 attempts as rejected
      if (raw.split(':').length >= 3) {
        rejected.push({
          id: ctx.createId('rej_ipv6'),
          category: 'IPV6',
          start,
          end,
          maskedPreview,
          validationMethod: 'ipaddr.js IPv6 Parser',
          rejectionReason: validation.reason,
        });
      }
      continue;
    }

    accepted.push({
      id: ctx.createId('ent_ipv6'),
      category: 'IPV6',
      start,
      end,
      maskedPreview,
      length: raw.length,
      validationMethod: 'ipaddr.js IPv6 Parser (Compressed & Expanded)',
      validationStatus: 'valid',
      detectionReason: validation.reason,
      reviewStatus: 'confirmed',
      suggestedAction: 'full',
      priority: CATEGORY_PRIORITY.IPV6,
      technicalDetails: {
        ipScope: validation.range,
        compressed: raw.includes('::'),
      },
    });
  }

  return { accepted, rejected };
}
