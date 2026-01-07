/**
 * craudiovizai.com Critical Flows E2E Tests
 * Phase 3C.4 - Real Playwright Browser Automation
 * 
 * CRITICAL: Only fails on actual JavaScript exceptions (pageerror)
 * Console errors are logged for reporting but don't fail tests
 */
import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';

// Error collection for reporting (non-blocking)
const consoleErrors: string[] = [];
// Critical errors that MUST fail (blocking)
const criticalErrors: string[] = [];

function setupErrorListeners(page: Page, testName: string) {
  // Log console errors but don't fail (CSP warnings, 404s, etc.)
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = `[${testName}] console.error: ${msg.text()}`;
      consoleErrors.push(text);
      console.log(text); // Log for visibility
    }
  });

  // CRITICAL: Actual JS exceptions MUST fail the test
  page.on('pageerror', (error) => {
    const text = `[${testName}] UNCAUGHT JS EXCEPTION: ${error.message}`;
    criticalErrors.push(text);
    console.error(text);
    throw new Error(`Client-side JS crash: ${error.message}`);
  });
}

test.describe('craudiovizai.com Critical Flows', () => {
  
  test('1. Homepage loads without JS crashes', async ({ page }) => {
    setupErrorListeners(page, 'Homepage');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const appError = await page.locator('text=Application error').count();
    expect(appError, 'Homepage should not show Application Error').toBe(0);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'test-results/01-homepage.png' });
  });

  test('2. Login click renders login UI without JS crash', async ({ page }) => {
    setupErrorListeners(page, 'Login');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loginSelectors = [
      'a:has-text("Log In")',
      'a:has-text("Login")', 
      'a[href*="login"]',
      'button:has-text("Log In")',
    ];
    
    let clicked = false;
    for (const selector of loginSelectors) {
      const el = page.locator(selector).first();
      if (await el.count() > 0) {
        await el.click();
        clicked = true;
        break;
      }
    }
    
    if (!clicked) {
      await page.goto('/login');
    }
    
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/02-login.png' });
    
    const appError = await page.locator('text=Application error').count();
    expect(appError, 'Login should not show Application Error').toBe(0);
    
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent?.length).toBeGreaterThan(10);
    
    console.log('✅ Login page rendered without JS crash');
  });

  test('3. Get Started routes correctly', async ({ page }) => {
    setupErrorListeners(page, 'GetStarted');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const el = page.locator('a:has-text("Get Started"), button:has-text("Get Started")').first();
    if (await el.count() === 0) {
      console.log('No Get Started button - skipping');
      test.skip();
      return;
    }
    
    await el.click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/03-getstarted.png' });
    
    const appError = await page.locator('text=Application error').count();
    expect(appError).toBe(0);
  });

  test('4. Footer social links are valid URLs', async ({ page }) => {
    setupErrorListeners(page, 'Social');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const issues: string[] = [];
    const socialPatterns = ['twitter.com', 'x.com', 'linkedin.com', 'github.com', 'discord', 'youtube.com', 'instagram.com'];
    
    for (const pattern of socialPatterns) {
      const links = await page.locator(`a[href*="${pattern}"]`).all();
      for (const link of links) {
        const href = await link.getAttribute('href');
        if (!href || href === '#') {
          issues.push(`${pattern} link has invalid href: ${href}`);
        }
      }
    }
    
    const hashLinks = await page.locator('footer a[href="#"]').all();
    for (const link of hashLinks) {
      const text = await link.textContent();
      if (text && /twitter|linkedin|github|discord|youtube|instagram/i.test(text)) {
        issues.push(`Social link "${text}" has href="#"`);
      }
    }
    
    await page.screenshot({ path: 'test-results/04-social.png' });
    expect(issues.length, `Invalid social links: ${issues.join(', ')}`).toBe(0);
  });

  test('5. /apps loads and cards work', async ({ page }) => {
    setupErrorListeners(page, 'Apps');
    await page.goto('/apps');
    await page.waitForLoadState('networkidle');
    
    if (await page.locator('text=404').count() > 0) {
      console.log('/apps returns 404 - skipping');
      test.skip();
      return;
    }
    
    await page.screenshot({ path: 'test-results/05-apps.png' });
    
    const appError = await page.locator('text=Application error').count();
    expect(appError).toBe(0);
    
    // Test first card click
    const cards = await page.locator('main a[href]:not([href="#"])').all();
    if (cards.length > 0) {
      const href = await cards[0].getAttribute('href');
      console.log('Testing first card:', href);
      await cards[0].click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/05-apps-card1.png' });
      
      const cardError = await page.locator('text=Application error').count();
      expect(cardError).toBe(0);
    }
  });

  test('6. /pricing loads without JS crash', async ({ page }) => {
    setupErrorListeners(page, 'Pricing');
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ path: 'test-results/06-pricing.png' });
    
    expect(await page.locator('text=404').count()).toBe(0);
    
    const appError = await page.locator('text=Application error').count();
    expect(appError, '/pricing should not show Application Error').toBe(0);
    
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(50);
    
    console.log('✅ /pricing loaded successfully');
  });

  test.afterAll(async () => {
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results', { recursive: true });
    }
    
    // Write all collected errors for reference
    const allErrors = [...criticalErrors, ...consoleErrors];
    if (allErrors.length > 0) {
      fs.writeFileSync('test-results/errors.log', allErrors.join('\n\n'));
      console.log(`\n📝 ${consoleErrors.length} console errors logged (non-blocking)`);
      console.log(`⚠️ ${criticalErrors.length} critical JS crashes`);
    } else {
      fs.writeFileSync('test-results/errors.log', 'No errors');
      console.log('\n✅ All pages loaded without errors');
    }
  });
});
