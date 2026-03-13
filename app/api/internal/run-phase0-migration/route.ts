// app/api/internal/run-phase0-migration/route.ts
// CR AudioViz AI — Phase 0 Migration Executor (ONE-SHOT)
// Friday, March 13, 2026
// ADMIN ONLY. Executes the Phase 0 SQL migration against Supabase production.
// Uses SUPABASE_ACCESS_TOKEN from vault via Supabase Management API.
// DELETE THIS FILE after migration is confirmed complete.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient }        from '@supabase/ssr'
import { cookies }                   from 'next/headers'

const ADMIN_EMAILS = [
  'royhenderson@craudiovizai.com',
  'cindyhenderson@craudiovizai.com',
  'roy@craudiovizai.com',
  'admin@craudiovizai.com',
]

const PROJECT_REF = 'kteobfyferrukqeolofj'

// Full migration SQL inline — no file I/O needed at runtime
const MIGRATION_SQL = `
-- Phase 0: SafetyOS + ComplianceOS tables
-- Idempotent: uses CREATE TABLE IF NOT EXISTS

CREATE TABLE IF NOT EXISTS moderation_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type          TEXT NOT NULL,
  app_id                TEXT,
  category              TEXT NOT NULL,
  severity              TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  action                TEXT NOT NULL CHECK (action IN ('allow','flag','block','escalate')),
  content_snippet       TEXT,
  metadata              JSONB DEFAULT '{}',
  requires_human_review BOOLEAN DEFAULT false,
  reviewed_by           UUID REFERENCES auth.users(id),
  reviewed_at           TIMESTAMPTZ,
  review_notes          TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_me_user     ON moderation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_me_category ON moderation_events(category);
CREATE INDEX IF NOT EXISTS idx_me_severity ON moderation_events(severity);
CREATE INDEX IF NOT EXISTS idx_me_review   ON moderation_events(requires_human_review) WHERE requires_human_review = true;
ALTER TABLE moderation_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "srole_me" ON moderation_events FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS safety_reports (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_content_id  UUID,
  content_type         TEXT NOT NULL,
  category             TEXT NOT NULL,
  description          TEXT NOT NULL,
  evidence             JSONB DEFAULT '{}',
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','dismissed')),
  assigned_to          UUID REFERENCES auth.users(id),
  resolution_notes     TEXT,
  resolved_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sr_reporter ON safety_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_sr_status   ON safety_reports(status);
ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "srole_sr"    ON safety_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
  CREATE POLICY "user_sr_sel" ON safety_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS dmca_notices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claimant_name  TEXT NOT NULL,
  claimant_email TEXT NOT NULL,
  copyright_work TEXT NOT NULL,
  infringing_url TEXT NOT NULL,
  statement      TEXT NOT NULL,
  signature      TEXT NOT NULL,
  ip_address     TEXT,
  case_number    TEXT NOT NULL UNIQUE,
  status         TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','reviewing','actioned','dismissed','counter_filed')),
  actioned_at    TIMESTAMPTZ,
  action_notes   TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dmca_case   ON dmca_notices(case_number);
CREATE INDEX IF NOT EXISTS idx_dmca_status ON dmca_notices(status);
ALTER TABLE dmca_notices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "srole_dmca" ON dmca_notices FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS user_safety_scores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  trust_level      TEXT NOT NULL DEFAULT 'new' CHECK (trust_level IN ('new','trusted','flagged','suspended','banned')),
  signal_counts    JSONB DEFAULT '{}',
  last_signal_at   TIMESTAMPTZ,
  suspension_reason TEXT,
  suspended_until  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE user_safety_scores ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "srole_uss" ON user_safety_scores FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS consent_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id      TEXT,
  purposes        JSONB NOT NULL DEFAULT '{}',
  ip_address      TEXT NOT NULL,
  user_agent      TEXT,
  consent_version TEXT NOT NULL,
  source          TEXT NOT NULL CHECK (source IN ('banner','settings','onboarding','api','withdrawal')),
  recorded_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cr_user    ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_cr_version ON consent_records(consent_version);
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "srole_cr"    ON consent_records FOR ALL TO service_role USING (true) WITH CHECK (true);
  CREATE POLICY "user_cr_sel" ON consent_records FOR SELECT TO authenticated USING (user_id = auth.uid());
  CREATE POLICY "user_cr_ins" ON consent_records FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS data_subject_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT NOT NULL,
  request_type     TEXT NOT NULL CHECK (request_type IN ('access','deletion','portability','correction','restriction','objection')),
  description      TEXT,
  ip_address       TEXT,
  case_number      TEXT NOT NULL UNIQUE,
  status           TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification','verified','in_progress','completed','rejected')),
  deadline_days    INTEGER NOT NULL DEFAULT 30,
  assigned_to      UUID REFERENCES auth.users(id),
  completion_notes TEXT,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dsr_user   ON data_subject_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dsr_case   ON data_subject_requests(case_number);
CREATE INDEX IF NOT EXISTS idx_dsr_status ON data_subject_requests(status);
ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "srole_dsr"    ON data_subject_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
  CREATE POLICY "user_dsr_sel" ON data_subject_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
  CREATE POLICY "user_dsr_ins" ON data_subject_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreditsOS: add missing columns (non-destructive)
ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS lifetime_earned     BIGINT DEFAULT 0;
ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS plan_id             TEXT DEFAULT 'free';
ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT false;
ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS next_refresh_at     TIMESTAMPTZ;
ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ DEFAULT now();
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS app_id       TEXT;
ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS operation     TEXT;

SELECT 'Phase 0 migration complete' AS result;
`

async function getSupabaseManagementToken(): Promise<string | null> {
  // Decrypt SUPABASE_ACCESS_TOKEN from vault
  // The vault uses PBKDF2(NEXTAUTH_SECRET, salt) as the AES-256-GCM key
  // NEXTAUTH_SECRET is available as process.env.NEXTAUTH_SECRET inside the running app
  const encryptedToken = process.env.SUPABASE_ACCESS_TOKEN_ENCRYPTED
    ?? process.env.NEXT_PUBLIC_SUPABASE_URL  // just to test env access
  
  // Use platform_secrets RPC to get encrypted value, then decrypt with NEXTAUTH_SECRET
  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { data } = await sb.rpc('get_platform_secret', { name: 'SUPABASE_ACCESS_TOKEN' })
  if (!data) return null
  
  // Decrypt with NEXTAUTH_SECRET
  const { subtle } = globalThis.crypto
  const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET!
  const envelope = JSON.parse(Buffer.from(data, 'base64').toString())
  const { v, salt, iv, ct } = envelope
  
  const keyMaterial = await subtle.importKey('raw', Buffer.from(NEXTAUTH_SECRET), 'PBKDF2', false, ['deriveKey'])
  const key = await subtle.deriveKey(
    { name: 'PBKDF2', salt: Buffer.from(salt, 'hex'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
  const decrypted = await subtle.decrypt(
    { name: 'AES-GCM', iv: Buffer.from(iv, 'hex') },
    key,
    Buffer.from(ct, 'hex')
  )
  return new TextDecoder().decode(decrypted)
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check — admin only
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name) => cookieStore.get(name)?.value } }
    )

    // Inline imports to avoid circular deps
    const { createServerClient } = await import('@supabase/ssr')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // 2. Decrypt management token from vault
    const managementToken = await getSupabaseManagementToken()
    if (!managementToken) {
      // Fallback: try direct env var (may be set in Vercel)
      const fallbackToken = process.env.SUPABASE_ACCESS_TOKEN
      if (!fallbackToken) {
        return NextResponse.json({ error: 'Management token not available' }, { status: 500 })
      }
    }

    const token = managementToken ?? process.env.SUPABASE_ACCESS_TOKEN!

    // 3. Execute migration via Supabase Management API
    const mgmtUrl = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`
    const mgmtResponse = await fetch(mgmtUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: MIGRATION_SQL }),
    })

    if (!mgmtResponse.ok) {
      const err = await mgmtResponse.text()
      console.error('[Migration] Management API error:', err)
      return NextResponse.json({ error: 'Migration failed', detail: err.slice(0, 500) }, { status: 500 })
    }

    const result = await mgmtResponse.json()
    console.log('[Migration] Phase 0 complete:', result)

    return NextResponse.json({
      success:   true,
      message:   'Phase 0 migration executed successfully',
      tables:    ['moderation_events','safety_reports','dmca_notices','user_safety_scores','consent_records','data_subject_requests'],
      credits:   'user_credits and credit_transactions columns updated',
      result,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Migration] Unhandled error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
