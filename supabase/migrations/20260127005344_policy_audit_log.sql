-- Policy Audit Log and Manual Review Flag
-- Created: 2026-01-27 for no-refund policy enforcement

create table if not exists policy_audit_log (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null,
  user_id uuid,
  stripe_session_id text,
  stripe_subscription_id text,
  metadata_snapshot jsonb,
  violation_reason text,
  created_at timestamptz default now()
);

alter table subscriptions
add column if not exists requires_manual_review boolean default false;

-- Indexes for efficient lookups
create index if not exists idx_policy_audit_log_user_id on policy_audit_log(user_id);
create index if not exists idx_policy_audit_log_stripe_session on policy_audit_log(stripe_session_id);
create index if not exists idx_policy_audit_log_created_at on policy_audit_log(created_at desc);
create index if not exists idx_subscriptions_manual_review on subscriptions(requires_manual_review) where requires_manual_review = true;
