import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// ============================================================================
// ALLOWED ORIGINS - All CR AudioViz AI satellite apps
// Updated: December 20, 2025 - Added CrochetAI
// ============================================================================
const ALLOWED_ORIGINS = [
  // Main platforms
  'https://craudiovizai.com',
  'https://www.craudiovizai.com',
  'https://javariai.com',
  'https://www.javariai.com',
  
  // Subdomains
  'https://cardverse.craudiovizai.com',
  'https://games.craudiovizai.com',
  'https://crochet.craudiovizai.com',
  'https://admin.craudiovizai.com',
  'https://api.craudiovizai.com',
  
  // Satellite apps
  'https://cravbarrels.com',
  'https://crochet-platform.vercel.app',
  'https://crav-games.vercel.app',
  'https://crav-cardverse.vercel.app',
  'https://crav-market-oracle.vercel.app',
  'https://crav-legalease.vercel.app',
  'https://crav-news-compare.vercel.app',
  'https://crav-ebook-creator.vercel.app',
  'https://crav-pdf-builder.vercel.app',
  'https://crav-logo-studio.vercel.app',
  'https://crav-social-graphics.vercel.app',
  'https://crav-music-builder.vercel.app',
  'https://crav-site-builder.vercel.app',
  'https://crav-invoice-generator.vercel.app',
  'https://crav-verifyforge.vercel.app',
  'https://crav-scrapbook.vercel.app',
  
  // Development
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
]

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  
  const response = new NextResponse(null, { status: 204 })
  
  if (ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Max-Age', '86400')
  }
  
  return response
}

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

  // Get profile with credits and role
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits_balance, plan, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Check if admin - admins get unlimited credits
  const isAdmin = profile.role === 'admin';
  
  if (isAdmin) {
    const response = NextResponse.json({
      total: 999999,
      used_this_month: 0,
      monthly_allowance: 999999,
      bonus_credits: 0,
      expires_at: null,
      is_admin: true,
      plan: 'admin',
      message: 'Unlimited credits for admin'
    });

    if (ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    return response;
  }

  // Get monthly usage for non-admins
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
    is_admin: false,
    plan: profile.plan
  })

  if (ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}
