/**
 * Normalization and safe preview utilities.
 * Ensures raw sensitive values are masked before entering UI summaries or logs.
 */

export function stripSeparators(value: string): string {
  return value.replace(/[\s\-().]/g, '');
}

export function createMaskedPreview(rawValue: string, category: string): string {
  const trimmed = rawValue.trim();
  if (!trimmed) return '[EMPTY]';

  switch (category) {
    case 'EMAIL': {
      const atIdx = trimmed.indexOf('@');
      if (atIdx <= 0) return '***@***';
      const local = trimmed.slice(0, atIdx);
      const domain = trimmed.slice(atIdx + 1);
      const domainParts = domain.split('.');
      const maskedDomain =
        domainParts.length > 1
          ? `${domainParts[0].slice(0, 1)}***${domainParts[0].length > 1 ? '' : ''}.${domainParts.slice(1).join('.')}`
          : '***';
      return `${local[0]}***@${maskedDomain}`;
    }
    case 'PHONE': {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length <= 4) return 'XXXX';
      return `${'X'.repeat(Math.max(4, digits.length - 4))}${digits.slice(-4)}`;
    }
    case 'AADHAAR': {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length < 4) return 'XXXX XXXX XXXX';
      return `XXXX XXXX ${digits.slice(-4)}`;
    }
    case 'CREDIT_CARD': {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length < 4) return 'XXXX-XXXX-XXXX-XXXX';
      return `XXXX-XXXX-XXXX-${digits.slice(-4)}`;
    }
    case 'PAN': {
      if (trimmed.length !== 10) return 'XXXXXXXXXX';
      return `XXXXX${trimmed.slice(5, 9)}X`;
    }
    case 'IPV4': {
      const parts = trimmed.split('.');
      if (parts.length !== 4) return 'xxx.xxx.xxx.xxx';
      return `${parts[0]}.xxx.xxx.${parts[3]}`;
    }
    case 'IPV6': {
      const segments = trimmed.split(':');
      if (segments.length <= 2) return 'xxxx::xxxx';
      return `${segments[0] || '::'}:****:${segments[segments.length - 1] || '::'}`;
    }
    default:
      if (trimmed.length <= 2) return '**';
      return `${trimmed[0]}${'*'.repeat(Math.min(6, trimmed.length - 2))}${trimmed[trimmed.length - 1]}`;
  }
}

export function isWordBoundaryChar(ch: string | undefined): boolean {
  if (!ch) return true;
  return !/[A-Za-z0-9_]/.test(ch);
}

export function isDigitChar(ch: string | undefined): boolean {
  if (!ch) return false;
  return /[0-9]/.test(ch);
}
