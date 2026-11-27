import { expect, test } from '@playwright/test';

test('complete PrivyShield workflow, network privacy, 3D disabled fallback, CSV export, and offline capability', async ({
  page,
  context,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const networkRequestsDuringSanitize: string[] = [];
  let trackingSanitizeNetwork = false;

  page.on('request', (req) => {
    if (trackingSanitizeNetwork) {
      networkRequestsDuringSanitize.push(req.url());
    }
  });

  await page.goto('/');

  // 1. Overview & Tagline
  await expect(page.getByRole('heading', { name: 'PRIVYSHIELD' })).toBeVisible();
  await expect(
    page.getByText('Detect. Understand. Sanitize. Verify. Your data stays yours.')
  ).toBeVisible();

  // 2. Try Demo with Synthetic Data -> opens Sanitize Workspace
  trackingSanitizeNetwork = true;
  await page.getByRole('button', { name: /Try Demo with Synthetic Data/i }).click();
  await expect(page.getByText('1. Original Document')).toBeVisible();
  await expect(page.getByTestId('sanitized-preview')).toContainText('EMAIL_01');

  // Verify zero network requests occurred during sanitization
  expect(networkRequestsDuringSanitize).toEqual([]);
  trackingSanitizeNetwork = false;

  // 3. Switch redaction modes
  await page.getByRole('button', { name: /Full Masking/i }).click();
  await expect(page.getByTestId('sanitized-preview')).toContainText('[REDACTED]');

  await page.getByRole('button', { name: /Partial Masking/i }).click();
  await expect(page.getByTestId('sanitized-preview')).toContainText('r***@example-corp.in');

  await page.getByRole('button', { name: /Pseudonymization/i }).click();
  await expect(page.getByTestId('sanitized-preview')).toContainText('EMAIL_01');

  // 4. Disable 3D effects & verify Detection Lab benchmark
  await page.getByLabel('Visual effects mode').selectOption('disabled');
  await page.getByRole('button', { name: /Detection Lab/i }).click();
  await page.getByRole('button', { name: /Run Labelled Benchmark/i }).click();
  await expect(page.getByText('100.0%').first()).toBeVisible();

  // 5. Privacy Center live network test & Category Policy override
  await page.getByRole('button', { name: /Privacy Center/i }).click();
  await page.getByRole('button', { name: /Run Network Privacy Test/i }).click();
  await expect(page.getByText(/Verified 0 fetch\/XHR\/resource network requests/i)).toBeVisible();

  // 6. Audit & Reports — verify zero raw PII in rendered timeline
  await page.getByRole('button', { name: /Audit & Reports/i }).click();
  await expect(page.getByText(/Local Session Activity Timeline/i)).toBeVisible();
  await expect(page.locator('body')).not.toContainText('rahul.verma@example-corp.in');

  // 7. Offline mode after assets loaded: verify local CSV sanitization & download still work
  await context.setOffline(true);
  await page.getByRole('button', { name: /Sanitize Workspace/i }).click();
  await page.getByRole('button', { name: /Load Synthetic CSV/i }).click();
  await expect(page.getByText(/Offline Ready/i)).toBeVisible();
  await expect(page.getByText(/Validated Entities:/i)).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download CSV/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('synthetic-kyc-records.sanitized.csv');

  expect(pageErrors).toEqual([]);
});
