// lib/vault/getSecret.ts
// CR AudioViz AI — Platform Secret Authority: Read Path
// SERVER-SIDE ONLY. Never import from client components.
//
// Lookup order:
//   1. In-process LRU cache (TTL: VAULT_CACHE_TTL_MS, default 5 min)
//   2. Supabase get_platform_secret(key) SECURITY DEFINER RPC
//      → decrypt with AES-256-GCM via lib/security/encryption
//   3. process.env[key] fallback (transition period — logs VAULT_FALLBACK_USED warning)
//
// getSecret(key) throws if:
//   - key not in vault AND not in process.env
//   - decryption fails
//   - Supabase is unreachable AND process.env has no value
//
// March 22, 2026

import { createClient } from '@supabase/supabase-js'
import { decrypt, maskSecret } from '@/lib/security/encryption'

// ── Types ─────────────────────────────────────────────────────────────────────
interface CacheEntry {
  value:     string
  expiresAt: number
}

// ── In-process cache ──────────────────────────────────────────────────────────
const _cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = parseInt(process.env.VAULT_CACHE_TTL_MS ?? '300000', 10) // 5 min

function cacheGet(key: string): string | null {
  const entry = _cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key)
    return null
  }
  return entry.value
}

function cacheSet(key: string, value: string): void {
  _cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
}

export function cacheInvalidate(key?: string): void {
  if (key) _cache.delete(key)
  else _cache.clear()
}

export function cacheStats(): { size: number; keys: string[] } {
  return { size: _cache.size, keys: Array.from(_cache.keys()) }
}

// ── Supabase service-role client (bootstrap from process.env — required) ──────
// These specific keys ALWAYS come from process.env to bootstrap the vault.
// They cannot be stored in the vault (chicken-and-egg).
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Vault bootstrap failed: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. ' +
      'These must always be in Vercel environment variables.'
    )
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

// ── DB fetch via SECURITY DEFINER RPC ────────────────────────────────────────
async function fetchFromVault(key: string): Promise<string | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc('get_platform_secret', { p_key: key })

  if (error) {
    // Key not found is a known error — let caller decide
    if (error.message?.includes('key not found')) return null
    throw new Error(`Vault RPC failed for key "${key}": ${error.message}`)
  }

  if (!data) return null

  // data is the encrypted envelope string — decrypt it
  const plaintext = decrypt(data as string)
  return plaintext
}

// ── process.env fallback ───────────────────────────────────────────────────────
// Used during the transition period while keys are being migrated to the vault.
// Logs a structured warning so you can track which keys still need migration.
function envFallback(key: string): string | null {
  const value = process.env[key]
  if (value) {
    console.warn(JSON.stringify({
      level:   'WARN',
      event:   'VAULT_FALLBACK_USED',
      key,
      masked:  maskSecret(value),
      message: `Key "${key}" not found in vault — using process.env fallback. Migrate this key to the vault.`,
    }))
    return value
  }
  return null
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Retrieve a secret by key.
 *
 * Lookup order: cache → vault (Supabase) → process.env fallback
 * Throws if the key is not found anywhere.
 */
export async function getSecret(key: string): Promise<string> {
  if (!key || typeof key !== 'string') {
    throw new TypeError('getSecret: key must be a non-empty string')
  }

  // 1. Cache
  const cached = cacheGet(key)
  if (cached !== null) return cached

  // 2. Vault (Supabase RPC)
  let vaultValue: string | null = null
  try {
    vaultValue = await fetchFromVault(key)
  } catch (err) {
    // Vault is unreachable — log and fall through to process.env
    console.error(JSON.stringify({
      level:   'ERROR',
      event:   'VAULT_READ_ERROR',
      key,
      message: (err as Error).message,
    }))
  }

  if (vaultValue !== null) {
    cacheSet(key, vaultValue)
    return vaultValue
  }

  // 3. process.env fallback
  const envValue = envFallback(key)
  if (envValue !== null) {
    cacheSet(key, envValue)
    return envValue
  }

  // Nothing found — throw, never return null
  throw new Error(
    `getSecret: key "${key}" not found in vault or process.env. ` +
    `Add it to the vault using set_platform_secret() or add it to Vercel env vars.`
  )
}

/**
 * Retrieve multiple secrets in parallel.
 * Returns a Record<key, value>. Throws if any key is missing.
 */
export async function getSecrets(keys: string[]): Promise<Record<string, string>> {
  const results = await Promise.all(keys.map(k => getSecret(k).then(v => [k, v] as const)))
  return Object.fromEntries(results)
}
