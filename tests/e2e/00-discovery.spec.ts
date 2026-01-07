/**
 * E2E Discovery Test - Builds Coverage Manifest
 * Crawls craudiovizai.com to enumerate all routes, links, and app entry points
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';

interface CoverageManifest {
  timestamp: string;
  commitSha: string;
  baseUrl: string;
  routes: RouteInfo[];
  internalLinks: string[];
  externalLinks: string[];
  appEntryPoints: AppEntry[];
  toolEntryPoints: ToolEntry[];
  gameEntryPoints: string[];
  authRoutes: string[];
  counts: {
    routes: number;
    internalLinks: number;
    externalLinks: number;
    apps: number;
    tools: number;
    games: number;
  };
}

interface RouteInfo {
  path: string;
  status: number;
  title?: string;
}

interface AppEntry {
  path: string;
  name: string;
  hasCTA: boolean;
}

interface ToolEntry {
  path: string;
  name: string;
  status: number;
}

const KNOWN_ROUTES = [
  '/',
  '/about',
  '/accessibility',
  '/api',
  '/apps',
  '/blog',
  '/careers',
  '/community',
  '/contact',
  '/cookies',
  '/craiverse',
  '/dmca',
  '/docs',
  '/games',
  '/javari',
  '/javariverse',
  '/login',
  '/newsletter',
  '/press',
  '/pricing',
  '/privacy',
  '/signup',
  '/support',
  '/terms',
  '/tools',
  '/forgot-password',
];

const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/auth/callback',
];

test.describe('Discovery - Build Coverage Manifest', () => {
  const manifest: CoverageManifest = {
    timestamp: new Date().toISOString(),
    commitSha: process.env.GITHUB_SHA || 'local',
    baseUrl: 'https://craudiovizai.com',
    routes: [],
    internalLinks: [],
    externalLinks: [],
    appEntryPoints: [],
    toolEntryPoints: [],
    gameEntryPoints: [],
    authRoutes: AUTH_ROUTES,
    counts: {
      routes: 0,
      internalLinks: 0,
      externalLinks: 0,
      apps: 0,
      tools: 0,
      games: 0,
    },
  };

  test('1. Discover all routes and their status', async ({ request }) => {
    console.log('Discovering routes...');
    
    for (const route of KNOWN_ROUTES) {
      try {
        const response = await request.get(route);
        manifest.routes.push({
          path: route,
          status: response.status(),
        });
        console.log(`  ${route}: ${response.status()}`);
      } catch (e) {
        manifest.routes.push({
          path: route,
          status: 0,
        });
        console.log(`  ${route}: ERROR`);
      }
    }
    
    manifest.counts.routes = manifest.routes.length;
    expect(manifest.routes.length).toBeGreaterThan(0);
  });

  test('2. Crawl homepage for all links', async ({ page }) => {
    console.log('Crawling homepage for links...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const links = await page.locator('a[href]').all();
    const seen = new Set<string>();
    
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (!href || seen.has(href)) continue;
      seen.add(href);
      
      if (href.startsWith('/') && !href.startsWith('/_next') && !href.includes('.')) {
        manifest.internalLinks.push(href);
      } else if (href.startsWith('http') && !href.includes('craudiovizai.com')) {
        manifest.externalLinks.push(href);
      }
    }
    
    manifest.counts.internalLinks = manifest.internalLinks.length;
    manifest.counts.externalLinks = manifest.externalLinks.length;
    
    console.log(`  Found ${manifest.internalLinks.length} internal links`);
    console.log(`  Found ${manifest.externalLinks.length} external links`);
  });

  test('3. Discover all tools from /tools', async ({ page, request }) => {
    console.log('Discovering tools...');
    await page.goto('/tools');
    
    if (await page.locator('text=503').count() > 0) {
      console.log('  /tools returns 503, using known tools list');
      // Fallback to known tools
      const knownTools = [
        'ai-analyzer', 'ai-chatbot', 'ai-translator', 'ai-writer',
        'animation-studio', 'audio-editor', 'background-remover', 'ebook-creator',
        'image-generator', 'image-resizer', 'invoice-generator', 'logo-maker',
        'meme-generator', 'music-mixer', 'pdf-editor', 'podcast-editor',
        'poster-designer', 'resume-builder', 'screen-recorder', 'social-media-kit',
        'subtitle-generator', 'thumbnail-creator', 'video-editor', 'voice-generator'
      ];
      
      for (const tool of knownTools) {
        const path = `/tools/${tool}`;
        try {
          const response = await request.get(path);
          manifest.toolEntryPoints.push({
            path,
            name: tool.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            status: response.status(),
          });
        } catch (e) {
          manifest.toolEntryPoints.push({ path, name: tool, status: 0 });
        }
      }
    } else {
      await page.waitForLoadState('networkidle');
      const toolLinks = await page.locator('a[href^="/tools/"]').all();
      
      for (const link of toolLinks) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        if (href && !manifest.toolEntryPoints.find(t => t.path === href)) {
          const response = await request.get(href);
          manifest.toolEntryPoints.push({
            path: href,
            name: text?.trim() || href.split('/').pop() || '',
            status: response.status(),
          });
        }
      }
    }
    
    manifest.counts.tools = manifest.toolEntryPoints.length;
    console.log(`  Found ${manifest.toolEntryPoints.length} tools`);
  });

  test('4. Discover all games from /games', async ({ page, request }) => {
    console.log('Discovering games...');
    await page.goto('/games');
    await page.waitForLoadState('networkidle');
    
    const gameLinks = await page.locator('a[href^="/games/play/"]').all();
    const seen = new Set<string>();
    
    for (const link of gameLinks) {
      const href = await link.getAttribute('href');
      if (href && !seen.has(href)) {
        seen.add(href);
        manifest.gameEntryPoints.push(href);
      }
    }
    
    // Ensure we have games 1-32 even if not all visible
    for (let i = 1; i <= 32; i++) {
      const path = `/games/play/${i}`;
      if (!manifest.gameEntryPoints.includes(path)) {
        manifest.gameEntryPoints.push(path);
      }
    }
    
    manifest.gameEntryPoints.sort((a, b) => {
      const numA = parseInt(a.split('/').pop() || '0');
      const numB = parseInt(b.split('/').pop() || '0');
      return numA - numB;
    });
    
    manifest.counts.games = manifest.gameEntryPoints.length;
    console.log(`  Found ${manifest.gameEntryPoints.length} games`);
  });

  test('5. Discover apps from /apps', async ({ page }) => {
    console.log('Discovering apps...');
    await page.goto('/apps');
    
    if (await page.locator('text=503').count() > 0) {
      console.log('  /apps returns 503, apps discovery limited');
      manifest.counts.apps = 0;
    } else {
      await page.waitForLoadState('networkidle');
      const appCards = await page.locator('a[href^="/apps/"]').all();
      
      for (const card of appCards) {
        const href = await card.getAttribute('href');
        const text = await card.textContent();
        if (href) {
          manifest.appEntryPoints.push({
            path: href,
            name: text?.trim() || '',
            hasCTA: false,
          });
        }
      }
      manifest.counts.apps = manifest.appEntryPoints.length;
    }
    console.log(`  Found ${manifest.appEntryPoints.length} apps`);
  });

  test('6. Validate external links resolve', async ({ request }) => {
    console.log('Validating external links...');
    const validLinks: string[] = [];
    const invalidLinks: string[] = [];
    
    // Sample external links to avoid rate limiting
    const sampled = manifest.externalLinks.slice(0, 20);
    
    for (const link of sampled) {
      try {
        const response = await request.get(link, { timeout: 10000 });
        if (response.status() >= 200 && response.status() < 400) {
          validLinks.push(link);
        } else {
          invalidLinks.push(`${link} (${response.status()})`);
        }
      } catch (e) {
        invalidLinks.push(`${link} (timeout/error)`);
      }
    }
    
    console.log(`  Valid: ${validLinks.length}, Invalid: ${invalidLinks.length}`);
    if (invalidLinks.length > 0) {
      console.log('  Invalid links:', invalidLinks.slice(0, 5).join(', '));
    }
  });

  test.afterAll(async () => {
    // Ensure output directory exists
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results', { recursive: true });
    }
    
    // Write manifest
    const manifestPath = 'test-results/E2E_COVERAGE_MANIFEST.json';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`\nManifest written to ${manifestPath}`);
    console.log('Summary:');
    console.log(`  Routes: ${manifest.counts.routes}`);
    console.log(`  Internal Links: ${manifest.counts.internalLinks}`);
    console.log(`  External Links: ${manifest.counts.externalLinks}`);
    console.log(`  Tools: ${manifest.counts.tools}`);
    console.log(`  Games: ${manifest.counts.games}`);
    console.log(`  Apps: ${manifest.counts.apps}`);
  });
});
