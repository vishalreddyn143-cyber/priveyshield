export interface ParsedTextDocument {
  content: string;
  lineCount: number;
  charCount: number;
  byteSize: number;
}

export function parsePlainText(content: string): ParsedTextDocument {
  const normalized = content.replace(/\r\n/g, '\n');
  return {
    content: normalized,
    lineCount: normalized ? normalized.split('\n').length : 0,
    charCount: normalized.length,
    byteSize: new TextEncoder().encode(content).length,
  };
}
