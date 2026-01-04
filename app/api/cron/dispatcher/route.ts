// ================================================================================
// CR AUDIOVIZ AI - CENTRAL CRON DISPATCHER
// Single cron entry point - all jobs are DB-driven
// Eliminates cron_jobs_limits_reached errors
// ================================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const maxDuration = 300;

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

// =============================================================================
// JOB DEFINITIONS (Fallback if DB unavailable)
// =============================================================================

interface AutonomousJob {
  id: string;
  name: string;
  endpoint: string;
  schedule_cron: string;
  interval_minutes: number;
  enabled: boolean;
  priority: number;
  timeout_ms: number;
  retry_count: number;
  last_run_at?: string;
  last_status?: string;
}

const FALLBACK_JOBS: AutonomousJob[] = [
  { id: 'warmup', name: 'API Warmup', endpoint: '/api/internal/warmup', schedule_cron: '*/2 * * * *', interval_minutes: 2, enabled: true, priority: 1, timeout_ms: 10000, retry_count: 2 },
  { id: 'health', name: 'Health Check', endpoint: '/api/health', schedule_cron: '*/5 * * * *', interval_minutes: 5, enabled: true, priority: 1, timeout_ms: 15000, retry_count: 3 },
  { id: 'cache-cleanup', name: 'Cache Cleanup', endpoint: '/api/internal/cache-cleanup', schedule_cron: '0 * * * *', interval_minutes: 60, enabled: true, priority: 2, timeout_ms: 30000, retry_count: 1 },
  { id: 'self-heal', name: 'Self Healing', endpoint: '/api/self-heal', schedule_cron: '*/15 * * * *', interval_minutes: 15, enabled: true, priority: 1, timeout_ms: 60000, retry_count: 2 },
];

// =============================================================================
// LOCK MANAGEMENT
// =============================================================================

async function acquireLock(supabase: any, lockName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('cron_locks')
      .upsert({
        lock_name: lockName,
        acquired_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      }, { onConflict: 'lock_name' });
    
    return !error;
  } catch {
    return true; // Proceed without lock if table doesn't exist
  }
}

async function releaseLock(supabase: any, lockName: string): Promise<void> {
  try {
    await supabase
      .from('cron_locks')
      .delete()
      .eq('lock_name', lockName);
  } catch {
    // Ignore lock release errors
  }
}

// =============================================================================
// JOB EXECUTION
// =============================================================================

function shouldRunJob(job: AutonomousJob, now: Date): boolean {
  if (!job.enabled) return false;
  if (!job.last_run_at) return true;
  
  const lastRun = new Date(job.last_run_at);
  const minutesSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60);
  return minutesSinceLastRun >= job.interval_minutes;
}

async function executeJob(
  job: AutonomousJob, 
  baseUrl: string,
  supabase: any
): Promise<{ success: boolean; duration_ms: number; error?: string; response_code?: number }> {
  const startTime = Date.now();
  
  try {
    const url = job.endpoint.startsWith('http') ? job.endpoint : `${baseUrl}${job.endpoint}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), job.timeout_ms);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cron-Dispatcher': 'true',
        'X-Job-Id': job.id,
        'X-Job-Name': job.name,
      },
      body: JSON.stringify({ triggered_by: 'dispatcher', job_id: job.id }),
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    const duration = Date.now() - startTime;
    const success = response.ok;
    
    return {
      success,
      duration_ms: duration,
      response_code: response.status,
      error: success ? undefined : `HTTP ${response.status}`,
    };
    
  } catch (error: any) {
    return {
      success: false,
      duration_ms: Date.now() - startTime,
      error: error.name === 'AbortError' ? 'Timeout' : error.message,
    };
  }
}

async function logJobRun(
  supabase: any,
  job: AutonomousJob,
  result: { success: boolean; duration_ms: number; error?: string; response_code?: number }
): Promise<void> {
  try {
    // Update autonomous_jobs table
    await supabase
      .from('autonomous_jobs')
      .upsert({
        id: job.id,
        name: job.name,
        endpoint: job.endpoint,
        interval_minutes: job.interval_minutes,
        enabled: job.enabled,
        last_run_at: new Date().toISOString(),
        last_status: result.success ? 'success' : 'failed',
        last_duration_ms: result.duration_ms,
        last_error: result.error,
        run_count: supabase.sql`COALESCE(run_count, 0) + 1`,
      }, { onConflict: 'id' });
    
    // Insert into job_runs
    await supabase
      .from('job_runs')
      .insert({
        job_id: job.id,
        job_name: job.name,
        status: result.success ? 'success' : 'failed',
        duration_ms: result.duration_ms,
        response_code: result.response_code,
        error_message: result.error,
        created_at: new Date().toISOString(),
      });
      
  } catch (error) {
    console.error('Failed to log job run:', error);
  }
}

// =============================================================================
// MAIN DISPATCH HANDLER
// =============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const now = new Date();
  const baseUrl = new URL(request.url).origin;
  
  const supabase = getSupabase();
  const lockName = 'cron_dispatch';
  
  // Acquire lock to prevent concurrent dispatch
  if (supabase && !await acquireLock(supabase, lockName)) {
    return NextResponse.json({
      success: false,
      error: 'Dispatch already running',
      timestamp: now.toISOString(),
    }, { status: 409 });
  }
  
  try {
    let jobs: AutonomousJob[] = FALLBACK_JOBS;
    
    // Try to get jobs from DB
    if (supabase) {
      const { data, error } = await supabase
        .from('autonomous_jobs')
        .select('*')
        .eq('enabled', true)
        .order('priority', { ascending: true });
      
      if (!error && data && data.length > 0) {
        jobs = data;
      }
    }
    
    const results: any[] = [];
    let executed = 0;
    let skipped = 0;
    let failed = 0;
    
    // Execute jobs that are due
    for (const job of jobs) {
      if (!shouldRunJob(job, now)) {
        skipped++;
        results.push({ job: job.name, status: 'skipped', reason: 'not_due' });
        continue;
      }
      
      executed++;
      const result = await executeJob(job, baseUrl, supabase);
      
      results.push({
        job: job.name,
        status: result.success ? 'success' : 'failed',
        duration_ms: result.duration_ms,
        response_code: result.response_code,
        error: result.error,
      });
      
      if (!result.success) failed++;
      
      // Log to DB
      if (supabase) {
        await logJobRun(supabase, job, result);
      }
    }
    
    // Log dispatch summary
    if (supabase) {
      await supabase.from('cron_logs').insert({
        dispatcher: 'central',
        executed_at: now.toISOString(),
        duration_ms: Date.now() - startTime,
        jobs_executed: executed,
        jobs_skipped: skipped,
        jobs_failed: failed,
        results: JSON.stringify(results),
      });
    }
    
    return NextResponse.json({
      success: failed === 0,
      timestamp: now.toISOString(),
      duration_ms: Date.now() - startTime,
      summary: {
        total: jobs.length,
        executed,
        skipped,
        failed,
      },
      results,
    });
    
  } finally {
    if (supabase) {
      await releaseLock(supabase, lockName);
    }
  }
}

// POST for manual trigger
export async function POST(request: NextRequest) {
  return GET(request);
}
