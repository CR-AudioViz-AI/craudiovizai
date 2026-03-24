// app/api/vault/seed/route.ts
// CR AudioViz AI — ONE-TIME vault seeder. Self-contained, no external imports.
// Reads STRIPE_SECRET_KEY from process.env, encrypts it, stores in Supabase vault,
// then verifies the round-trip. DELETE THIS FILE after first successful run.
// Protected by x-vault-test-secret header.
// March 22, 2026

import { NextRequest, NextResponse } from 'next/server'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime  = 'nodejs'

// ── Inline AES-256-GCM (no import from lib/security — not deployed yet) ───────
function getMasterKey(): Buffer {
  const raw = process.env.VAULT_MASTER_KEY
  if (!raw) throw new Error('VAULT_MASTER_KEY not set')
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex')
  if (raw.length === 32)               return Buffer.from(raw, 'utf8')
  throw new Error(`VAULT_MASTER_KEY wrong length: ${raw.length}`)
}

function encrypt(plaintext: string): string {
  const key = getMasterKey()
  const iv  = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag   = cipher.getAuthTag()
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':')
}

function decrypt(envelope: string): string {
  const parts = envelope.split(':')
  if (parts.length !== 3) throw new Error('Bad envelope format')
  const key       = getMasterKey()
  const iv        = Buffer.from(parts[0], 'base64')
  const authTag   = Buffer.from(parts[1], 'base64')
  const encrypted = Buffer.from(parts[2], 'base64')
  const decipher  = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

function mask(v: string): string {
  return v.slice(0, 12) + '...'
}

// ── Auth guard ────────────────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const secret   = req.headers.get('x-vault-test-secret')
  const expected = process.env.VAULT_TEST_SECRET ?? process.env.NEXTAUTH_SECRET
  return !!expected && secret === expected
}

// ── Supabase client ───────────────────────────────────────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result: Record<string, unknown> = {
    env_key_prefix:  null,
    vault_write:     'fail',
    vault_read:      'fail',
    api_test:        'skip',
    next_step_ready: false,
    errors:          [] as string[],
  }

  const errors = result.errors as string[]

  // ── STEP 1: Read STRIPE_SECRET_KEY from env ────────────────────────────────
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    errors.push('STRIPE_SECRET_KEY not found in process.env')
    return NextResponse.json(result)
  }

  const prefix = stripeKey.startsWith('sk_live_') ? 'sk_live_'
               : stripeKey.startsWith('sk_test_') ? 'sk_test_'
               : stripeKey.slice(0, 8)
  result.env_key_prefix = prefix

  // ── STEP 2: Encrypt ────────────────────────────────────────────────────────
  let encrypted: string
  try {
    encrypted = encrypt(stripeKey)
  } catch (err) {
    errors.push(`Encryption failed: ${(err as Error).message}`)
    return NextResponse.json(result)
  }

  // ── STEP 3: Write to vault ─────────────────────────────────────────────────
  const supabase = getSupabase()
  const { error: writeErr } = await supabase.rpc('set_platform_secret', {
    p_key:         'STRIPE_SECRET_KEY',
    p_value_encrypted: encrypted,
    p_description: 'Stripe secret key (vault-managed) — seeded ' + new Date().toISOString(),
  })

  if (writeErr) {
    errors.push(`Vault write failed: ${writeErr.message}`)
    return NextResponse.json(result)
  }
  result.vault_write = 'success'

  // ── STEP 4: Read back and verify ───────────────────────────────────────────
  const { data: rawEnc, error: readErr } = await supabase.rpc('get_platform_secret', {
    p_key: 'STRIPE_SECRET_KEY',
  })

  if (readErr) {
    errors.push(`Vault read failed: ${readErr.message}`)
    return NextResponse.json(result)
  }

  let decrypted: string
  try {
    decrypted = decrypt(rawEnc as string)
  } catch (err) {
    errors.push(`Decryption failed: ${(err as Error).message}`)
    return NextResponse.json(result)
  }

  if (!decrypted.startsWith('sk_')) {
    errors.push(`Decrypted value does not start with 'sk_' — got prefix: ${decrypted.slice(0,4)}`)
    return NextResponse.json(result)
  }

  if (decrypted !== stripeKey) {
    errors.push('Round-trip failed: decrypted value does not match original')
    return NextResponse.json(result)
  }

  result.vault_read = 'success'

  // ── STEP 5: Call vault test endpoint ──────────────────────────────────────
  try {
    const vaultTestSecret = process.env.VAULT_TEST_SECRET ?? ''
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://craudiovizai.com'
    const res = await fetch(`${origin}/api/vault/test`, {
      headers: { 'x-vault-test-secret': vaultTestSecret },
    })
    const data = await res.json()
    result.api_test = data.success ? 'success' : 'fail'
    result.vault_test_response = {
      vault_connected:  data.vault_connected,
      has_stripe_key:   data.has_stripe_key,
      stripe_key_prefix: data.stripe_key_prefix,
      keys_in_vault:    data.keys_in_vault,
      master_key_set:   data.master_key_set,
    }
  } catch (err) {
    result.api_test = 'fail'
    errors.push(`Vault test endpoint error: ${(err as Error).message}`)
  }

  result.next_step_ready = result.vault_write === 'success' && result.vault_read === 'success'

  return NextResponse.json(result, { status: 200 })
}
