import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('starts onboarding without leaking translation keys', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /linguistic architecture|arquitectura lingüística/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /continue|continuar/i })).toBeVisible();
  await expect(page.getByText(/COMMON\.|common\./)).toHaveCount(0);
});

test('keeps the local-first promise visible in app metadata', async ({ page }) => {
  await expect(page).toHaveTitle(/Lumina/);

  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description).toContain('local-first');
  expect(description).toContain('encrypted');
});
