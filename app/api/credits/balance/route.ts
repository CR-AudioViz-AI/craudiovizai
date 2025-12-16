import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://cravbarrels.com',
  'https://cardverse.craudiovizai.com',
  'https://games.craudiovizai.com',
  'https://javariai.com',
  'http://localhost:3000',
]

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
  }

  const token = authHeader.substring(7)
  const supabase = createRouteHandlerClient({ cookies })

  // Verify token and get user
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // Get profile with credits
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits_balance, plan')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Get monthly usage
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: transactions } = await supabase
    .from('credit_transactions')
    .select('amount')
    .eq('user_id', user.id)
    .eq('transaction_type', 'spend')
    .gte('created_at', startOfMonth.toISOString())

  const usedThisMonth = Math.abs(
    (transactions || []).reduce((sum, t) => sum + t.amount, 0)
  )

  // Monthly allowance by plan
  const allowances: Record<string, number> = {
    free: 100,
    starter: 200,
    pro: 750,
    enterprise: 3000,
  }

  const response = NextResponse.json({
    total: profile.credits_balance,
    used_this_month: usedThisMonth,
    monthly_allowance: allowances[profile.plan] || 100,
    bonus_credits: Math.max(0, profile.credits_balance - (allowances[profile.plan] || 100)),
    expires_at: profile.plan === 'free' ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : null,
  })

  if (ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}
