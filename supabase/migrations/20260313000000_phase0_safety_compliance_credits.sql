-- supabase/migrations/20260313000000_phase0_safety_compliance_credits.sql
-- CR AudioViz AI — Phase 0: SafetyOS + ComplianceOS + CreditsOS tables
-- Friday, March 13, 2026
-- Run via: supabase db push  OR  Supabase dashboard SQL editor
-- All tables use UUID primary keys, RLS enabled, service_role bypass.

-- ═══════════════════════════════════════════════════════════════════════════
-- SAFETY OS TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- Moderation events: every content screening action
CREATE TABLE IF NOT EXISTS moderation_events (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type         TEXT NOT NULL,
  app_id               TEXT,
  category             TEXT NOT NULL,
  severity             TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  action               TEXT NOT NULL CHECK (action IN ('allow','flag','block','escalate')),
  content_snippet      TEXT,
  metadata             JSONB DEFAULT '{}',
  requires_human_review BOOLEAN DEFAULT false,
  reviewed_by          UUID REFERENCES auth.users(id),
  reviewed_at          TIMESTAMPTZ,
  review_notes         TEXT,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_events_user_id   ON moderation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_events_category  ON moderation_events(category);
CREATE INDEX IF NOT EXISTS idx_moderation_events_severity  ON moderation_events(severity);
CREATE INDEX IF NOT EXISTS idx_moderation_events_review    ON moderation_events(requires_human_review) WHERE requires_human_review = true;

ALTER TABLE moderation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_moderation_events"
  ON moderation_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Safety reports: user-submitted reports
CREATE TABLE IF NOT EXISTS safety_reports (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_content_id  UUID,
  content_type         TEXT NOT NULL,
  category             TEXT NOT NULL,
  description          TEXT NOT NULL,
  evidence             JSONB DEFAULT '{}',
  status               TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','reviewing','resolved','dismissed')),
  assigned_to          UUID REFERENCES auth.users(id),
  resolution_notes     TEXT,
  resolved_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_safety_reports_reporter    ON safety_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_safety_reports_reported    ON safety_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_safety_reports_status      ON safety_reports(status);
CREATE INDEX IF NOT EXISTS idx_safety_reports_category    ON safety_reports(category);

ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;
-- Users can see their own reports; service_role sees all
CREATE POLICY "users_view_own_safety_reports"
  ON safety_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());
CREATE POLICY "service_role_full_safety_reports"
  ON safety_reports FOR ALL TO service_role USING (true) WITH CHECK (true);

-- DMCA notices
CREATE TABLE IF NOT EXISTS dmca_notices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claimant_name   TEXT NOT NULL,
  claimant_email  TEXT NOT NULL,
  copyright_work  TEXT NOT NULL,
  infringing_url  TEXT NOT NULL,
  statement       TEXT NOT NULL,
  signature       TEXT NOT NULL,
  ip_address      TEXT,
  case_number     TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'received'
                  CHECK (status IN ('received','reviewing','actioned','dismissed','counter_filed')),
  actioned_at     TIMESTAMPTZ,
  action_notes    TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dmca_case_number ON dmca_notices(case_number);
CREATE INDEX IF NOT EXISTS idx_dmca_status      ON dmca_notices(status);

ALTER TABLE dmca_notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_dmca"
  ON dmca_notices FOR ALL TO service_role USING (true) WITH CHECK (true);

-- User safety scores: behavior aggregation
CREATE TABLE IF NOT EXISTS user_safety_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  trust_level     TEXT NOT NULL DEFAULT 'new'
                  CHECK (trust_level IN ('new','trusted','flagged','suspended','banned')),
  signal_counts   JSONB DEFAULT '{}',
  last_signal_at  TIMESTAMPTZ,
  suspension_reason TEXT,
  suspended_until   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_safety_scores_user_id     ON user_safety_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_safety_scores_trust_level ON user_safety_scores(trust_level);

ALTER TABLE user_safety_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_user_safety_scores"
  ON user_safety_scores FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- COMPLIANCE OS TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- Consent records: full audit trail (append-only — never delete)
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

CREATE INDEX IF NOT EXISTS idx_consent_records_user_id    ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_recorded   ON consent_records(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_records_version    ON consent_records(consent_version);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
-- Users can view and insert their own consent records; service_role full access
CREATE POLICY "users_manage_own_consent"
  ON consent_records FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_consent"
  ON consent_records FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "service_role_full_consent_records"
  ON consent_records FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Data subject requests: GDPR/CCPA rights
CREATE TABLE IF NOT EXISTS data_subject_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  request_type    TEXT NOT NULL
                  CHECK (request_type IN ('access','deletion','portability','correction','restriction','objection')),
  description     TEXT,
  ip_address      TEXT,
  case_number     TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'pending_verification'
                  CHECK (status IN ('pending_verification','verified','in_progress','completed','rejected')),
  deadline_days   INTEGER NOT NULL DEFAULT 30,
  deadline_at     TIMESTAMPTZ GENERATED ALWAYS AS (created_at + (deadline_days || ' days')::INTERVAL) STORED,
  assigned_to     UUID REFERENCES auth.users(id),
  completion_notes TEXT,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dsr_user_id    ON data_subject_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_dsr_case       ON data_subject_requests(case_number);
CREATE INDEX IF NOT EXISTS idx_dsr_status     ON data_subject_requests(status);
CREATE INDEX IF NOT EXISTS idx_dsr_deadline   ON data_subject_requests(deadline_at);

ALTER TABLE data_subject_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_view_own_dsr"
  ON data_subject_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_dsr"
  ON data_subject_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "service_role_full_dsr"
  ON data_subject_requests FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- CREDITS OS: Ensure canonical columns exist (non-destructive ALTER)
-- ═══════════════════════════════════════════════════════════════════════════

-- user_credits may already exist — add missing columns safely
DO $$ BEGIN
  ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS lifetime_earned    BIGINT DEFAULT 0;
  ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS plan_id            TEXT DEFAULT 'free';
  ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS subscription_active BOOLEAN DEFAULT false;
  ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS next_refresh_at    TIMESTAMPTZ;
  ALTER TABLE user_credits ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist at all — create it
  CREATE TABLE user_credits (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    balance             BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    lifetime_earned     BIGINT NOT NULL DEFAULT 0,
    lifetime_spent      BIGINT NOT NULL DEFAULT 0,
    plan_id             TEXT NOT NULL DEFAULT 'free',
    subscription_active BOOLEAN NOT NULL DEFAULT false,
    next_refresh_at     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
  );
END $$;

-- credit_transactions may already exist — add missing columns safely
DO $$ BEGIN
  ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS app_id      TEXT;
  ALTER TABLE credit_transactions ADD COLUMN IF NOT EXISTS operation   TEXT;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE credit_transactions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount           BIGINT NOT NULL,
    transaction_type TEXT NOT NULL,
    app_id           TEXT,
    operation        TEXT,
    description      TEXT,
    metadata         JSONB DEFAULT '{}'
    created_at       TIMESTAMPTZ DEFAULT now()
  );
END $$;

-- Ensure RLS policies exist on credits tables
ALTER TABLE IF EXISTS user_credits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they conflict (idempotent)
DROP POLICY IF EXISTS "service_role_full_user_credits"        ON user_credits;
DROP POLICY IF EXISTS "service_role_full_credit_transactions" ON credit_transactions;
DROP POLICY IF EXISTS "users_view_own_credits"                ON user_credits;
DROP POLICY IF EXISTS "users_view_own_transactions"           ON credit_transactions;

CREATE POLICY "service_role_full_user_credits"
  ON user_credits FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "users_view_own_credits"
  ON user_credits FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "service_role_full_credit_transactions"
  ON credit_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "users_view_own_transactions"
  ON credit_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
