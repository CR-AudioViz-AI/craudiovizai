/**
 * E2E Smoke Test - Fast PR Gate
 * Quick validation of critical paths only
 */
import { test, expect, Page } from '@playwright/test';

function setupErrorCapture(page: Page) {
  page.on('pageerror', (error) => {
    throw new Error(`Page error: ${error.message}`);
  });
}

test.describe('Smoke Test - Critical Paths', () => {
  test('Homepage loads', async ({ page }) => {
    setupErrorCapture(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const crash = await page.locator('text=/Application error/i').count();
    expect(crash).toBe(0);
  });

  test('/login renders', async ({ page }) => {
    setupErrorCapture(page);
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const crash = await page.locator('text=/Application error/i').count();
    expect(crash).toBe(0);
  });

  test('/pricing loads', async ({ page }) => {
    setupErrorCapture(page);
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    
    const crash = await page.locator('text=/Application error/i').count();
    expect(crash).toBe(0);
  });

  test('/apps loads', async ({ page }) => {
    setupErrorCapture(page);
    await page.goto('/apps');
    await page.waitForLoadState('networkidle');
    
    const crash = await page.locator('text=/Application error/i').count();
    expect(crash).toBe(0);
  });
});
