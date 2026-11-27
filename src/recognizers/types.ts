import { DetectionEntity, RejectedCandidate } from '../types/pii';

export interface RecognizerOutput {
  accepted: DetectionEntity[];
  rejected: RejectedCandidate[];
}

export interface RecognizerContext {
  createId: (prefix: string) => string;
}
