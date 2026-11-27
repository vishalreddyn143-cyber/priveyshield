import Papa from 'papaparse';
import { detectPII, emptyCategoryCounts } from '../engine/detector';
import { Pseudonymizer } from '../engine/pseudonymizer';
import { redactText } from '../engine/redactor';
import {
  CategoryPolicies,
  ConflictResolutionRecord,
  DEFAULT_CATEGORY_POLICIES,
  DetectionEntity,
  DetectionResult,
  PIICategory,
  RedactionMode,
  RejectedCandidate,
} from '../types/pii';

export interface CSVCellLocation {
  row: number;
  col: number;
  columnName: string;
}

export interface CSVCellDetection {
  row: number;
  col: number;
  columnName: string;
  entities: DetectionEntity[];
}

export interface ParsedCSVData {
  rows: string[][];
  headers: string[];
  hasHeaderRow: boolean;
  delimiter: string;
  newline: '\r\n' | '\n';
  errors: Papa.ParseError[];
}

export interface SanitizedCSVResult {
  originalRows: string[][];
  sanitizedRows: string[][];
  headers: string[];
  sanitizedCsvString: string;
  detectionResult: DetectionResult;
  cellEntities: Map<string, DetectionEntity[]>;
  cellSanitizedMap: Map<string, string[]>;
  appliedCount: number;
  mappingCount: number;
  appliedPolicies: Record<PIICategory, RedactionMode>;
}

const FORMULA_TRIGGER_REGEX = /^[=+\-@\t\r]/;

export function escapeCSVFormulaCell(value: string): string {
  if (!value) return value;
  if (FORMULA_TRIGGER_REGEX.test(value)) {
    return `'${value}`;
  }
  return value;
}

export function parseCSVContent(csvText: string): ParsedCSVData {
  const newline: '\r\n' | '\n' = csvText.includes('\r\n') ? '\r\n' : '\n';
  const trimmed = csvText.replace(/(?:\r\n|\n)$/, '');
  const parsed = Papa.parse<string[]>(trimmed, {
    header: false,
    skipEmptyLines: false,
  });

  const rows = (parsed.data ?? []).map((row) =>
    Array.isArray(row) ? row.map((cell) => (cell == null ? '' : String(cell))) : [String(row)]
  );
  const headers = rows.length > 0 ? rows[0] : [];

  return {
    rows,
    headers,
    hasHeaderRow: rows.length > 1,
    delimiter: parsed.meta?.delimiter || ',',
    newline,
    errors: parsed.errors ?? [],
  };
}

/**
 * Processes a CSV document cell-by-cell using Papa Parse so headers, quoted strings,
 * embedded commas, and embedded newlines are faithfully preserved.
 * Uses a single shared Pseudonymizer across the document for consistent mapping.
 */
export function processAndSanitizeCSV(
  csvText: string,
  defaultMode: RedactionMode,
  pseudonymizer: Pseudonymizer,
  categoryPolicies: CategoryPolicies = DEFAULT_CATEGORY_POLICIES,
  protectFormulaInjection = true
): SanitizedCSVResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const parsed = parseCSVContent(csvText);
  const { rows, headers, delimiter, newline } = parsed;

  const allEntities: DetectionEntity[] = [];
  const allRejected: RejectedCandidate[] = [];
  const allConflicts: ConflictResolutionRecord[] = [];
  const categoryCounts = emptyCategoryCounts();
  const cellEntities = new Map<string, DetectionEntity[]>();
  const cellSanitizedMap = new Map<string, string[]>();

  let runningOffset = 0;
  let appliedCount = 0;
  let appliedPolicies = {} as Record<PIICategory, RedactionMode>;

  const sanitizedRows: string[][] = rows.map((row, rowIndex) => {
    return row.map((cellValue, colIndex) => {
      const colName = headers[colIndex] || `Column ${colIndex + 1}`;
      const cellKey = `${rowIndex}:${colIndex}`;
      const cellDetection = detectPII(cellValue);

      if (cellDetection.entities.length > 0) {
        const rebasedEntities = cellDetection.entities.map((ent, idx) => ({
          ...ent,
          id: `r${rowIndex}_c${colIndex}_${ent.id}_${idx}`,
          start: ent.start + runningOffset,
          end: ent.end + runningOffset,
          technicalDetails: {
            ...(ent.technicalDetails ?? {}),
            csvRow: rowIndex + 1,
            csvColumn: colName,
          },
        }));

        cellEntities.set(cellKey, cellDetection.entities);
        allEntities.push(...rebasedEntities);
        for (const ent of cellDetection.entities) {
          categoryCounts[ent.category] += 1;
        }
      }

      if (cellDetection.rejectedCandidates.length > 0) {
        allRejected.push(
          ...cellDetection.rejectedCandidates.map((r, idx) => ({
            ...r,
            id: `r${rowIndex}_c${colIndex}_${r.id}_${idx}`,
          }))
        );
      }

      if (cellDetection.conflictsResolved.length > 0) {
        allConflicts.push(...cellDetection.conflictsResolved);
      }

      const redaction = redactText(
        cellValue,
        cellDetection.entities,
        defaultMode,
        pseudonymizer,
        categoryPolicies
      );
      appliedPolicies = redaction.appliedPolicies;
      appliedCount += redaction.appliedCount;

      if (redaction.spanMappings.length > 0) {
        cellSanitizedMap.set(
          cellKey,
          redaction.spanMappings.map((s) => s.replacement)
        );
      }

      runningOffset += cellValue.length + 1;
      return protectFormulaInjection
        ? escapeCSVFormulaCell(redaction.sanitizedText)
        : redaction.sanitizedText;
    });
  });

  const sanitizedCsvString = Papa.unparse(sanitizedRows, {
    delimiter: delimiter || ',',
    newline,
    quotes: false,
  });

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    originalRows: rows,
    sanitizedRows,
    headers,
    sanitizedCsvString,
    detectionResult: {
      entities: allEntities,
      rejectedCandidates: allRejected,
      conflictsResolved: allConflicts,
      categoryCounts,
      processingTimeMs: Math.max(0, Number((endTime - startTime).toFixed(2))),
      totalScannedLength: csvText.length,
    },
    cellEntities,
    cellSanitizedMap,
    appliedCount,
    mappingCount: pseudonymizer.getTotalMappingCount(),
    appliedPolicies,
  };
}
