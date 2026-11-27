import { ConflictResolutionRecord, DetectionEntity } from '../types/pii';

export interface OverlapResolutionOutput {
  resolved: DetectionEntity[];
  conflicts: ConflictResolutionRecord[];
}

/**
 * Resolves overlapping and duplicate entity spans deterministically.
 * Priority rules ensure composite/checksummed identifiers (Credit Card, Aadhaar, Email, IPv6)
 * are never fragmented into shorter lower-priority matches (such as Phone numbers).
 */
export function resolveOverlaps(candidates: DetectionEntity[]): OverlapResolutionOutput {
  if (candidates.length === 0) {
    return { resolved: [], conflicts: [] };
  }

  const ranked = [...candidates].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    const lenDiff = b.end - b.start - (a.end - a.start);
    if (lenDiff !== 0) return lenDiff;
    return a.start - b.start;
  });

  const accepted: DetectionEntity[] = [];
  const conflicts: ConflictResolutionRecord[] = [];
  let conflictSeq = 0;

  for (const candidate of ranked) {
    const overlapping = accepted.find(
      (existing) => candidate.start < existing.end && existing.start < candidate.end
    );

    if (!overlapping) {
      accepted.push(candidate);
      continue;
    }

    conflictSeq += 1;
    const isExactDuplicate =
      overlapping.start === candidate.start && overlapping.end === candidate.end;

    conflicts.push({
      id: `conflict_${conflictSeq}`,
      keptCategory: overlapping.category,
      discardedCategory: candidate.category,
      keptSpan: [overlapping.start, overlapping.end],
      discardedSpan: [candidate.start, candidate.end],
      reason: isExactDuplicate
        ? `Deduplicated exact span [${candidate.start}, ${candidate.end}] in favor of higher-priority ${overlapping.category}.`
        : `Discarded overlapping ${candidate.category} span [${candidate.start}, ${candidate.end}] contained within or intersecting higher-priority ${overlapping.category} span [${overlapping.start}, ${overlapping.end}].`,
    });
  }

  // Sort strictly by original document offset ascending for deterministic display & left-to-right numbering
  accepted.sort((a, b) => a.start - b.start || a.end - b.end);

  return { resolved: accepted, conflicts };
}
