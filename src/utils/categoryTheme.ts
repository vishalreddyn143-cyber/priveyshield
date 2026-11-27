import {
  CreditCard,
  Fingerprint,
  Globe,
  IdCard,
  Mail,
  Network,
  Phone,
  type LucideIcon,
} from 'lucide-react';
import { PIICategory } from '../types/pii';

export interface CategoryVisualConfig {
  label: string;
  shortTag: string;
  icon: LucideIcon;
  badgeClasses: string;
  highlightClasses: string;
  barColor: string;
  description: string;
}

export const CATEGORY_THEME: Record<PIICategory, CategoryVisualConfig> = {
  EMAIL: {
    label: 'Email Address',
    shortTag: 'EML',
    icon: Mail,
    badgeClasses: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40',
    highlightClasses: 'bg-cyan-500/20 text-cyan-100 border-b-2 border-cyan-400',
    barColor: '#06b6d4',
    description: 'Validated via RFC-aligned local & DNS structure rules.',
  },
  PHONE: {
    label: 'Phone Number',
    shortTag: 'PHN',
    icon: Phone,
    badgeClasses: 'bg-blue-500/15 text-blue-300 border-blue-400/40',
    highlightClasses: 'bg-blue-500/20 text-blue-100 border-b-2 border-blue-400',
    barColor: '#3b82f6',
    description: 'Validated via libphonenumber-js for Indian & international formats.',
  },
  IPV4: {
    label: 'IPv4 Address',
    shortTag: 'IP4',
    icon: Globe,
    badgeClasses: 'bg-teal-500/15 text-teal-300 border-teal-400/40',
    highlightClasses: 'bg-teal-500/20 text-teal-100 border-b-2 border-teal-400',
    barColor: '#14b8a6',
    description: 'Validated via ipaddr.js strict 4-part decimal parser.',
  },
  IPV6: {
    label: 'IPv6 Address',
    shortTag: 'IP6',
    icon: Network,
    badgeClasses: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/40',
    highlightClasses: 'bg-indigo-500/20 text-indigo-100 border-b-2 border-indigo-400',
    barColor: '#6366f1',
    description: 'Validated via ipaddr.js for compressed & expanded forms.',
  },
  PAN: {
    label: 'Indian PAN',
    shortTag: 'PAN',
    icon: IdCard,
    badgeClasses: 'bg-amber-500/15 text-amber-300 border-amber-400/40',
    highlightClasses: 'bg-amber-500/20 text-amber-100 border-b-2 border-amber-400',
    barColor: '#f59e0b',
    description: 'Validated via AAAAA9999A syntax & 4th-character entity code.',
  },
  AADHAAR: {
    label: 'Aadhaar Number',
    shortTag: 'ADH',
    icon: Fingerprint,
    badgeClasses: 'bg-purple-500/15 text-purple-300 border-purple-400/40',
    highlightClasses: 'bg-purple-500/20 text-purple-100 border-b-2 border-purple-400',
    barColor: '#8b5cf6',
    description: 'Validated via 12-digit UIDAI bounds & Verhoeff checksum.',
  },
  CREDIT_CARD: {
    label: 'Credit Card',
    shortTag: 'CRD',
    icon: CreditCard,
    badgeClasses: 'bg-rose-500/15 text-rose-300 border-rose-400/40',
    highlightClasses: 'bg-rose-500/20 text-rose-100 border-b-2 border-rose-400',
    barColor: '#f43f5e',
    description: 'Validated via 13–19 digit IIN rules & Luhn mod-10 checksum.',
  },
};

export const GLOSSARY_TERMS: Record<string, string> = {
  PII: 'Personally Identifiable Information — data that can identify an individual directly or when combined with other records.',
  Luhn: 'Mod-10 checksum algorithm used by payment networks to catch accidental digit errors or non-card numbers.',
  Verhoeff: 'Dihedral-group checksum algorithm used by UIDAI on 12-digit Aadhaar numbers; verifies math structure, not real issuance.',
  Pseudonymization:
    'Replaces sensitive values with consistent placeholders (e.g. EMAIL_01) using an in-memory map. Reversible while the map exists, not irreversible anonymization.',
  ResidualScan:
    'Re-runs the 7 supported PII detectors on the sanitized document to verify no supported patterns remain.',
};
