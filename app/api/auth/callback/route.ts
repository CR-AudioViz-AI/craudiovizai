// app/api/auth/callback/route.ts
// Supabase OAuth callback handler — exchangeCodeForSession, profile init.
// Handles: Google, Apple, GitHub (and any future Supabase OAuth provider).
// On first sign-in: creates profiles row + seeds initial credits.
// Updated: March 22, 2026 — Signup bonus uses count-based idempotency, not JSONB filter.
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'

// Service role client — bypasses RLS for profile upsert and credit grant
function serviceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code       = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect_to') ?? '/dashboard'
  const baseUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://craudiovizai.com'

  if (!code) {
    console.error('[auth/callback] no code in query params')
    return NextResponse.redirect(`${baseUrl}/login?error=missing_code`)
  }

  // ── Cookie-aware client — required for session persistence ────────────
  const cookieStore = cookies()
  const supabase    = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get:    (name: string)                           => cookieStore.get(name)?.value,
        set:    (name: string, value: string, options: CookieOptions) => { try { cookieStore.set({ name, value, ...options }) } catch {} },
        remove: (name: string, options: CookieOptions)  => { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
      },
    }
  )

  // ── Exchange code for session ──────────────────────────────────────────
  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !session) {
    console.error('[auth/callback] exchangeCodeForSession failed:', error?.message)
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(error?.message ?? 'auth_failed')}`
    )
  }

  const { user } = session
  const db       = serviceDb()

  // ── Profile upsert — safe on every callback ────────────────────────────
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
    console.error('[auth/callback] profile upsert failed:', profileErr.message)
  }

  // ── Signup bonus — idempotent, no JSONB filter ────────────────────────
  // Count ALL credit grant rows for this user (usage_count > 0).
  // If zero exist: this is a brand-new user — grant 25 credits.
  // If any exist: user already has credits — skip (covers retry + re-login).
  // Does NOT rely on JSONB operators which require specific column config.
  const { count: existingCredits, error: countErr } = await db
    .from('usage_ledger')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('feature', 'credits')
    .gt('usage_count', 0)

  if (countErr) {
    console.error('[auth/callback] credit count check failed:', countErr.message)
  } else if (existingCredits === 0) {
    const { error: insertErr } = await db.from('usage_ledger').insert({
      user_id:     user.id,
      feature:     'credits',
      usage_count: 25,
      metadata:    { type: 'grant', source: 'signup_bonus', provider: user.app_metadata?.provider ?? 'unknown' },
    })
    if (insertErr) {
      console.error('signup_bonus_failed', { userId: user.id.slice(0, 8), error: insertErr.message })
    } else {
      console.log('signup_bonus_granted', { userId: user.id.slice(0, 8), credits: 25 })
    }
  } else {
    console.log('signup_bonus_skipped', { userId: user.id.slice(0, 8), existing: existingCredits })
  }

  // ── Redirect ───────────────────────────────────────────────────────────
  const destination = redirectTo.startsWith('http') ? redirectTo : `${baseUrl}${redirectTo}`
  return NextResponse.redirect(destination)
}
