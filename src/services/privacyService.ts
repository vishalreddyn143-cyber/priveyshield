import { detectPII } from '../engine/detector';
import { Pseudonymizer } from '../engine/pseudonymizer';
import { redactText } from '../engine/redactor';
import { SYNTHETIC_TEXT_SAMPLE } from '../utils/sampleData';

export interface NetworkPrivacyTestResult {
  passed: boolean;
  requestsDuringProcessing: number;
  observedUrls: string[];
  durationMs: number;
  details: string;
}

/**
 * Executes an instrumented local detection + sanitization pass and inspects
 * browser PerformanceResourceTiming entries (plus fetch/XHR observation)
 * to verify zero network requests occur during document processing.
 */
export async function runNetworkPrivacyTest(): Promise<NetworkPrivacyTestResult> {
  const hasPerformance =
    typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function';

  const beforeCount = hasPerformance ? performance.getEntriesByType('resource').length : 0;
  const start = hasPerformance ? performance.now() : Date.now();

  const observedFetchCalls: string[] = [];
  const originalFetch = typeof window !== 'undefined' ? window.fetch : undefined;

  if (typeof window !== 'undefined' && originalFetch) {
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      observedFetchCalls.push(url);
      return originalFetch.call(window, input, init);
    }) as typeof window.fetch;
  }

  try {
    // Run actual detection + redaction on synthetic payload
    const detection = detectPII(SYNTHETIC_TEXT_SAMPLE);
    const pseudo = new Pseudonymizer();
    redactText(SYNTHETIC_TEXT_SAMPLE, detection.entities, 'pseudonym', pseudo);
    // Allow microtasks to flush
    await new Promise((resolve) => setTimeout(resolve, 30));
  } finally {
    if (typeof window !== 'undefined' && originalFetch) {
      window.fetch = originalFetch;
    }
  }

  const end = hasPerformance ? performance.now() : Date.now();
  const afterEntries = hasPerformance
    ? (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
    : [];
  const newResources = afterEntries.slice(beforeCount).map((e) => e.name);
  const allObserved = [...observedFetchCalls, ...newResources];

  const passed = allObserved.length === 0;
  return {
    passed,
    requestsDuringProcessing: allObserved.length,
    observedUrls: allObserved,
    durationMs: Math.max(0, Number((end - start).toFixed(2))),
    details: passed
      ? 'Verified 0 fetch/XHR/resource network requests fired during local PII detection and sanitization.'
      : `Detected ${allObserved.length} unexpected network request(s) during processing.`,
  };
}

export async function checkOfflineCacheStatus(): Promise<{
  available: boolean;
  details: string;
}> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return {
      available: false,
      details: 'Service Worker API is not supported in this browser environment.',
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const hasCacheApi = 'caches' in window;
    if (registration?.active && hasCacheApi) {
      const cacheNames = await caches.keys();
      const hasAppCache = cacheNames.some((name) => name.startsWith('privyshield-'));
      if (hasAppCache) {
        return {
          available: true,
          details: `Service Worker active and application shell cached (${cacheNames.join(', ')}). Original documents are never cached.`,
        };
      }
      return {
        available: true,
        details: 'Service Worker active; static asset cache initializes after initial asset fetch.',
      };
    }
    return {
      available: false,
      details:
        'Service Worker registered or awaiting activation (note: in dev mode or first load, reload once after build to activate offline cache).',
    };
  } catch {
    return {
      available: false,
      details: 'Could not inspect Service Worker cache state.',
    };
  }
}
