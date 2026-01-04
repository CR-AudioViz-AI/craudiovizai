// ================================================================================
// CR AUDIOVIZ AI - E2E TEST RUNNER API
// Execute Playwright tests and store evidence artifacts
// ================================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const maxDuration = 300; // 5 minutes for test execution

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

// Device profiles for testing
const DEVICE_PROFILES = {
  'desktop': { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false },
  'iphone-14': { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' },
  'iphone-14-pro-max': { width: 430, height: 932, deviceScaleFactor: 3, isMobile: true },
  'pixel-7': { width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)' },
  'ipad-pro': { width: 1024, height: 1366, deviceScaleFactor: 2, isMobile: false }
};

// Test scenarios
const TEST_SCENARIOS = {
  'auth-flow': {
    name: 'Authentication Flow',
    steps: ['visit-home', 'click-login', 'enter-credentials', 'verify-dashboard']
  },
  'app-launch': {
    name: 'App Launch Flow',
    steps: ['visit-apps', 'select-app', 'verify-app-loads', 'return-to-hub']
  },
  'credits-purchase': {
    name: 'Credits Purchase',
    steps: ['visit-pricing', 'select-plan', 'checkout-flow', 'verify-credits']
  },
  'asset-upload': {
    name: 'Asset Upload',
    steps: ['visit-dashboard', 'upload-file', 'verify-in-car', 'access-from-app']
  },
  'health-check': {
    name: 'Platform Health',
    steps: ['check-home', 'check-apps', 'check-pricing', 'check-dashboard', 'check-api']
  }
};

// ============================================================================
// GET /api/e2e - Get test status and available scenarios
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('run_id');
    
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    if (runId) {
      // Get specific test run
      const { data: artifacts } = await supabase
        .from('evidence_artifacts')
        .select('*')
        .eq('test_run_id', runId)
        .order('created_at', { ascending: true });

      return NextResponse.json({
        run_id: runId,
        artifacts: artifacts || [],
        artifact_count: artifacts?.length || 0
      });
    }

    // Return available scenarios and device profiles
    return NextResponse.json({
      scenarios: TEST_SCENARIOS,
      device_profiles: Object.keys(DEVICE_PROFILES),
      endpoints: {
        run: 'POST /api/e2e',
        status: 'GET /api/e2e?run_id=xxx',
        evidence: 'GET /api/evidence?test_run_id=xxx'
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST /api/e2e - Execute test scenario
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const {
      scenario = 'health-check',
      device = 'desktop',
      url_base = 'https://craudiovizai.com'
    } = body;

    const testRunId = crypto.randomUUID();
    const deviceProfile = DEVICE_PROFILES[device as keyof typeof DEVICE_PROFILES] || DEVICE_PROFILES.desktop;
    const testScenario = TEST_SCENARIOS[scenario as keyof typeof TEST_SCENARIOS];

    if (!testScenario) {
      return NextResponse.json({ error: `Unknown scenario: ${scenario}` }, { status: 400 });
    }

    const startTime = Date.now();
    const results: any[] = [];

    // Execute health check scenario (HTTP-based, can run in edge)
    if (scenario === 'health-check') {
      const pagesToCheck = [
        { path: '/', name: 'Homepage' },
        { path: '/apps', name: 'Apps Page' },
        { path: '/pricing', name: 'Pricing Page' },
        { path: '/dashboard', name: 'Dashboard' },
        { path: '/api/health', name: 'Health API' },
        { path: '/api/apps', name: 'Apps API' }
      ];

      for (const page of pagesToCheck) {
        const checkStart = Date.now();
        try {
          const response = await fetch(`${url_base}${page.path}`, {
            method: 'GET',
            headers: { 'User-Agent': deviceProfile.userAgent || 'CR-AudioViz-E2E-Runner/1.0' }
          });

          const result = {
            step: page.name,
            url: `${url_base}${page.path}`,
            status: response.status,
            success: response.status >= 200 && response.status < 400,
            response_time_ms: Date.now() - checkStart
          };

          results.push(result);

          // Store evidence artifact
          await supabase.from('evidence_artifacts').insert({
            test_run_id: testRunId,
            test_name: `${scenario}:${page.name}`,
            artifact_type: 'log',
            storage_path: `evidence/${testRunId}/${page.path.replace('/', '_')}.json`,
            description: `HTTP check for ${page.name}`,
            metadata: result,
            device_profile: device,
            url_tested: `${url_base}${page.path}`,
            status: result.success ? 'pass' : 'fail'
          });

        } catch (error: any) {
          results.push({
            step: page.name,
            url: `${url_base}${page.path}`,
            status: 0,
            success: false,
            error: error.message,
            response_time_ms: Date.now() - checkStart
          });
        }
      }
    } else {
      // For other scenarios, return instructions for Playwright worker
      return NextResponse.json({
        test_run_id: testRunId,
        scenario: testScenario,
        device_profile: deviceProfile,
        url_base,
        message: 'Scenario requires Playwright worker execution',
        worker_endpoint: '/api/e2e/worker',
        status: 'pending_worker'
      });
    }

    const totalDuration = Date.now() - startTime;
    const passCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    // Store summary
    await supabase.from('evidence_artifacts').insert({
      test_run_id: testRunId,
      test_name: `${scenario}:summary`,
      artifact_type: 'log',
      storage_path: `evidence/${testRunId}/summary.json`,
      description: `Test run summary for ${scenario}`,
      metadata: {
        scenario,
        device,
        url_base,
        total_duration_ms: totalDuration,
        pass_count: passCount,
        fail_count: failCount,
        results
      },
      device_profile: device,
      status: failCount === 0 ? 'pass' : 'fail'
    });

    return NextResponse.json({
      test_run_id: testRunId,
      scenario,
      device,
      duration_ms: totalDuration,
      results,
      summary: {
        total: results.length,
        passed: passCount,
        failed: failCount,
        success_rate: `${((passCount / results.length) * 100).toFixed(1)}%`
      }
    });

  } catch (error: any) {
    console.error('E2E runner error:', error);
    return NextResponse.json({ error: 'Test execution failed', details: error.message }, { status: 500 });
  }
}
