import {
  ALL_PII_CATEGORIES,
  CategoryPolicies,
  DEFAULT_CATEGORY_POLICIES,
  DetectionEntity,
  PIICategory,
  RedactionMode,
  RedactionSummary,
} from '../types/pii';
import { Pseudonymizer } from './pseudonymizer';

export function formatPartialMask(category: PIICategory, rawValue: string): string {
  const trimmed = rawValue.trim();
  switch (category) {
    case 'PHONE': {
      const digits = trimmed.replace(/\D/g, '');
      const visible = digits.slice(-4);
      return `${'X'.repeat(Math.max(6, digits.length - 4))}${visible}`;
    }
    case 'AADHAAR': {
      const digits = trimmed.replace(/\D/g, '');
      return `XXXX XXXX ${digits.slice(-4)}`;
    }
    case 'CREDIT_CARD': {
      const digits = trimmed.replace(/\D/g, '');
      return `XXXX-XXXX-XXXX-${digits.slice(-4)}`;
    }
    case 'EMAIL': {
      const atIdx = trimmed.indexOf('@');
      if (atIdx <= 0) return '***@***';
      const local = trimmed.slice(0, atIdx);
      const domain = trimmed.slice(atIdx + 1);
      return `${local[0]}***@${domain}`;
    }
    case 'PAN': {
      if (trimmed.length !== 10) return 'XXXXXXXXXX';
      return `XXXXX${trimmed.slice(5, 9)}X`;
    }
    case 'IPV4': {
      const octets = trimmed.split('.');
      if (octets.length !== 4) return 'xxx.xxx.xxx.xxx';
      return `${octets[0]}.xxx.xxx.${octets[3]}`;
    }
    case 'IPV6': {
      const parts = trimmed.split(':');
      if (parts.length <= 2) return 'xxxx:****:xxxx';
      return `${parts[0] || '::'}:****:${parts[parts.length - 1] || '::'}`;
    }
    default:
      return '[REDACTED]';
  }
}

export function resolveEffectivePolicies(
  defaultMode: RedactionMode,
  categoryPolicies: CategoryPolicies = DEFAULT_CATEGORY_POLICIES
): Record<PIICategory, RedactionMode> {
  const result = {} as Record<PIICategory, RedactionMode>;
  for (const cat of ALL_PII_CATEGORIES) {
    const setting = categoryPolicies[cat];
    result[cat] = !setting || setting === 'default' ? defaultMode : setting;
  }
  return result;
}

export function computeReplacementValue(
  entity: DetectionEntity,
  rawSlice: string,
  mode: RedactionMode,
  pseudonymizer: Pseudonymizer
): string {
  switch (mode) {
    case 'full':
      return '[REDACTED]';
    case 'partial':
      return formatPartialMask(entity.category, rawSlice);
    case 'pseudonym':
      return pseudonymizer.getOrCreate(entity.category, rawSlice);
  }
}

export interface RedactionSpanMapping {
  entityId: string;
  category: PIICategory;
  originalStart: number;
  originalEnd: number;
  sanitizedStart: number;
  sanitizedEnd: number;
  replacement: string;
  appliedMode: RedactionMode;
}

export interface RedactionOutputWithSpans extends RedactionSummary {
  spanMappings: RedactionSpanMapping[];
}

/**
 * Applies redaction cleanly:
 * 1. Assigns replacements left-to-right so pseudonym counters match reading order.
 * 2. Applies string replacements right-to-left so original offsets never shift prematurely.
 */
export function redactText(
  text: string,
  entities: DetectionEntity[],
  defaultMode: RedactionMode,
  pseudonymizer: Pseudonymizer,
  categoryPolicies: CategoryPolicies = DEFAULT_CATEGORY_POLICIES
): RedactionOutputWithSpans {
  const appliedPolicies = resolveEffectivePolicies(defaultMode, categoryPolicies);
  const categoryReplacements: Record<PIICategory, number> = {
    EMAIL: 0,
    PHONE: 0,
    IPV4: 0,
    IPV6: 0,
    PAN: 0,
    AADHAAR: 0,
    CREDIT_CARD: 0,
  };

  if (entities.length === 0) {
    return {
      sanitizedText: text,
      appliedCount: 0,
      modeUsed: defaultMode,
      categoryReplacements,
      appliedPolicies,
      mappingCount: pseudonymizer.getTotalMappingCount(),
      spanMappings: [],
    };
  }

  // Ensure strictly ascending order by start offset
  const ordered = [...entities].sort((a, b) => a.start - b.start);

  // Step 1: Left-to-right replacement calculation (ensures EMAIL_01 is first email in doc)
  const planned = ordered.map((entity) => {
    const rawSlice = text.slice(entity.start, entity.end);
    const mode = appliedPolicies[entity.category];
    const replacement = computeReplacementValue(entity, rawSlice, mode, pseudonymizer);
    categoryReplacements[entity.category] += 1;
    return { entity, mode, replacement };
  });

  // Compute sanitized offsets left-to-right for synchronized UI comparison
  let offsetDelta = 0;
  const spanMappings: RedactionSpanMapping[] = planned.map(({ entity, mode, replacement }) => {
    const sanitizedStart = entity.start + offsetDelta;
    const sanitizedEnd = sanitizedStart + replacement.length;
    offsetDelta += replacement.length - (entity.end - entity.start);
    return {
      entityId: entity.id,
      category: entity.category,
      originalStart: entity.start,
      originalEnd: entity.end,
      sanitizedStart,
      sanitizedEnd,
      replacement,
      appliedMode: mode,
    };
  });

  // Step 2: Right-to-left splice so original document offsets remain valid at every edit
  let output = text;
  for (let i = planned.length - 1; i >= 0; i--) {
    const { entity, replacement } = planned[i];
    output = output.slice(0, entity.start) + replacement + output.slice(entity.end);
  }

  return {
    sanitizedText: output,
    appliedCount: planned.length,
    modeUsed: defaultMode,
    categoryReplacements,
    appliedPolicies,
    mappingCount: pseudonymizer.getTotalMappingCount(),
    spanMappings,
  };
}
