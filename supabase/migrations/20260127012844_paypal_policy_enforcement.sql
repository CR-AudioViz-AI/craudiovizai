-- PayPal No-Refund Policy Enforcement
-- Adds requires_manual_review column to PayPal subscriptions table
-- Reuses existing policy_audit_log table from Stripe enforcement
-- Created: 2026-01-27

-- Add manual review flag to craiverse_subscriptions table
-- (PayPal subscriptions use craiverse_subscriptions, not subscriptions)
alter table if exists craiverse_subscriptions
add column if not exists requires_manual_review boolean default false;

-- Create index for efficient lookups of subscriptions requiring review
create index if not exists idx_craiverse_subscriptions_manual_review 
  on craiverse_subscriptions(requires_manual_review) 
  where requires_manual_review = true;

-- Add PayPal-specific columns to policy_audit_log if not exists
-- (Table was created in Stripe enforcement migration)
alter table if exists policy_audit_log
add column if not exists paypal_order_id text,
add column if not exists paypal_subscription_id text;

-- Create indexes for PayPal lookups
create index if not exists idx_policy_audit_log_paypal_order 
  on policy_audit_log(paypal_order_id);
  
create index if not exists idx_policy_audit_log_paypal_subscription 
  on policy_audit_log(paypal_subscription_id);
