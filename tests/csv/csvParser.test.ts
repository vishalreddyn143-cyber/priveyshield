import { describe, expect, it } from 'vitest';
import { Pseudonymizer } from '../../src/engine/pseudonymizer';
import { parseCSVContent, processAndSanitizeCSV } from '../../src/parsers/csvParser';
import { SYNTHETIC_AADHAAR_1 } from '../../src/utils/sampleData';

describe('CSV Integrity & Papa Parse Sanitization', () => {
  it('preserves headers, quoted values, embedded commas, and embedded newlines', () => {
    const csv = [
      'ID,Email,Notes,Card',
      '1,rahul@example.com,"Quoted, with comma\nand newline",4111-1111-1111-1111',
      `2,rahul@example.com,"Another row with ${SYNTHETIC_AADHAAR_1}",5500-0000-0000-0004`,
    ].join('\n');

    const result = processAndSanitizeCSV(csv, 'pseudonym', new Pseudonymizer());

    expect(result.headers).toEqual(['ID', 'Email', 'Notes', 'Card']);
    expect(result.sanitizedRows).toHaveLength(3);
    // Repeated email across CSV rows maps to same pseudonym EMAIL_01
    expect(result.sanitizedRows[1][1]).toBe('EMAIL_01');
    expect(result.sanitizedRows[2][1]).toBe('EMAIL_01');
    // Embedded comma and newline preserved
    expect(result.sanitizedRows[1][2]).toBe('Quoted, with comma\nand newline');
    expect(result.sanitizedRows[2][2]).toBe('Another row with AADHAAR_01');
    // Re-parsing exported sanitizedCsvString produces identical rows
    const reparsed = parseCSVContent(result.sanitizedCsvString);
    expect(reparsed.rows).toEqual(result.sanitizedRows);
  });

  it('neutralizes CSV formula injection prefixes safely', () => {
    const csv = 'Col\n=CMD("calc")';
    const result = processAndSanitizeCSV(csv, 'full', new Pseudonymizer());
    expect(result.sanitizedRows[1][0]).toBe("'=CMD(\"calc\")");
  });
});
