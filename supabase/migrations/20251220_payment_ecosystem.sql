-- =============================================================================
-- CR AUDIOVIZ AI - COMPLETE PAYMENT & ECOSYSTEM DATABASE SCHEMA
-- =============================================================================
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/kteobfyferrukqeolofj/sql
-- =============================================================================
-- Version: 2.0.0
-- Updated: December 20, 2025
-- =============================================================================

-- ============================================================================
-- CREDIT SYSTEM TABLES
-- ============================================================================

-- Credit transactions log
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for additions, negative for deductions
  transaction_type TEXT NOT NULL, -- 'purchase', 'spend', 'bonus', 'refund', 'subscription_renewal', 'referral'
  description TEXT,
  app_id TEXT, -- Which app used the credits
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at DESC);

-- ============================================================================
-- SUBSCRIPTION TABLES
-- ============================================================================

-- User subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive', -- 'active', 'cancelled', 'past_due', 'trialing'
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  paypal_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal ON subscriptions(paypal_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- PAYMENT TRANSACTIONS
-- ============================================================================

-- All payment transactions (one-time and recurring)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  provider TEXT NOT NULL, -- 'stripe' or 'paypal'
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  paypal_order_id TEXT,
  paypal_capture_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  refund_amount INTEGER DEFAULT 0,
  refunded_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at DESC);

-- ============================================================================
-- REFERRAL SYSTEM
-- ============================================================================

-- Referrals tracking
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  purchase_amount INTEGER, -- First purchase amount in cents
  commission_amount INTEGER, -- Commission earned in cents
  commission_credits INTEGER DEFAULT 100, -- Bonus credits given
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'expired'
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- ============================================================================
-- ACTIVITY LOGS (CRM Integration)
-- ============================================================================

-- Central activity log for all user actions
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'checkout_started', 'purchase_completed', 'subscription_cancelled', etc.
  product_id TEXT,
  app_id TEXT,
  amount INTEGER,
  provider TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- User notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'purchase_confirmation', 'subscription_cancelled', 'payment_failed', 'credits_low'
  title TEXT,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- ============================================================================
-- SCHEDULED EMAILS (Cross-sell sequences)
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template TEXT NOT NULL,
  subject TEXT,
  data JSONB DEFAULT '{}',
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_emails(status, scheduled_for);

-- ============================================================================
-- UPDATE PROFILES TABLE (Add credit balance)
-- ============================================================================

-- Add credits_balance column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'credits_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN credits_balance INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referred_by UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;
END $$;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update credit balance
CREATE OR REPLACE FUNCTION update_credit_balance(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET credits_balance = COALESCE(credits_balance, 0) + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update balance on credit_transactions insert
CREATE OR REPLACE FUNCTION trigger_update_credit_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET credits_balance = COALESCE(credits_balance, 0) + NEW.amount,
      updated_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_credit_transaction_insert ON credit_transactions;
CREATE TRIGGER on_credit_transaction_insert
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_credit_balance();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_create_referral ON profiles;
CREATE TRIGGER on_profile_create_referral
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see their own data
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payment transactions" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can view own activity" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Monthly revenue view
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  provider,
  COUNT(*) AS transaction_count,
  SUM(amount) AS total_cents,
  SUM(amount) / 100.0 AS total_dollars
FROM payment_transactions
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at), provider
ORDER BY month DESC;

-- Active subscriptions view
CREATE OR REPLACE VIEW active_subscriptions_summary AS
SELECT
  product_id,
  COUNT(*) AS subscriber_count,
  COUNT(*) FILTER (WHERE stripe_subscription_id IS NOT NULL) AS stripe_count,
  COUNT(*) FILTER (WHERE paypal_subscription_id IS NOT NULL) AS paypal_count
FROM subscriptions
WHERE status = 'active'
GROUP BY product_id;

-- Credit usage view
CREATE OR REPLACE VIEW credit_usage_summary AS
SELECT
  DATE_TRUNC('day', created_at) AS day,
  transaction_type,
  app_id,
  SUM(ABS(amount)) AS total_credits,
  COUNT(*) AS transaction_count
FROM credit_transactions
GROUP BY DATE_TRUNC('day', created_at), transaction_type, app_id
ORDER BY day DESC;

-- ============================================================================
-- SAMPLE DATA / INITIAL SETUP
-- ============================================================================

-- Grant 50 free credits to all new users (run once)
-- INSERT INTO credit_transactions (user_id, amount, transaction_type, description)
-- SELECT id, 50, 'bonus', 'Welcome bonus credits'
-- FROM auth.users
-- WHERE id NOT IN (SELECT DISTINCT user_id FROM credit_transactions WHERE description = 'Welcome bonus credits');

-- ============================================================================
-- DONE!
-- ============================================================================
-- 
-- Tables created:
-- - credit_transactions (credit history)
-- - subscriptions (active subscriptions)
-- - payment_transactions (all payments)
-- - referrals (referral tracking)
-- - activity_logs (CRM/analytics)
-- - notifications (user notifications)
-- - scheduled_emails (drip campaigns)
--
-- Functions created:
-- - update_credit_balance(user_id, amount)
-- - trigger_update_credit_balance (auto-updates on insert)
-- - generate_referral_code (unique codes for users)
--
-- Views created:
-- - monthly_revenue
-- - active_subscriptions_summary
-- - credit_usage_summary
--
-- =============================================================================
