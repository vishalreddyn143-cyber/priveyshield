import { PIICategory } from '../types/pii';

const CATEGORY_PREFIX: Record<PIICategory, string> = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  IPV4: 'IPV4',
  IPV6: 'IPV6',
  PAN: 'PAN',
  AADHAAR: 'AADHAAR',
  CREDIT_CARD: 'CARD',
};

/**
 * Stateful in-memory pseudonymization engine using nested JavaScript Maps.
 * Ensures the same original value maps to the same placeholder within a category namespace,
 * while never exposing original-to-placeholder mappings in logs or exported reports.
 */
export class Pseudonymizer {
  private categoryMaps = new Map<PIICategory, Map<string, string>>();
  private counters = new Map<PIICategory, number>();

  public getOrCreate(category: PIICategory, rawValue: string): string {
    const normalizedKey = this.normalizeKey(category, rawValue);
    let valueMap = this.categoryMaps.get(category);
    if (!valueMap) {
      valueMap = new Map<string, string>();
      this.categoryMaps.set(category, valueMap);
    }

    const existing = valueMap.get(normalizedKey);
    if (existing) {
      return existing;
    }

    const nextCount = (this.counters.get(category) ?? 0) + 1;
    this.counters.set(category, nextCount);
    const placeholder = `${CATEGORY_PREFIX[category]}_${String(nextCount).padStart(2, '0')}`;
    valueMap.set(normalizedKey, placeholder);
    return placeholder;
  }

  public reset(): void {
    this.categoryMaps.clear();
    this.counters.clear();
  }

  public getTotalMappingCount(): number {
    let total = 0;
    for (const map of this.categoryMaps.values()) {
      total += map.size;
    }
    return total;
  }

  public getCategoryMappingCounts(): Partial<Record<PIICategory, number>> {
    const counts: Partial<Record<PIICategory, number>> = {};
    for (const [cat, map] of this.categoryMaps.entries()) {
      if (map.size > 0) {
        counts[cat] = map.size;
      }
    }
    return counts;
  }

  private normalizeKey(category: PIICategory, rawValue: string): string {
    const trimmed = rawValue.trim();
    if (category === 'EMAIL') {
      return trimmed.toLowerCase();
    }
    if (category === 'AADHAAR' || category === 'CREDIT_CARD') {
      return trimmed.replace(/[\s-]/g, '');
    }
    if (category === 'PAN') {
      return trimmed.toUpperCase();
    }
    return trimmed;
  }
}
