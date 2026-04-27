// app/api/admin/migrate/route.ts
// ONE-TIME MIGRATION ROUTE — DELETE AFTER SUCCESSFUL RUN
// Creates javari_team_executions, javari_team_execution_tasks,
// javari_autonomy_tasks, and decrement_user_credits() in Supabase.
//
// SECURITY: Requires x-admin-secret header matching ADMIN_MIGRATION_SECRET env var.
// If env var is not set, falls back to the hardcoded constant below.
// NO dynamic SQL input accepted. SQL is hardcoded — no injection surface.
//
// SELF-DESTRUCT NOTICE: After confirming tables exist, delete this file.
// Created: April 27, 2026

import { NextRequest, NextResponse } from 'next/server'
import { createClient }             from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// ─────────────────────────────────────────────────────────────────────────────
// Secret — checked against env var first, falls back to hardcoded constant.
// This route does nothing if the wrong secret is supplied.
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_SECRET = 'ZMcwZVo0nLQ4PKjMeEbxHqupvT3lJWX-YuASRWDsMm0'

// ─────────────────────────────────────────────────────────────────────────────
// Migration SQL — hardcoded, no user input accepted
// ─────────────────────────────────────────────────────────────────────────────

const MIGRATION_STEPS = [
  {
    label: 'create javari_team_executions',
    sql: `
      create table if not exists public.javari_team_executions (
        id           uuid primary key default gen_random_uuid(),
        plan_id      text        not null,
        status       text        not null default 'running'
                     check (status in ('running','complete','partial','failed','aborting')),
        total_cost   numeric     not null default 0,
        created_at   timestamptz not null default now(),
        finalized_at timestamptz
      )
    `,
  },
  {
    label: 'create javari_team_execution_tasks',
    sql: `
      create table if not exists public.javari_team_execution_tasks (
        id           uuid primary key default gen_random_uuid(),
        execution_id uuid        not null references public.javari_team_executions(id) on delete cascade,
        task_id      text        not null,
        role         text        not null,
        status       text        not null,
        cost_used    numeric     not null default 0,
        output       text,
        error        text,
        started_at   timestamptz not null,
        completed_at timestamptz not null
      )
    `,
  },
  {
    label: 'create index idx_execution_tasks_execution_id',
    sql: `
      create index if not exists idx_execution_tasks_execution_id
        on public.javari_team_execution_tasks(execution_id)
    `,
  },
  {
    label: 'add unique_execution_task constraint',
    sql: `
      do $$ begin
        if not exists (
          select 1 from pg_constraint
          where conname = 'unique_execution_task'
        ) then
          alter table public.javari_team_execution_tasks
            add constraint unique_execution_task
            unique (execution_id, task_id);
        end if;
      end $$
    `,
  },
  {
    label: 'create javari_autonomy_tasks',
    sql: `
      create table if not exists public.javari_autonomy_tasks (
        id         uuid primary key default gen_random_uuid(),
        user_id    uuid not null references auth.users(id) on delete cascade,
        parent_id  uuid references public.javari_autonomy_tasks(id) on delete set null,
        plan       jsonb not null,
        status     text not null default 'pending'
                   check (status in ('pending','running','complete','failed','pending_approval','skipped')),
        priority   integer not null default 5,
        cost_used  numeric not null default 0,
        error      text,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `,
  },
  {
    label: 'create index idx_autonomy_tasks_user_status',
    sql: `
      create index if not exists idx_autonomy_tasks_user_status
        on public.javari_autonomy_tasks(user_id, status, priority, created_at)
    `,
  },
  {
    label: 'create decrement_user_credits function',
    sql: `
      create or replace function public.decrement_user_credits(
        p_user_id uuid,
        p_amount   integer
      ) returns void language plpgsql security definer as $$
      begin
        update public.user_credits
           set balance        = greatest(balance - p_amount, 0),
               updated_at     = now()
         where user_id = p_user_id;
      end;
      $$
    `,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/migrate
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const provided = req.headers.get('x-admin-secret') ?? ''
  const expected = process.env.ADMIN_MIGRATION_SECRET ?? FALLBACK_SECRET

  if (!provided || provided !== expected) {
    console.log('[migrate] rejected — invalid or missing x-admin-secret')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Supabase admin client ──────────────────────────────────────────────────
  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({
      error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    }, { status: 500 })
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  // ── Run migration steps ────────────────────────────────────────────────────
  const results: { label: string; ok: boolean; error?: string }[] = []

  for (const step of MIGRATION_STEPS) {
    try {
      const { error } = await db.rpc('exec_sql', { sql: step.sql }).maybeSingle()
        .catch(() => ({ error: null }))   // exec_sql may not exist — fall through

      if (error) {
        // Try via raw query using pg REST trick
        const res = await fetch(
          `${supabaseUrl}/rest/v1/rpc/exec_sql`,
          {
            method: 'POST',
            headers: {
              'Content-Type':  'application/json',
              apikey:          serviceRoleKey,
              Authorization:   `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ sql: step.sql }),
          }
        )
        if (!res.ok) throw new Error(`RPC exec_sql not available: ${res.status}`)
      }
      results.push({ label: step.label, ok: true })
    } catch (err) {
      // exec_sql RPC doesn't exist — use pg directly via Supabase Management API
      results.push({ label: step.label, ok: false, error: String(err) })
    }
  }

  // exec_sql doesn't exist — use Management API SQL endpoint
  const mgmtResults: { label: string; ok: boolean; error?: string }[] = []
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase/)?.[1]

  for (const step of MIGRATION_STEPS) {
    try {
      const res = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            Authorization:   `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ query: step.sql }),
        }
      )
      const body = await res.json()
      if (!res.ok) {
        mgmtResults.push({ label: step.label, ok: false, error: JSON.stringify(body).slice(0, 200) })
      } else {
        mgmtResults.push({ label: step.label, ok: true })
      }
    } catch (err) {
      mgmtResults.push({ label: step.label, ok: false, error: String(err) })
    }
  }

  // ── Verify tables exist ────────────────────────────────────────────────────
  const verifyRes = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        query: `
          select table_name
          from information_schema.tables
          where table_schema = 'public'
            and table_name in (
              'javari_team_executions',
              'javari_team_execution_tasks',
              'javari_autonomy_tasks'
            )
          order by table_name
        `,
      }),
    }
  )

  const verifyBody = await verifyRes.json()
  const tables: string[] = verifyRes.ok
    ? (verifyBody as Array<{ table_name: string }>).map(r => r.table_name)
    : []

  const allTablesExist = [
    'javari_team_executions',
    'javari_team_execution_tasks',
    'javari_autonomy_tasks',
  ].every(t => tables.includes(t))

  console.log('[migrate] steps:', mgmtResults)
  console.log('[migrate] tables verified:', tables)

  if (allTablesExist) {
    console.log('[migrate] SUCCESS — DELETE THIS ROUTE AFTER CONFIRMATION')
  }

  return NextResponse.json({
    success:       allTablesExist,
    tables,
    steps:         mgmtResults,
    allTablesExist,
    message:       allTablesExist
      ? 'Migration complete — DELETE THIS ROUTE NOW'
      : 'Migration incomplete — check steps for errors',
    projectRef,
  })
}

// Block all other methods
export async function GET()    { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }) }
export async function PUT()    { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }) }
export async function DELETE() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }) }
