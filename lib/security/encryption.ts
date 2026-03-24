// lib/security/encryption.ts
// CR AudioViz AI — AES-256-GCM encryption for Platform Secret Authority.
// SERVER-SIDE ONLY. Never import from client components or browser code.
//
// Envelope format (stored in DB): base64(iv):base64(authTag):base64(ciphertext)
// Key source: VAULT_MASTER_KEY env var — 32-byte hex string (64 hex chars)
//             Generate with: openssl rand -hex 32
//
// March 22, 2026

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// ── Constants ─────────────────────────────────────────────────────────────────
const ALGORITHM   = 'aes-256-gcm' as const
const IV_BYTES    = 12   // 96-bit IV — recommended for GCM
const TAG_BYTES   = 16   // 128-bit auth tag — GCM default
const KEY_BYTES   = 32   // 256-bit key
const SEPARATOR   = ':'  // envelope delimiter

// ── Key derivation ────────────────────────────────────────────────────────────
// Reads VAULT_MASTER_KEY from process.env — the one env var that must always
// come from the environment (bootstraps the vault itself).
// Throws immediately if not set or wrong length so misconfiguration is caught
// at server startup, not silently at runtime.

let _cachedKey: Buffer | null = null

function getMasterKey(): Buffer {
  if (_cachedKey) return _cachedKey

  const raw = process.env.VAULT_MASTER_KEY
  if (!raw) {
    throw new Error(
      'VAULT_MASTER_KEY is not set. ' +
      'Generate one with: openssl rand -hex 32 ' +
      'and add it to Vercel Environment Variables.'
    )
  }

  // Accept either 64-char hex string or 32-char raw string
  let key: Buffer
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    key = Buffer.from(raw, 'hex')
  } else if (raw.length === KEY_BYTES) {
    key = Buffer.from(raw, 'utf8')
  } else {
    throw new Error(
      `VAULT_MASTER_KEY must be a 64-character hex string or 32-character raw string. ` +
      `Got length: ${raw.length}`
    )
  }

  if (key.length !== KEY_BYTES) {
    throw new Error(`VAULT_MASTER_KEY resolved to ${key.length} bytes, need ${KEY_BYTES}`)
  }

  _cachedKey = key
  return key
}

// ── Encrypt ───────────────────────────────────────────────────────────────────
// Returns: base64(iv):base64(authTag):base64(ciphertext)
// Throws if encryption fails for any reason.

export function encrypt(plaintext: string): string {
  if (typeof plaintext !== 'string') {
    throw new TypeError('encrypt: plaintext must be a string')
  }

  const key = getMasterKey()
  const iv  = randomBytes(IV_BYTES)

  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(SEPARATOR)
}

// ── Decrypt ───────────────────────────────────────────────────────────────────
// Accepts: base64(iv):base64(authTag):base64(ciphertext)
// Returns: original plaintext string
// Throws if envelope is malformed, key is wrong, or auth tag fails (tampered).

export function decrypt(envelope: string): string {
  if (typeof envelope !== 'string') {
    throw new TypeError('decrypt: envelope must be a string')
  }

  const parts = envelope.split(SEPARATOR)
  if (parts.length !== 3) {
    throw new Error(
      `decrypt: malformed envelope — expected 3 parts separated by '${SEPARATOR}', got ${parts.length}`
    )
  }

  const [ivB64, tagB64, ciphertextB64] = parts

  let iv:         Buffer
  let authTag:    Buffer
  let ciphertext: Buffer

  try {
    iv         = Buffer.from(ivB64,         'base64')
    authTag    = Buffer.from(tagB64,        'base64')
    ciphertext = Buffer.from(ciphertextB64, 'base64')
  } catch (err) {
    throw new Error(`decrypt: base64 decode failed — ${(err as Error).message}`)
  }

  if (iv.length !== IV_BYTES) {
    throw new Error(`decrypt: IV length ${iv.length} != expected ${IV_BYTES}`)
  }
  if (authTag.length !== TAG_BYTES) {
    throw new Error(`decrypt: auth tag length ${authTag.length} != expected ${TAG_BYTES}`)
  }

  const key      = getMasterKey()
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ])
    return decrypted.toString('utf8')
  } catch (err) {
    // GCM auth failure = wrong key or tampered ciphertext
    throw new Error(
      'decrypt: authentication failed — data may be tampered or key is incorrect'
    )
  }
}

// ── Mask utility (for logging) ────────────────────────────────────────────────
// Returns first 4 chars + asterisks — safe for structured logs.
export function maskSecret(value: string): string {
  if (!value || value.length < 4) return '****'
  return value.slice(0, 4) + '*'.repeat(Math.min(value.length - 4, 20))
}
