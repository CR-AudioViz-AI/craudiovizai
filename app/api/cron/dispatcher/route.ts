// ================================================================================
// CR AUDIOVIZ AI - MASTER CRON DISPATCHER
// Single cron entry that dispatches to all scheduled tasks from database
// Eliminates cron_jobs_limits_reached errors
// ================================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const maxDuration = 300; // 5 minutes

interface CronTask {
  id: string;
  name: string;
  endpoint: string;
  schedule_minutes: number; // Run every N minutes
  last_run: string | null;
  enabled: boolean;
  priority: number;
}

// Fallback tasks if database unavailable
const FALLBACK_TASKS: CronTask[] = [
  { id: '1', name: 'warmup', endpoint: '/api/internal/warmup', schedule_minutes: 2, last_run: null, enabled: true, priority: 1 },
  { id: '2', name: 'health-check', endpoint: '/api/internal/health-check', schedule_minutes: 5, last_run: null, enabled: true, priority: 2 },
  { id: '3', name: 'cache-cleanup', endpoint: '/api/internal/cache-cleanup', schedule_minutes: 60, last_run: null, enabled: true, priority: 3 },
];

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

async function executeTask(task: CronTask, baseUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const url = task.endpoint.startsWith('http') ? task.endpoint : `${baseUrl}${task.endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Cron-Secret': process.env.CRON_SECRET || 'internal',
        'X-Task-Name': task.name
      },
      body: JSON.stringify({ triggered_by: 'dispatcher', task_id: task.id })
    });
    
    return { success: response.ok, error: response.ok ? undefined : `HTTP ${response.status}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function shouldRunTask(task: CronTask, now: Date): boolean {
  if (!task.enabled) return false;
  if (!task.last_run) return true;
  
  const lastRun = new Date(task.last_run);
  const minutesSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60);
  return minutesSinceLastRun >= task.schedule_minutes;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const now = new Date();
  const baseUrl = new URL(request.url).origin;
  
  const results: { task: string; success: boolean; error?: string; skipped?: boolean }[] = [];
  
  try {
    const supabase = getSupabase();
    let tasks: CronTask[] = FALLBACK_TASKS;
    
    // Try to get tasks from database
    if (supabase) {
      const { data, error } = await supabase
        .from('cron_tasks')
        .select('*')
        .eq('enabled', true)
        .order('priority', { ascending: true });
      
      if (!error && data && data.length > 0) {
        tasks = data;
      }
    }
    
    // Execute tasks that are due
    for (const task of tasks) {
      if (!shouldRunTask(task, now)) {
        results.push({ task: task.name, success: true, skipped: true });
        continue;
      }
      
      const result = await executeTask(task, baseUrl);
      results.push({ task: task.name, ...result });
      
      // Update last_run in database
      if (supabase && result.success) {
        await supabase
          .from('cron_tasks')
          .update({ last_run: now.toISOString() })
          .eq('id', task.id);
      }
    }
    
    // Log execution
    if (supabase) {
      await supabase.from('cron_logs').insert({
        dispatcher: 'master',
        executed_at: now.toISOString(),
        duration_ms: Date.now() - startTime,
        tasks_executed: results.filter(r => !r.skipped).length,
        tasks_skipped: results.filter(r => r.skipped).length,
        results: JSON.stringify(results)
      });
    }
    
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      duration_ms: Date.now() - startTime,
      tasks_executed: results.filter(r => !r.skipped).length,
      tasks_skipped: results.filter(r => r.skipped).length,
      results
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: now.toISOString(),
      duration_ms: Date.now() - startTime
    }, { status: 500 });
  }
}

// POST for manual trigger
export async function POST(request: NextRequest) {
  return GET(request);
}
