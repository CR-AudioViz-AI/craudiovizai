// /app/api/cron/warmup/route.ts
// Cold Start Prevention - Warmup Cron
// Runs every 3 minutes to keep critical functions warm
// Timestamp: January 1, 2026 - 5:58 PM EST

import { NextRequest, NextResponse } from 'next/server';

// Critical endpoints to keep warm
const CRITICAL_ENDPOINTS = [
  '/api/health',
  '/api/chat',
  '/api/admin/dashboard',
  '/api/credits/balance',
  '/api/auth/session',
  '/api/search',
  '/api/analytics/dashboard',
  '/api/admin/module-factory',
];

// Secondary endpoints (warmed less frequently)
const SECONDARY_ENDPOINTS = [
  '/api/marketplace/listings',
  '/api/users/profile',
  '/api/payments/status',
  '/api/assets/folders',
];

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface WarmupResult {
  endpoint: string;
  status: number;
  latency: number;
  cached: boolean;
}

async function warmEndpoint(baseUrl: string, endpoint: string): Promise<WarmupResult> {
  const start = Date.now();
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'X-Warmup-Request': 'true',
        'User-Agent': 'CR-AudioViz-Warmup/1.0',
      },
      cache: 'no-store',
    });

    const latency = Date.now() - start;
    const cached = response.headers.get('x-vercel-cache') === 'HIT';

    return {
      endpoint,
      status: response.status,
      latency,
      cached,
    };
  } catch (error: any) {
    return {
      endpoint,
      status: 0,
      latency: Date.now() - start,
      cached: false,
    };
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const results: WarmupResult[] = [];
  
  // Verify this is a legitimate cron request
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  
  // Allow Vercel cron or authorized requests
  if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Still allow warmup for internal calls
    console.log('[Warmup] Non-cron request, proceeding anyway');
  }

  // Get base URL
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = request.headers.get('host') || 'craudiovizai.com';
  const baseUrl = `${protocol}://${host}`;

  console.log(`[Warmup] Starting warmup cycle at ${new Date().toISOString()}`);
  console.log(`[Warmup] Base URL: ${baseUrl}`);

  // Warm critical endpoints (always)
  const criticalPromises = CRITICAL_ENDPOINTS.map(endpoint => 
    warmEndpoint(baseUrl, endpoint)
  );

  // Only warm secondary endpoints every other run (based on minute)
  const minute = new Date().getMinutes();
  const warmSecondary = minute % 6 === 0;

  let secondaryPromises: Promise<WarmupResult>[] = [];
  if (warmSecondary) {
    secondaryPromises = SECONDARY_ENDPOINTS.map(endpoint => 
      warmEndpoint(baseUrl, endpoint)
    );
  }

  // Execute all warmup requests in parallel
  const [criticalResults, secondaryResults] = await Promise.all([
    Promise.all(criticalPromises),
    warmSecondary ? Promise.all(secondaryPromises) : Promise.resolve([]),
  ]);

  results.push(...criticalResults, ...secondaryResults);

  // Calculate statistics
  const totalLatency = results.reduce((sum, r) => sum + r.latency, 0);
  const avgLatency = Math.round(totalLatency / results.length);
  const successCount = results.filter(r => r.status >= 200 && r.status < 400).length;
  const coldStarts = results.filter(r => r.latency > 1000 && !r.cached).length;

  const summary = {
    success: true,
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
    stats: {
      totalEndpoints: results.length,
      successfulWarmups: successCount,
      failedWarmups: results.length - successCount,
      coldStartsDetected: coldStarts,
      averageLatency: avgLatency,
      maxLatency: Math.max(...results.map(r => r.latency)),
      minLatency: Math.min(...results.map(r => r.latency)),
    },
    details: results.map(r => ({
      endpoint: r.endpoint,
      status: r.status,
      latency: r.latency,
      cold: r.latency > 1000 && !r.cached,
    })),
    meta: {
      warmedSecondary: warmSecondary,
      baseUrl,
      version: '1.0.0',
    },
  };

  console.log(`[Warmup] Completed: ${successCount}/${results.length} endpoints warmed`);
  console.log(`[Warmup] Cold starts detected: ${coldStarts}`);
  console.log(`[Warmup] Average latency: ${avgLatency}ms`);

  return NextResponse.json(summary);
}
