/**
 * E2E Discovery Suite - Builds Coverage Manifest
 * Crawls craudiovizai.com to enumerate all routes, links, and apps
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';

interface CoverageManifest {
  timestamp: string;
  baseUrl: string;
  commitSha: string;
  routes: {
    path: string;
    status: number;
    hasErrors: boolean;
  }[];
  internalLinks: {
    href: string;
    foundOn: string;
  }[];
  externalLinks: {
    href: string;
    foundOn: string;
  }[];
  appEntryPoints: {
    path: string;
    name: string;
    hasCTA: boolean;
  }[];
  counts: {
    routes: number;
    internalLinks: number;
    externalLinks: number;
    apps: number;
  };
}

// Known routes from sitemap + discovery
const KNOWN_ROUTES = [
  '/',
  '/about',
  '/acceptable-use',
  '/accessibility',
  '/ai-disclosure',
  '/apps',
  '/apps/games-hub',
  '/apps/javari-ai',
  '/apps/logo-studio',
  '/apps/meme-generator',
  '/apps/orlando-trip-deal',
  '/apps/watch-works',
  '/blog',
  '/careers',
  '/contact',
  '/cookies',
  '/craiverse',
  '/dmca',
  '/docs',
  '/enterprise',
  '/faq',
  '/games',
  '/javari',
  '/partners',
  '/press',
  '/pricing',
  '/privacy',
  '/refunds',
  '/support',
  '/terms',
  '/login',
  '/signup',
  '/signin',
  '/forgot-password',
  '/settings',
];

const manifest: CoverageManifest = {
  timestamp: new Date().toISOString(),
  baseUrl: 'https://craudiovizai.com',
  commitSha: process.env.GITHUB_SHA || 'local',
  routes: [],
  internalLinks: [],
  externalLinks: [],
  appEntryPoints: [],
  counts: { routes: 0, internalLinks: 0, externalLinks: 0, apps: 0 },
};

const discoveredInternalLinks = new Set<string>();
const discoveredExternalLinks = new Set<string>();

test.describe('Discovery Suite', () => {
  test('1. Crawl homepage for all links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const links = await page.locator('a[href]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (!href) continue;
      
      if (href.startsWith('/') || href.startsWith('https://craudiovizai.com')) {
        const path = href.replace('https://craudiovizai.com', '');
        if (path && !discoveredInternalLinks.has(path)) {
          discoveredInternalLinks.add(path);
          manifest.internalLinks.push({ href: path, foundOn: '/' });
        }
      } else if (href.startsWith('http')) {
        if (!discoveredExternalLinks.has(href)) {
          discoveredExternalLinks.add(href);
          manifest.externalLinks.push({ href, foundOn: '/' });
        }
      }
    }
    
    console.log(`Homepage: Found ${discoveredInternalLinks.size} internal, ${discoveredExternalLinks.size} external links`);
  });

  test('2. Crawl /apps for all app entry points', async ({ page }) => {
    await page.goto('/apps');
    await page.waitForLoadState('networkidle');
    
    // Find all app cards/links
    const appLinks = await page.locator('a[href^="/apps/"]').all();
    const seenApps = new Set<string>();
    
    for (const link of appLinks) {
      const href = await link.getAttribute('href');
      if (!href || seenApps.has(href)) continue;
      seenApps.add(href);
      
      const name = await link.textContent() || href;
      manifest.appEntryPoints.push({
        path: href,
        name: name.trim().substring(0, 50),
        hasCTA: false, // Will be verified in apps-tools suite
      });
    }
    
    // Also crawl links on /apps page
    const links = await page.locator('a[href]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (!href) continue;
      
      if (href.startsWith('/') || href.startsWith('https://craudiovizai.com')) {
        const path = href.replace('https://craudiovizai.com', '');
        if (path && !discoveredInternalLinks.has(path)) {
          discoveredInternalLinks.add(path);
          manifest.internalLinks.push({ href: path, foundOn: '/apps' });
        }
      } else if (href.startsWith('http')) {
        if (!discoveredExternalLinks.has(href)) {
          discoveredExternalLinks.add(href);
          manifest.externalLinks.push({ href, foundOn: '/apps' });
        }
      }
    }
    
    console.log(`/apps: Found ${manifest.appEntryPoints.length} app entry points`);
  });

  test('3. Verify all known routes', async ({ page, request }) => {
    for (const route of KNOWN_ROUTES) {
      const response = await request.get(route);
      const status = response.status();
      
      let hasErrors = false;
      if (status === 200) {
        // Quick page load to check for errors
        try {
          await page.goto(route, { timeout: 15000 });
          const errorText = await page.locator('text=/Application error|Unhandled Runtime Error|client-side exception/i').count();
          hasErrors = errorText > 0;
        } catch (e) {
          hasErrors = true;
        }
      }
      
      manifest.routes.push({ path: route, status, hasErrors });
      console.log(`${status === 200 ? '✓' : '✗'} ${route}: ${status}${hasErrors ? ' (has errors)' : ''}`);
    }
  });

  test('4. Generate coverage manifest', async () => {
    // Update counts
    manifest.counts = {
      routes: manifest.routes.length,
      internalLinks: manifest.internalLinks.length,
      externalLinks: manifest.externalLinks.length,
      apps: manifest.appEntryPoints.length,
    };
    
    // Dedupe internal links
    const uniqueInternal = [...new Set(manifest.internalLinks.map(l => l.href))];
    manifest.internalLinks = uniqueInternal.map(href => {
      const found = manifest.internalLinks.find(l => l.href === href);
      return found!;
    });
    manifest.counts.internalLinks = manifest.internalLinks.length;
    
    // Dedupe external links
    const uniqueExternal = [...new Set(manifest.externalLinks.map(l => l.href))];
    manifest.externalLinks = uniqueExternal.map(href => {
      const found = manifest.externalLinks.find(l => l.href === href);
      return found!;
    });
    manifest.counts.externalLinks = manifest.externalLinks.length;
    
    // Write manifest
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results', { recursive: true });
    }
    fs.writeFileSync('test-results/E2E_COVERAGE_MANIFEST.json', JSON.stringify(manifest, null, 2));
    
    console.log('\n=== COVERAGE MANIFEST ===');
    console.log(`Routes: ${manifest.counts.routes}`);
    console.log(`Internal Links: ${manifest.counts.internalLinks}`);
    console.log(`External Links: ${manifest.counts.externalLinks}`);
    console.log(`App Entry Points: ${manifest.counts.apps}`);
    console.log('Manifest written to test-results/E2E_COVERAGE_MANIFEST.json');
    
    expect(manifest.counts.routes).toBeGreaterThan(20);
  });
});
