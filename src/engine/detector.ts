import { recognizeAadhaar } from '../recognizers/aadhaar';
import { recognizeCreditCards } from '../recognizers/creditCard';
import { recognizeEmails } from '../recognizers/email';
import { recognizeIPv4 } from '../recognizers/ipv4';
import { recognizeIPv6 } from '../recognizers/ipv6';
import { recognizePAN } from '../recognizers/pan';
import { recognizePhones } from '../recognizers/phone';
import {
  ALL_PII_CATEGORIES,
  DetectionEntity,
  DetectionResult,
  PIICategory,
  RejectedCandidate,
  ResidualScanResult,
} from '../types/pii';
import { resolveOverlaps } from './overlapResolver';

export function emptyCategoryCounts(): Record<PIICategory, number> {
  return {
    EMAIL: 0,
    PHONE: 0,
    IPV4: 0,
    IPV6: 0,
    PAN: 0,
    AADHAAR: 0,
    CREDIT_CARD: 0,
  };
}

/**
 * Runs all 7 modular PII recognizers, validates every candidate,
 * and resolves overlapping spans deterministically.
 */
export function detectPII(text: string): DetectionResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  if (!text) {
    return {
      entities: [],
      rejectedCandidates: [],
      conflictsResolved: [],
      categoryCounts: emptyCategoryCounts(),
      processingTimeMs: 0,
      totalScannedLength: 0,
    };
  }

  let seq = 0;
  const ctx = {
    createId: (prefix: string) => {
      seq += 1;
      return `${prefix}_${seq}`;
    },
  };

  const outputs = [
    recognizeCreditCards(text, ctx),
    recognizeAadhaar(text, ctx),
    recognizeIPv6(text, ctx),
    recognizeEmails(text, ctx),
    recognizePAN(text, ctx),
    recognizeIPv4(text, ctx),
    recognizePhones(text, ctx),
  ];

  const allAccepted: DetectionEntity[] = [];
  const allRejected: RejectedCandidate[] = [];

  for (const out of outputs) {
    allAccepted.push(...out.accepted);
    allRejected.push(...out.rejected);
  }

  const { resolved, conflicts } = resolveOverlaps(allAccepted);
  const categoryCounts = emptyCategoryCounts();
  for (const entity of resolved) {
    categoryCounts[entity.category] += 1;
  }

  // Deduplicate rejected candidates by span+category
  const seenRejected = new Set<string>();
  const rejectedCandidates = allRejected.filter((item) => {
    const key = `${item.category}:${item.start}:${item.end}`;
    if (seenRejected.has(key)) return false;
    seenRejected.add(key);
    return true;
  });

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    entities: resolved,
    rejectedCandidates,
    conflictsResolved: conflicts,
    categoryCounts,
    processingTimeMs: Math.max(0, Number((endTime - startTime).toFixed(2))),
    totalScannedLength: text.length,
  };
}

/**
 * Runs the detection engine on sanitized output to verify whether any supported
 * PII patterns remain (e.g., partial masking formats or unredacted manual edits).
 * Note: Partial masking like XXXX-XXXX-XXXX-1234 intentionally leaves last 4 digits;
 * validators naturally reject masked placeholders while flagging any genuinely remaining PII.
 */
export function scanResidualPII(sanitizedText: string): ResidualScanResult {
  const scan = detectPII(sanitizedText);
  const hasResidual = scan.entities.length > 0;

  return {
    status: hasResidual ? 'residual_detected' : 'clean',
    remainingCount: scan.entities.length,
    entities: scan.entities,
    scannedAt: new Date().toISOString(),
    disclaimer:
      'Residual scan checks only the 7 supported structured PII detectors (Email, Phone, IPv4, IPv6, PAN, Aadhaar, Credit Card). A clean scan does not guarantee removal of unstructured names, addresses, or unsupported identifiers.',
  };
}

export function getSupportedCategories(): PIICategory[] {
  return [...ALL_PII_CATEGORIES];
}
