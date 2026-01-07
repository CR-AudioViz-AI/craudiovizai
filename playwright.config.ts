import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration - craudiovizai.com
 * Full Coverage Suite
 * 
 * PINNED VERSIONS:
 * - @playwright/test: 1.48.0 (exact)
 * - Container: mcr.microsoft.com/playwright:v1.48.0-jammy
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Full coverage needs more time
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,  // Zero retries - failures must be real
  workers: 1,  // Single worker for deterministic execution
  
  // Timeout for full suite
  timeout: 120000, // 2 minutes per test
  globalTimeout: 30 * 60 * 1000, // 30 minutes total
  
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  use: {
    baseURL: 'https://craudiovizai.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  
  expect: {
    timeout: 10000,
  },
  
  outputDir: 'test-results',
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
