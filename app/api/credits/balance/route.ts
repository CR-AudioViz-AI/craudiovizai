// app/api/credits/balance/route.ts
// Compute credit balance from usage_ledger — not profiles.credits_balance.
// usage_count > 0 = grant, usage_count < 0 = deduction. Net = total balance.
// Updated: March 22, 2026
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const ALLOWED = [
  'https://craudiovizai.com', 'https://www.craudiovizai.com',
  'https://javariai.com', 'http://localhost:3000', 'http://localhost:3001',
]

function cors(origin: string | null): Record<string, string> {
  const ok = ALLOWED.some(o => origin?.startsWith(o)) || origin?.endsWith('.vercel.app')
  if (!ok || !origin) return {}
  return {
    'Access-Control-Allow-Origin':      origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods':     'GET, OPTIONS',
    'Access-Control-Allow-Headers':     'Content-Type, Authorization',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(req.headers.get('origin')) })
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin')
  const ch     = cors(origin)

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401, headers: ch })
    }

    const token    = authHeader.slice(7)
    const supabase = db()

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: ch })
    }

    const userId = user.id

    // Read all credit rows from usage_ledger
    const { data: rows, error: ledgerErr } = await supabase
      .from('usage_ledger')
      .select('usage_count, created_at')
      .eq('user_id', userId)
      .eq('feature', 'credits')

    if (ledgerErr) {
      return NextResponse.json({ error: ledgerErr.message }, { status: 500, headers: ch })
    }

    // Net balance: grants positive, deductions negative
    let netBalance    = 0
    let usedThisMonth = 0
    const monthStart  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()

    for (const row of rows ?? []) {
      const n = row.usage_count ?? 0
      netBalance = netBalance + n
      if (new Date(row.created_at).getTime() >= monthStart && n < 0) {
        usedThisMonth = usedThisMonth + Math.abs(n)
      }
    }

    const total = Math.max(0, netBalance)

    // Plan lookup — best effort
    let plan             = 'free'
    let monthlyAllowance = 25

    const { data: sub } = await supabase
      .from('user_subscriptions')
      .select('plan_tier, status')
      .eq('user_id', userId)
      .eq('provider', 'stripe')
      .eq('status', 'active')
      .maybeSingle()

    if (sub?.plan_tier) {
      plan = sub.plan_tier
      const allowances: Record<string, number> = {
        starter: 150, pro: 600, power: 2500, premium: 2500,
      }
      monthlyAllowance = allowances[plan] ?? 25
    }

    // Admin check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (profile?.role === 'admin') {
      return NextResponse.json({
        total: 999999, used_this_month: 0, monthly_allowance: 999999,
        plan: 'admin', is_admin: true,
      }, { headers: ch })
    }

    return NextResponse.json({
      total,
      used_this_month:   usedThisMonth,
      monthly_allowance: monthlyAllowance,
      plan,
      is_admin:          false,
      ledger_rows:       (rows ?? []).length,
    }, { headers: ch })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500, headers: cors(origin) })
  }
}
