import { AuditLogEntry } from '../types/pii';

let logCounter = 0;

/**
 * Creates a sanitized audit log entry.
 * Strictly prohibits storing raw document text, unmasked PII, or pseudonym mappings.
 */
export function createAuditEntry(
  eventType: AuditLogEntry['eventType'],
  summary: string,
  metadata?: AuditLogEntry['metadata']
): AuditLogEntry {
  logCounter += 1;
  return {
    id: `audit_${Date.now()}_${logCounter}`,
    timestamp: new Date().toISOString(),
    eventType,
    summary,
    metadata,
  };
}
