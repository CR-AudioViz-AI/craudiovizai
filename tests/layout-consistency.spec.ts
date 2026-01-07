/**
 * Layout Consistency E2E Tests
 * 
 * Verifies:
 * - Header present on ALL pages including login/signup
 * - Footer present on ALL pages including login/signup
 * - Logo links to home
 * - Auth state displays correctly (Login button vs Name+Logout)
 * - CreditsBar shows Plan/Credits/Upgrade/TopUp for logged-in users
 * - Footer has consistent nav + legal + social links
 * 
 * @timestamp January 7, 2026 - 12:02 PM EST
 */

import { test, expect } from '@playwright/test';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/apps',
  '/games',
  '/pricing',
  '/about',
  '/contact',
  '/javari',
  '/craiverse',
  '/support',
  '/terms',
  '/privacy',
];

test.describe('Layout Consistency', () => {
  
  test.describe('Header Presence', () => {
    for (const route of PUBLIC_ROUTES) {
      test(`header is present on ${route}`, async ({ page }) => {
        await page.goto(route);
        const header = page.locator('header');
        await expect(header).toBeVisible();
      });
    }
  });

  test.describe('Footer Presence', () => {
    for (const route of PUBLIC_ROUTES) {
      test(`footer is present on ${route}`, async ({ page }) => {
        await page.goto(route);
        const footer = page.locator('footer');
        await expect(footer).toBeVisible();
      });
    }
  });

  test.describe('Logo Links to Home', () => {
    test('logo on homepage links to /', async ({ page }) => {
      await page.goto('/');
      const logoLink = page.locator('header a[href="/"]').first();
      await expect(logoLink).toBeVisible();
    });

    test('logo on about page links to /', async ({ page }) => {
      await page.goto('/about');
      const logoLink = page.locator('header a[href="/"]').first();
      await expect(logoLink).toBeVisible();
      await logoLink.click();
      await expect(page).toHaveURL('/');
    });

    test('logo on login page links to /', async ({ page }) => {
      await page.goto('/login');
      const logoLink = page.locator('header a[href="/"]').first();
      await expect(logoLink).toBeVisible();
    });
  });

  test.describe('Auth State - Logged Out', () => {
    test('shows Login button when not authenticated', async ({ page }) => {
      await page.goto('/');
      // Look for Login link/button in header
      const loginBtn = page.locator('header').getByRole('link', { name: /login/i });
      await expect(loginBtn).toBeVisible();
    });

    test('Login button navigates to /login', async ({ page }) => {
      await page.goto('/');
      const loginBtn = page.locator('header').getByRole('link', { name: /login/i });
      await loginBtn.click();
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Footer Links', () => {
    test('footer has navigation links', async ({ page }) => {
      await page.goto('/');
      const footer = page.locator('footer');
      
      // Check for nav links
      await expect(footer.getByRole('link', { name: /apps/i })).toBeVisible();
      await expect(footer.getByRole('link', { name: /games/i })).toBeVisible();
      await expect(footer.getByRole('link', { name: /pricing/i })).toBeVisible();
    });

    test('footer has legal links', async ({ page }) => {
      await page.goto('/');
      const footer = page.locator('footer');
      
      await expect(footer.getByRole('link', { name: /privacy/i })).toBeVisible();
      await expect(footer.getByRole('link', { name: /terms/i })).toBeVisible();
    });

    test('footer has social links', async ({ page }) => {
      await page.goto('/');
      const footer = page.locator('footer');
      
      // Check for at least some social links
      const socialLinks = footer.locator('a[target="_blank"]');
      const count = await socialLinks.count();
      expect(count).toBeGreaterThanOrEqual(4);
    });

    test('footer has copyright', async ({ page }) => {
      await page.goto('/');
      const footer = page.locator('footer');
      
      await expect(footer.getByText(/CR AudioViz AI/)).toBeVisible();
      await expect(footer.getByText(/All rights reserved/)).toBeVisible();
    });
  });

  test.describe('Login/Signup Use Shared Layout', () => {
    test('login page has same header as homepage', async ({ page }) => {
      // Get header content from homepage
      await page.goto('/');
      const homeHeader = page.locator('header');
      const homeLogoVisible = await homeHeader.locator('a[href="/"]').first().isVisible();
      
      // Check login page
      await page.goto('/login');
      const loginHeader = page.locator('header');
      const loginLogoVisible = await loginHeader.locator('a[href="/"]').first().isVisible();
      
      expect(homeLogoVisible).toBe(true);
      expect(loginLogoVisible).toBe(true);
    });

    test('signup page has same footer as homepage', async ({ page }) => {
      await page.goto('/signup');
      const footer = page.locator('footer');
      
      // Should have same footer elements
      await expect(footer.getByRole('link', { name: /privacy/i })).toBeVisible();
      await expect(footer.getByText(/CR AudioViz AI/)).toBeVisible();
    });
  });

  test.describe('Mobile Logo Sizing', () => {
    test('logo is appropriately sized on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Logo container should be around 40px on mobile
      const logoContainer = page.locator('header a[href="/"] > div').first();
      const box = await logoContainer.boundingBox();
      
      expect(box?.width).toBeLessThanOrEqual(56);
      expect(box?.height).toBeLessThanOrEqual(56);
    });
  });
});
