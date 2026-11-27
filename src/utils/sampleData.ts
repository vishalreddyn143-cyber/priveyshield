import { computeVerhoeffCheckDigit } from '../engine/validator';

/**
 * Generates deterministic, strictly synthetic Aadhaar candidates with valid Verhoeff checksums.
 */
function buildSyntheticAadhaar(first11: string): string {
  const check = computeVerhoeffCheckDigit(first11);
  const full = `${first11}${check}`;
  return `${full.slice(0, 4)} ${full.slice(4, 8)} ${full.slice(8, 12)}`;
}

export const SYNTHETIC_AADHAAR_1 = buildSyntheticAadhaar('23456789012');
export const SYNTHETIC_AADHAAR_2 = buildSyntheticAadhaar('84129034567');

// Invalid Verhoeff checksum intentionally modified at last digit for false-positive testing
export const SYNTHETIC_INVALID_AADHAAR = (() => {
  const validLast = Number(SYNTHETIC_AADHAAR_1.slice(-1));
  const wrongLast = (validLast + 1) % 10;
  return `${SYNTHETIC_AADHAAR_1.slice(0, -1)}${wrongLast}`;
})();

export const SYNTHETIC_TEXT_SAMPLE = `[SYNTHETIC TEST RECORD — NOT REAL PERSONAL DATA]
Incident Escalation Summary (Ref: INC-2026-8841)
Primary Contact: Rahul Verma | Email: rahul.verma@example-corp.in | Mobile: +91 98765 43210
Secondary Reviewer: Priya Nair | Email: priya.nair@example-corp.in | Alt Phone: +1 415 555 0198
Follow-up CC: rahul.verma@example-corp.in (same user to verify consistent pseudonymization)

KYC & Billing Verification (Synthetic):
- Indian PAN (Individual): ABCPK1234M
- Synthetic Aadhaar (Verhoeff Valid): ${SYNTHETIC_AADHAAR_1}
- Test Visa Card (Luhn Valid): 4111-1111-1111-1111
- Invalid Card Candidate (Luhn Fail - should be rejected): 4111-1111-1111-1112
- Invalid Aadhaar Candidate (Verhoeff Fail - should be rejected): ${SYNTHETIC_INVALID_AADHAAR}

Network Telemetry:
- Client IPv4 Node: 192.168.10.45
- Invalid IPv4 Candidate (should be rejected): 999.168.10.45
- Edge IPv6 Gateway: 2001:0db8:85a3:0000:0000:8a2e:0370:7334
- Loopback IPv6: ::1`;

export const SYNTHETIC_CSV_SAMPLE = `Customer_ID,Full_Name,Contact_Email,Mobile_Number,KYC_PAN,Aadhaar_ID,Test_Card,Source_IP,Notes
CUST-101,Rahul Verma,rahul.verma@example-corp.in,+91 98765 43210,ABCPK1234M,${SYNTHETIC_AADHAAR_1},4111-1111-1111-1111,192.168.10.45,"Primary account, repeated email below"
CUST-102,Priya Nair,priya.nair@example-corp.in,+1 415 555 0198,BGLPC9081K,${SYNTHETIC_AADHAAR_2},5500-0000-0000-0004,2001:db8::1,"Quoted note with comma, and secondary IPv6"
CUST-103,Rahul Verma (Duplicate),rahul.verma@example-corp.in,9876543210,ABCPK1234M,${SYNTHETIC_INVALID_AADHAAR},4111-1111-1111-1112,999.44.12.1,"Contains invalid Luhn/Verhoeff/IPv4 for false-positive filtering"`;

export interface BenchmarkTestCase {
  id: string;
  label: string;
  text: string;
  expected: Array<{ category: string; snippet: string }>;
  notes: string;
}

export const LAB_BENCHMARK_CASES: BenchmarkTestCase[] = [
  {
    id: 'bench_1',
    label: 'Valid Synthetic Visa + Email + Indian Mobile',
    text: 'User rahul@example.org paid via 4111-1111-1111-1111, call +91 98765 43210.',
    expected: [
      { category: 'EMAIL', snippet: 'rahul@example.org' },
      { category: 'CREDIT_CARD', snippet: '4111-1111-1111-1111' },
      { category: 'PHONE', snippet: '+91 98765 43210' },
    ],
    notes: 'Tests multi-category extraction without credit card digits leaking into phone detector.',
  },
  {
    id: 'bench_2',
    label: 'Aadhaar vs Phone Overlap Guard',
    text: `Synthetic Aadhaar ${SYNTHETIC_AADHAAR_1} should match Aadhaar only, not Phone.`,
    expected: [{ category: 'AADHAAR', snippet: SYNTHETIC_AADHAAR_1 }],
    notes: 'Verifies Priority 4 overlap resolution prevents 10-digit phone slice inside 12-digit Aadhaar.',
  },
  {
    id: 'bench_3',
    label: 'Invalid Checksum Rejection (Luhn & Verhoeff)',
    text: `Reject card 4111-1111-1111-1112 and Aadhaar ${SYNTHETIC_INVALID_AADHAAR} and IP 300.12.1.5.`,
    expected: [],
    notes: 'Tests Priority 2 false-positive prevention; all three malformed candidates must be rejected.',
  },
  {
    id: 'bench_4',
    label: 'Indian PAN & IPv6 Compressed/Expanded',
    text: 'PAN ABCPK1234M logged from 2001:db8::1 and 2001:0db8:85a3:0000:0000:8a2e:0370:7334.',
    expected: [
      { category: 'PAN', snippet: 'ABCPK1234M' },
      { category: 'IPV6', snippet: '2001:db8::1' },
      { category: 'IPV6', snippet: '2001:0db8:85a3:0000:0000:8a2e:0370:7334' },
    ],
    notes: 'Validates PAN entity code and ipaddr.js IPv6 compressed + expanded forms.',
  },
  {
    id: 'bench_5',
    label: 'Version Number & Timestamp Non-PII',
    text: 'Release v1.2.3.4 deployed at 12:34:56 UTC on order #99887766.',
    expected: [],
    notes: 'Ensures version strings and timestamps do not trigger IPv4, IPv6, or Phone false positives.',
  },
];
