-- Data Governance & Compliance Database Schema
-- CR AudioViz AI - Phase 0 Layer 0.5
-- GDPR, CCPA, and Privacy Infrastructure
-- Run in Supabase SQL Editor

-- ============================================================================
-- CONSENT MANAGEMENT
-- ============================================================================

-- User consent records
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Consent Types
  consent_type TEXT NOT NULL CHECK (consent_type IN (
    'terms_of_service',
    'privacy_policy', 
    'marketing_email',
    'marketing_sms',
    'marketing_push',
    'data_processing',
    'ai_training',
    'analytics',
    'third_party_sharing',
    'cookies_essential',
    'cookies_functional',
    'cookies_analytics',
    'cookies_advertising'
  )),
  
  -- Consent State
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  
  -- Context
  version TEXT NOT NULL, -- Policy version consented to
  ip_address INET,
  user_agent TEXT,
  source TEXT, -- 'signup', 'settings', 'banner', 'api'
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, consent_type)
);

-- Consent history (immutable audit trail)
CREATE TABLE IF NOT EXISTS consent_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('granted', 'revoked', 'updated')),
  
  -- Snapshot
  old_value BOOLEAN,
  new_value BOOLEAN,
  version TEXT,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  source TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DATA SUBJECT REQUESTS (GDPR/CCPA)
-- ============================================================================

-- Data subject access requests
CREATE TABLE IF NOT EXISTS data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Request Details
  request_type TEXT NOT NULL CHECK (request_type IN (
    'access',           -- Right to access (GDPR Art. 15)
    'portability',      -- Right to data portability (GDPR Art. 20)
    'rectification',    -- Right to rectification (GDPR Art. 16)
    'erasure',          -- Right to erasure / Right to be forgotten (GDPR Art. 17)
    'restriction',      -- Right to restriction (GDPR Art. 18)
    'objection',        -- Right to object (GDPR Art. 21)
    'do_not_sell',      -- CCPA Do Not Sell
    'know',             -- CCPA Right to Know
    'delete'            -- CCPA Right to Delete
  )),
  
  -- Requester Info (for non-authenticated requests)
  email TEXT NOT NULL,
  verification_token TEXT,
  verified_at TIMESTAMPTZ,
  
  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'verifying',
    'in_progress',
    'completed',
    'rejected',
    'expired'
  )),
  
  -- Processing
  assigned_to UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ, -- GDPR: 30 days, CCPA: 45 days
  
  -- Results
  result_url TEXT, -- Signed URL to download data export
  result_expires_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Notes
  internal_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data request activity log
CREATE TABLE IF NOT EXISTS data_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES data_requests(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DATA RETENTION POLICIES
-- ============================================================================

-- Retention policy definitions
CREATE TABLE IF NOT EXISTS retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Policy Target
  table_name TEXT NOT NULL,
  description TEXT,
  
  -- Retention Rules
  retention_days INTEGER NOT NULL, -- Days to keep data
  deletion_strategy TEXT NOT NULL CHECK (deletion_strategy IN (
    'hard_delete',      -- Permanently remove
    'soft_delete',      -- Mark as deleted
    'anonymize',        -- Remove PII, keep aggregate
    'archive'           -- Move to cold storage
  )),
  
  -- Conditions
  condition_column TEXT, -- Column to check (e.g., 'created_at')
  condition_extra JSONB, -- Additional conditions
  
  -- Schedule
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  
  -- Legal Basis
  legal_basis TEXT, -- Why this retention period
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retention execution log
CREATE TABLE IF NOT EXISTS retention_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES retention_policies(id),
  
  -- Execution Details
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Results
  records_processed INTEGER DEFAULT 0,
  records_deleted INTEGER DEFAULT 0,
  records_anonymized INTEGER DEFAULT 0,
  records_archived INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DATA CLASSIFICATION
-- ============================================================================

-- Data classification registry
CREATE TABLE IF NOT EXISTS data_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Classification Target
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  
  -- Classification
  classification TEXT NOT NULL CHECK (classification IN (
    'public',           -- No restrictions
    'internal',         -- Internal use only
    'confidential',     -- Limited access
    'pii',              -- Personal Identifiable Information
    'sensitive_pii',    -- SSN, financial, health
    'payment',          -- Payment card data (PCI)
    'health',           -- Health data (HIPAA)
    'child',            -- Children's data (COPPA)
    'biometric'         -- Biometric data
  )),
  
  -- Handling Rules
  encrypt_at_rest BOOLEAN DEFAULT false,
  encrypt_in_transit BOOLEAN DEFAULT true,
  mask_in_logs BOOLEAN DEFAULT true,
  include_in_exports BOOLEAN DEFAULT true,
  anonymization_method TEXT, -- 'hash', 'redact', 'generalize', 'noise'
  
  -- Documentation
  description TEXT,
  legal_basis TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(table_name, column_name)
);

-- ============================================================================
-- AUDIT TRAIL (Compliance)
-- ============================================================================

-- Comprehensive audit log for compliance
CREATE TABLE IF NOT EXISTS compliance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  actor_id UUID REFERENCES auth.users(id),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'admin', 'system', 'api')),
  actor_ip INET,
  
  -- Action
  action TEXT NOT NULL,
  action_category TEXT CHECK (action_category IN (
    'authentication',
    'authorization',
    'data_access',
    'data_modification',
    'data_deletion',
    'consent_change',
    'export',
    'admin_action',
    'system_event'
  )),
  
  -- Target
  resource_type TEXT,
  resource_id TEXT,
  resource_table TEXT,
  
  -- Details
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  
  -- Context
  session_id TEXT,
  request_id TEXT,
  user_agent TEXT,
  
  -- Compliance Tags
  gdpr_relevant BOOLEAN DEFAULT false,
  ccpa_relevant BOOLEAN DEFAULT false,
  hipaa_relevant BOOLEAN DEFAULT false,
  pci_relevant BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LEGAL HOLDS
-- ============================================================================

-- Legal hold management
CREATE TABLE IF NOT EXISTS legal_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hold Details
  name TEXT NOT NULL,
  description TEXT,
  reference_number TEXT, -- Case/matter number
  
  -- Scope
  scope_type TEXT NOT NULL CHECK (scope_type IN ('user', 'date_range', 'query', 'all')),
  scope_users UUID[], -- Specific users
  scope_start_date TIMESTAMPTZ,
  scope_end_date TIMESTAMPTZ,
  scope_tables TEXT[], -- Specific tables
  scope_query TEXT, -- Custom query
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'expired')),
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Custodian
  created_by UUID REFERENCES auth.users(id),
  released_by UUID REFERENCES auth.users(id),
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_consent_history_user ON consent_history(user_id);
CREATE INDEX IF NOT EXISTS idx_data_requests_user ON data_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_requests_status ON data_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_requests_due ON data_requests(due_date) WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_retention_policies_active ON retention_policies(is_active, next_run_at);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_actor ON compliance_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_resource ON compliance_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_created ON compliance_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_legal_holds_active ON legal_holds(status) WHERE status = 'active';

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;

-- Users can see their own consents
CREATE POLICY "Users view own consents" ON user_consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own consents" ON user_consents
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can see their own data requests
CREATE POLICY "Users view own data requests" ON data_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Service role has full access (for admin operations)
CREATE POLICY "Service role full access consents" ON user_consents
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access requests" ON data_requests
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access audit" ON compliance_audit_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- DEFAULT RETENTION POLICIES
-- ============================================================================

INSERT INTO retention_policies (table_name, description, retention_days, deletion_strategy, condition_column, legal_basis) VALUES
  ('analytics_events', 'Analytics event data', 365, 'anonymize', 'created_at', 'Legitimate interest in product improvement'),
  ('analytics_sessions', 'Session tracking data', 90, 'hard_delete', 'created_at', 'Legitimate interest, limited retention'),
  ('error_logs', 'Application error logs', 90, 'hard_delete', 'created_at', 'Debugging and security'),
  ('chat_messages', 'AI chat history', 365, 'soft_delete', 'created_at', 'User service, deletable on request'),
  ('moderation_queue', 'Resolved moderation items', 180, 'archive', 'resolved_at', 'Safety and legal compliance'),
  ('compliance_audit_log', 'Compliance audit trail', 2555, 'archive', 'created_at', 'Legal requirement (7 years)')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DEFAULT DATA CLASSIFICATIONS (PII fields)
-- ============================================================================

INSERT INTO data_classifications (table_name, column_name, classification, mask_in_logs, anonymization_method) VALUES
  ('auth.users', 'email', 'pii', true, 'hash'),
  ('auth.users', 'phone', 'pii', true, 'redact'),
  ('profiles', 'full_name', 'pii', true, 'redact'),
  ('profiles', 'avatar_url', 'pii', false, NULL),
  ('profiles', 'date_of_birth', 'sensitive_pii', true, 'generalize'),
  ('marketplace_vendors', 'tax_id', 'sensitive_pii', true, 'redact'),
  ('marketplace_vendors', 'bank_account', 'payment', true, 'redact'),
  ('data_requests', 'email', 'pii', true, 'hash'),
  ('data_requests', 'ip_address', 'pii', true, 'generalize')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to log consent changes automatically
CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO consent_history (
    user_id,
    consent_type,
    action,
    old_value,
    new_value,
    version,
    source
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(NEW.consent_type, OLD.consent_type),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'granted'
      WHEN TG_OP = 'DELETE' THEN 'revoked'
      WHEN OLD.granted != NEW.granted THEN 
        CASE WHEN NEW.granted THEN 'granted' ELSE 'revoked' END
      ELSE 'updated'
    END,
    OLD.granted,
    NEW.granted,
    NEW.version,
    NEW.source
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER consent_change_trigger
  AFTER INSERT OR UPDATE ON user_consents
  FOR EACH ROW EXECUTE FUNCTION log_consent_change();

-- Function to set due date on data requests
CREATE OR REPLACE FUNCTION set_data_request_due_date()
RETURNS TRIGGER AS $$
BEGIN
  -- GDPR: 30 days, CCPA: 45 days
  NEW.due_date := CASE
    WHEN NEW.request_type IN ('do_not_sell', 'know', 'delete') THEN NOW() + INTERVAL '45 days'
    ELSE NOW() + INTERVAL '30 days'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_due_date_trigger
  BEFORE INSERT ON data_requests
  FOR EACH ROW EXECUTE FUNCTION set_data_request_due_date();

-- ============================================================================
-- DONE
-- ============================================================================

COMMENT ON TABLE user_consents IS 'GDPR/CCPA consent tracking for all consent types';
COMMENT ON TABLE data_requests IS 'Data subject access requests (DSAR) tracking';
COMMENT ON TABLE retention_policies IS 'Automated data retention and deletion policies';
COMMENT ON TABLE data_classifications IS 'PII and sensitive data classification registry';
COMMENT ON TABLE compliance_audit_log IS 'Immutable audit trail for compliance';
COMMENT ON TABLE legal_holds IS 'Legal hold management for litigation preservation';
