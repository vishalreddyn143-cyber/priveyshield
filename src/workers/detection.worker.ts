import { detectPII, scanResidualPII } from '../engine/detector';
import { Pseudonymizer } from '../engine/pseudonymizer';
import { redactText } from '../engine/redactor';
import { processAndSanitizeCSV } from '../parsers/csvParser';
import {
  CategoryPolicies,
  DetectionResult,
  RedactionMode,
  ResidualScanResult,
} from '../types/pii';

export interface WorkerProcessTextRequest {
  type: 'PROCESS_TEXT';
  requestId: string;
  text: string;
  defaultMode: RedactionMode;
  categoryPolicies: CategoryPolicies;
}

export interface WorkerProcessCSVRequest {
  type: 'PROCESS_CSV';
  requestId: string;
  csvText: string;
  defaultMode: RedactionMode;
  categoryPolicies: CategoryPolicies;
}

export type WorkerRequest = WorkerProcessTextRequest | WorkerProcessCSVRequest;

export interface WorkerProcessResponse {
  type: 'RESULT' | 'PROGRESS' | 'ERROR';
  requestId: string;
  progress?: number;
  stage?: string;
  detectionResult?: DetectionResult;
  sanitizedText?: string;
  appliedCount?: number;
  mappingCount?: number;
  residualScan?: ResidualScanResult;
  sanitizedRows?: string[][];
  originalRows?: string[][];
  headers?: string[];
  error?: string;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  try {
    if (msg.type === 'PROCESS_TEXT') {
      self.postMessage({
        type: 'PROGRESS',
        requestId: msg.requestId,
        progress: 25,
        stage: 'Running modular PII recognizers & validators...',
      });
      const detectionResult = detectPII(msg.text);

      self.postMessage({
        type: 'PROGRESS',
        requestId: msg.requestId,
        progress: 65,
        stage: 'Applying redaction & pseudonymization policies...',
      });
      const pseudo = new Pseudonymizer();
      const redaction = redactText(
        msg.text,
        detectionResult.entities,
        msg.defaultMode,
        pseudo,
        msg.categoryPolicies
      );

      self.postMessage({
        type: 'PROGRESS',
        requestId: msg.requestId,
        progress: 90,
        stage: 'Running residual PII verification scan...',
      });
      const residualScan = scanResidualPII(redaction.sanitizedText);

      self.postMessage({
        type: 'RESULT',
        requestId: msg.requestId,
        progress: 100,
        detectionResult,
        sanitizedText: redaction.sanitizedText,
        appliedCount: redaction.appliedCount,
        mappingCount: redaction.mappingCount,
        residualScan,
      } satisfies WorkerProcessResponse);
    } else if (msg.type === 'PROCESS_CSV') {
      self.postMessage({
        type: 'PROGRESS',
        requestId: msg.requestId,
        progress: 30,
        stage: 'Parsing CSV structure with Papa Parse...',
      });
      const pseudo = new Pseudonymizer();
      const csvResult = processAndSanitizeCSV(
        msg.csvText,
        msg.defaultMode,
        pseudo,
        msg.categoryPolicies
      );

      self.postMessage({
        type: 'PROGRESS',
        requestId: msg.requestId,
        progress: 85,
        stage: 'Scanning sanitized CSV cells for residual PII...',
      });
      const residualScan = scanResidualPII(csvResult.sanitizedCsvString);

      self.postMessage({
        type: 'RESULT',
        requestId: msg.requestId,
        progress: 100,
        detectionResult: csvResult.detectionResult,
        sanitizedText: csvResult.sanitizedCsvString,
        appliedCount: csvResult.appliedCount,
        mappingCount: csvResult.mappingCount,
        residualScan,
        sanitizedRows: csvResult.sanitizedRows,
        originalRows: csvResult.originalRows,
        headers: csvResult.headers,
      } satisfies WorkerProcessResponse);
    }
  } catch (err) {
    self.postMessage({
      type: 'ERROR',
      requestId: msg.requestId,
      error: err instanceof Error ? err.message : 'Worker processing failed.',
    } satisfies WorkerProcessResponse);
  }
};
