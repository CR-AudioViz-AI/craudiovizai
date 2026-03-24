// app/api/vault/test/route.ts
// CR AudioViz AI — Vault health check endpoint.
// ADMIN ONLY — checks vault connectivity and key presence without exposing values.
// Returns: { success, vault_connected, hasStripeKey, keys_in_vault, cache_stats }
//
// March 22, 2026

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { cacheStats }                from '@/lib/vault/getSecret'
import { maskSecret }                from '@/lib/security/encryption'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Simple admin guard — must pass internal secret header or be Roy's account
function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get('x-vault-test-secret')
  const expected = process.env.VAULT_TEST_SECRET ?? process.env.NEXTAUTH_SECRET
  return !!expected && secret === expected
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  // ── 1. Check vault connectivity ────────────────────────────────────────────
  let vault_connected  = false
  let keys_in_vault:   string[] = []
  let vault_error:     string | null = null
  let hasStripeKey     = false
  let stripeKeyPrefix: string | null = null

  if (!url || !key) {
    vault_error = 'SUPABASE bootstrap env vars not set'
  } else {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false } })

      // List all key names (no values) via the SECURITY DEFINER RPC
      const { data: keyList, error: listErr } = await supabase.rpc('list_platform_secret_keys')
      if (listErr) {
        vault_error = `list_platform_secret_keys RPC failed: ${listErr.message}`
      } else {
        vault_connected = true
        keys_in_vault   = (keyList as Array<{ key: string }>).map(r => r.key)

        // Check STRIPE_SECRET_KEY specifically
        const hasStripe = keys_in_vault.includes('STRIPE_SECRET_KEY')
        hasStripeKey    = hasStripe

        if (hasStripe) {
          // Fetch and partially reveal prefix (sk_live_ or sk_test_)
          const { data: rawEnc, error: fetchErr } = await supabase.rpc('get_platform_secret', {
            p_key: 'STRIPE_SECRET_KEY'
          })
          if (!fetchErr && rawEnc) {
            try {
              const { decrypt } = await import('@/lib/security/encryption')
              const plain       = decrypt(rawEnc as string)
              stripeKeyPrefix   = plain.slice(0, 12) + '...'
            } catch {
              stripeKeyPrefix = '(decrypt failed — check VAULT_MASTER_KEY)'
            }
          }
        }
      }
    } catch (err: unknown) {
      vault_error = `Vault connection error: ${(err as Error).message}`
    }
  }

  // ── 2. Check VAULT_MASTER_KEY is set ──────────────────────────────────────
  const masterKeySet    = !!process.env.VAULT_MASTER_KEY
  const masterKeyLength = process.env.VAULT_MASTER_KEY?.length ?? 0

  // ── 3. Cache stats ─────────────────────────────────────────────────────────
  const cache = cacheStats()

  return NextResponse.json({
    success:          vault_connected && !vault_error,
    vault_connected,
    vault_error,
    master_key_set:   masterKeySet,
    master_key_length: masterKeyLength,
    has_stripe_key:   hasStripeKey,
    stripe_key_prefix: stripeKeyPrefix,
    keys_in_vault,
    cache_stats:       cache,
    env_stripe_set:   !!process.env.STRIPE_SECRET_KEY,
    timestamp:        new Date().toISOString(),
  })
}
