// app/api/admin/test-supabase-token/route.ts
// TEMPORARY DEBUG ENDPOINT — DELETE AFTER TOKEN CONFIRMED
// Tests whether SUPABASE_SERVICE_ROLE_KEY is accepted by the Supabase Management API.
// Does NOT log or store the token value — only logs success/failure status.
// Created: April 27, 2026

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PROJECT_REF = 'kteobfyferrukqeolofj'

function withCors(res: NextResponse): NextResponse {
  res.headers.set('Access-Control-Allow-Origin',  '*')
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'x-admin-secret, Content-Type')
  return res
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 200 }))
}

export async function POST(req: NextRequest) {
  // Same secret gate as migrate route
  const provided = req.headers.get('x-admin-secret') ?? ''
  const expected = process.env.ADMIN_MIGRATION_SECRET ?? 'ZMcwZVo0nLQ4PKjMeEbxHqupvT3lJWX-YuASRWDsMm0'

  if (!provided || provided !== expected) {
    return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN

  if (!accessToken) {
    return withCors(NextResponse.json({
      success: false,
      status:  null,
      body:    'SUPABASE_ACCESS_TOKEN is not set in environment',
      keyPresent: false,
    }))
  }

  // Probe the Management API with a trivial query — no DDL, no side effects
  let probeStatus: number | null = null
  let probeBody   = ''

  try {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ query: 'select 1;' }),
      }
    )
    probeStatus = res.status
    probeBody   = await res.text()
  } catch (err) {
    return withCors(NextResponse.json({
      success:    false,
      status:     null,
      body:       `fetch threw: ${err instanceof Error ? err.message : String(err)}`,
      keyPresent: true,
    }))
  }

  const success = probeStatus >= 200 && probeStatus < 300

  // Log result without exposing token value
  console.log(`[test-supabase-token] status=${probeStatus} success=${success} keySource=SUPABASE_ACCESS_TOKEN`)

  return withCors(NextResponse.json({
    success,
    status:     probeStatus,
    body:       probeBody,
    keyPresent: true,
  }))
}

export async function GET()    { return withCors(NextResponse.json({ error: 'POST only' }, { status: 405 })) }
export async function PUT()    { return withCors(NextResponse.json({ error: 'POST only' }, { status: 405 })) }
export async function DELETE() { return withCors(NextResponse.json({ error: 'POST only' }, { status: 405 })) }
