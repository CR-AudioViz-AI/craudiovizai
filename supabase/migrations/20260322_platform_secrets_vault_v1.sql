-- supabase/migrations/20260322_platform_secrets_vault_v1.sql
-- CR AudioViz AI — Platform Secret Authority: Vault v1
-- March 22, 2026
--
-- Creates platform_secrets table with:
--   - AES-256-GCM encrypted values (envelope: iv|tag|ciphertext, base64-encoded)
--   - RLS: service_role only — no public or anon access
--   - SECURITY DEFINER RPC so application never needs direct table access
--   - Access audit counter per key
--   - Idempotent (safe to run multiple times)

-- ── Enable pgcrypto if not already enabled ───────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Drop old placeholder table if it exists ──────────────────────────────────
-- (The v3 hardening references platform_secrets_v2 — we create a clean v1
--  for craudiovizai. The v2 on javari-ai is a separate concern.)

-- ── Create table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_secrets (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key              TEXT        NOT NULL UNIQUE,
  value_encrypted  TEXT        NOT NULL,         -- base64(iv:tag:ciphertext)
  description      TEXT,                          -- human-readable label, optional
  access_count     BIGINT      NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Index on key for fast lookups ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_platform_secrets_key ON platform_secrets (key);

-- ── Auto-update updated_at ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_platform_secrets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_platform_secrets_updated_at ON platform_secrets;
CREATE TRIGGER trg_platform_secrets_updated_at
  BEFORE UPDATE ON platform_secrets
  FOR EACH ROW EXECUTE FUNCTION update_platform_secrets_updated_at();

-- ── Enable RLS ────────────────────────────────────────────────────────────────
ALTER TABLE platform_secrets ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies cleanly
DROP POLICY IF EXISTS "service_role_only"        ON platform_secrets;
DROP POLICY IF EXISTS "no_public_read"           ON platform_secrets;
DROP POLICY IF EXISTS "no_anon_access"           ON platform_secrets;

-- ONLY service_role may read or write — no public, no anon, no authenticated
CREATE POLICY "service_role_only"
  ON platform_secrets
  FOR ALL
  USING     (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── SECURITY DEFINER RPC: read a secret ──────────────────────────────────────
-- Application calls this function — never queries the table directly.
-- Returns the raw encrypted envelope string. Decryption happens in app layer.
-- Increments access_count atomically.
CREATE OR REPLACE FUNCTION get_platform_secret(p_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encrypted TEXT;
BEGIN
  -- Validate input
  IF p_key IS NULL OR length(trim(p_key)) = 0 THEN
    RAISE EXCEPTION 'get_platform_secret: key must not be null or empty';
  END IF;

  -- Fetch and increment atomically
  UPDATE platform_secrets
  SET    access_count = access_count + 1
  WHERE  key = p_key
  RETURNING value_encrypted INTO v_encrypted;

  IF v_encrypted IS NULL THEN
    RAISE EXCEPTION 'get_platform_secret: key not found: %', p_key;
  END IF;

  RETURN v_encrypted;
END;
$$;

-- Revoke public execute on the RPC — only service_role can call it
REVOKE ALL ON FUNCTION get_platform_secret(TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_platform_secret(TEXT) TO service_role;

-- ── SECURITY DEFINER RPC: write/upsert a secret ───────────────────────────────
CREATE OR REPLACE FUNCTION set_platform_secret(p_key TEXT, p_encrypted TEXT, p_description TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_key IS NULL OR length(trim(p_key)) = 0 THEN
    RAISE EXCEPTION 'set_platform_secret: key must not be null or empty';
  END IF;
  IF p_encrypted IS NULL OR length(trim(p_encrypted)) = 0 THEN
    RAISE EXCEPTION 'set_platform_secret: encrypted value must not be null or empty';
  END IF;

  INSERT INTO platform_secrets (key, value_encrypted, description)
  VALUES (p_key, p_encrypted, p_description)
  ON CONFLICT (key) DO UPDATE
    SET value_encrypted = EXCLUDED.value_encrypted,
        description     = COALESCE(EXCLUDED.description, platform_secrets.description),
        updated_at      = NOW();
END;
$$;

REVOKE ALL ON FUNCTION set_platform_secret(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION set_platform_secret(TEXT, TEXT, TEXT) TO service_role;

-- ── SECURITY DEFINER RPC: list key names (no values) ─────────────────────────
CREATE OR REPLACE FUNCTION list_platform_secret_keys()
RETURNS TABLE(key TEXT, access_count BIGINT, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ps.key, ps.access_count, ps.updated_at
  FROM   platform_secrets ps
  ORDER  BY ps.key;
END;
$$;

REVOKE ALL ON FUNCTION list_platform_secret_keys() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION list_platform_secret_keys() TO service_role;
