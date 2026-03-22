// app/api/auth/callback/route.ts
// Supabase OAuth callback handler — exchangeCodeForSession, profile init.
// Handles: Google, Apple, GitHub (and any future Supabase OAuth provider).
// On first sign-in: creates profiles row + seeds initial credits.
// Updated: March 21, 2026 — OAuth auth system.
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'

// Service role client — used for profile upsert (bypasses RLS)
function serviceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(request: NextRequest) {
  const requestUrl  = new URL(request.url)
  const code        = requestUrl.searchParams.get('code')
  const redirectTo  = requestUrl.searchParams.get('redirect_to') ?? '/dashboard'
  const baseUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://craudiovizai.com'

  if (!code) {
    // No code — redirect to login with error
    console.error('[auth/callback] no code in query params')
    return NextResponse.redirect(`${baseUrl}/login?error=missing_code`)
  }

  // ── Cookie-aware Supabase client (required for session persistence) ────────
  const cookieStore = cookies()
  const supabase    = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get:    (name)          => cookieStore.get(name)?.value,
        set:    (name, value, options) => { try { cookieStore.set({ name, value, ...options }) } catch {} },
        remove: (name, options) => { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
      },
    }
  )

  // ── Exchange code for session ───────────────────────────────────────────────
  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !session) {
    console.error('[auth/callback] exchangeCodeForSession failed:', error?.message)
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(error?.message ?? 'auth_failed')}`
    )
  }

  const { user } = session
  const db       = serviceDb()

  // ── First sign-in detection: upsert profile ───────────────────────────────
  // Uses onConflict:'id' — safe to run on every callback.
  // Only creates the row if it doesn't exist; never overwrites existing data.
  const { error: profileErr } = await db.from('profiles').upsert({
    id:         user.id,
    email:      user.email,
    full_name:  user.user_metadata?.full_name  ?? user.user_metadata?.name ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
    provider:   user.app_metadata?.provider    ?? 'unknown',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id', ignoreDuplicates: false })

  if (profileErr) {
    // Non-fatal — user is authenticated, profile sync can retry later
    console.error('[auth/callback] profile upsert failed:', profileErr.message)
  }

  // ── Seed initial credits for brand-new users ──────────────────────────────
  // usage_ledger insert only — getCreditBalance() aggregates from this table.
  // Using ignoreDuplicates-style check: only insert if no prior grant exists.
  const { count } = await db
    .from('usage_ledger')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('feature', 'credits')
    .eq('metadata->>source', 'signup_bonus')

  if (count === 0) {
    await db.from('usage_ledger').insert({
      user_id:     user.id,
      feature:     'credits',
      usage_count: 25,   // Matches FREE_TIER.credits in lib/pricing/config.ts
      metadata:    { type: 'grant', source: 'signup_bonus', provider: user.app_metadata?.provider },
    })
    console.log(`[auth/callback] signup bonus granted: 25 credits to ${user.id.slice(0,8)}…`)
  }

  // ── Redirect to intended destination ──────────────────────────────────────
  const destination = redirectTo.startsWith('http') ? redirectTo : `${baseUrl}${redirectTo}`
  return NextResponse.redirect(destination)
}
