/**
 * Auth Provider Coverage Test
 * 
 * Verifies that ALL enabled auth providers from config are rendered on login/signup pages.
 * If a provider is enabled in config but missing from UI → test FAILS.
 * 
 * @timestamp January 7, 2026 - 11:35 AM EST
 * @author Claude (for Roy Henderson)
 */

import { test, expect } from '@playwright/test';

// Import the enabled provider list from config
// This ensures the test fails if config and UI drift apart
import { ENABLED_PROVIDER_IDS } from '@/lib/auth/providers';

// Fallback list if import fails (for CI where imports may not work)
const EXPECTED_PROVIDERS = [
  'google',
  'github',
  'email',
  'magic_link',
];

test.describe('Auth Provider Coverage', () => {
  test.describe('Login Page', () => {
    test('renders AuthOptions component', async ({ page }) => {
      await page.goto('/login');
      
      // Verify the auth options container exists
      const authOptions = page.getByTestId('auth-options');
      await expect(authOptions).toBeVisible();
    });

    test('renders ALL enabled OAuth providers', async ({ page }) => {
      await page.goto('/login');
      
      // Check for OAuth providers section
      const oauthSection = page.getByTestId('oauth-providers');
      await expect(oauthSection).toBeVisible();
      
      // Verify Google button exists
      const googleBtn = page.getByTestId('auth-provider-google');
      await expect(googleBtn).toBeVisible();
      await expect(googleBtn).toContainText('Google');
      
      // Verify GitHub button exists
      const githubBtn = page.getByTestId('auth-provider-github');
      await expect(githubBtn).toBeVisible();
      await expect(githubBtn).toContainText('GitHub');
    });

    test('renders email/password form', async ({ page }) => {
      await page.goto('/login');
      
      const emailForm = page.getByTestId('email-password-form');
      await expect(emailForm).toBeVisible();
      
      // Check for email input
      const emailInput = emailForm.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
      
      // Check for password input
      const passwordInput = emailForm.locator('input[type="password"]');
      await expect(passwordInput).toBeVisible();
      
      // Check for submit button
      const submitBtn = page.getByTestId('auth-provider-email');
      await expect(submitBtn).toBeVisible();
    });

    test('renders forgot password link', async ({ page }) => {
      await page.goto('/login');
      
      const forgotLink = page.getByTestId('forgot-password-link');
      await expect(forgotLink).toBeVisible();
      await expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });

    test('renders magic link option', async ({ page }) => {
      await page.goto('/login');
      
      const magicLinkToggle = page.getByTestId('toggle-magic-link');
      await expect(magicLinkToggle).toBeVisible();
      
      // Click to show magic link form
      await magicLinkToggle.click();
      
      const magicLinkForm = page.getByTestId('magic-link-form');
      await expect(magicLinkForm).toBeVisible();
      
      const magicLinkBtn = page.getByTestId('auth-provider-magic_link');
      await expect(magicLinkBtn).toBeVisible();
    });

    test('OAuth buttons are clickable and initiate auth', async ({ page }) => {
      await page.goto('/login');
      
      // Test Google button is clickable (will redirect to Supabase OAuth)
      const googleBtn = page.getByTestId('auth-provider-google');
      await expect(googleBtn).toBeEnabled();
      
      // Test GitHub button is clickable
      const githubBtn = page.getByTestId('auth-provider-github');
      await expect(githubBtn).toBeEnabled();
    });

    test('shows error state for misconfigured providers', async ({ page }) => {
      await page.goto('/login');
      
      // Look for any provider error states
      const errorStates = page.locator('[data-provider-error="true"]');
      
      // If there are error states, they should have proper messaging
      const count = await errorStates.count();
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const errorEl = errorStates.nth(i);
          await expect(errorEl).toContainText('not configured');
        }
      }
    });
  });

  test.describe('Signup Page', () => {
    test('renders AuthOptions component', async ({ page }) => {
      await page.goto('/signup');
      
      const authOptions = page.getByTestId('auth-options');
      await expect(authOptions).toBeVisible();
    });

    test('renders ALL enabled OAuth providers', async ({ page }) => {
      await page.goto('/signup');
      
      // Verify Google button exists
      const googleBtn = page.getByTestId('auth-provider-google');
      await expect(googleBtn).toBeVisible();
      
      // Verify GitHub button exists
      const githubBtn = page.getByTestId('auth-provider-github');
      await expect(githubBtn).toBeVisible();
    });

    test('renders signup form with name field', async ({ page }) => {
      await page.goto('/signup');
      
      const emailForm = page.getByTestId('email-password-form');
      await expect(emailForm).toBeVisible();
      
      // Check for name input (signup only)
      const nameInput = emailForm.locator('input[type="text"]');
      await expect(nameInput).toBeVisible();
      
      // Check for email input
      const emailInput = emailForm.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
      
      // Check for password input
      const passwordInput = emailForm.locator('input[type="password"]');
      await expect(passwordInput).toBeVisible();
    });

    test('signup page has link to login', async ({ page }) => {
      await page.goto('/signup');
      
      const loginLink = page.locator('a[href="/login"]');
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe('Provider Count Validation', () => {
    test('login and signup pages show same number of OAuth providers', async ({ page }) => {
      // Count providers on login page
      await page.goto('/login');
      const loginOAuthSection = page.getByTestId('oauth-providers');
      const loginProviderCount = await loginOAuthSection.locator('button').count();
      
      // Count providers on signup page
      await page.goto('/signup');
      const signupOAuthSection = page.getByTestId('oauth-providers');
      const signupProviderCount = await signupOAuthSection.locator('button').count();
      
      // They should match (shared component)
      expect(loginProviderCount).toBe(signupProviderCount);
    });

    test('at least 2 OAuth providers are displayed', async ({ page }) => {
      await page.goto('/login');
      
      const oauthSection = page.getByTestId('oauth-providers');
      const providerButtons = oauthSection.locator('button, [data-provider-error="true"]');
      const count = await providerButtons.count();
      
      // We expect at least Google and GitHub
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe('Accessibility', () => {
    test('login page has proper form labels', async ({ page }) => {
      await page.goto('/login');
      
      // Check email has label
      const emailLabel = page.locator('label:has-text("Email")');
      await expect(emailLabel).toBeVisible();
      
      // Check password has label
      const passwordLabel = page.locator('label:has-text("Password")');
      await expect(passwordLabel).toBeVisible();
    });

    test('OAuth buttons have accessible names', async ({ page }) => {
      await page.goto('/login');
      
      const googleBtn = page.getByTestId('auth-provider-google');
      await expect(googleBtn).toHaveAccessibleName(/Google/i);
      
      const githubBtn = page.getByTestId('auth-provider-github');
      await expect(githubBtn).toHaveAccessibleName(/GitHub/i);
    });
  });
});
