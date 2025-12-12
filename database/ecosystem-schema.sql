-- CR AudioViz AI Complete Ecosystem Database Schema
-- Timestamp: Dec 11, 2025 10:38 PM EST
-- Purpose: Everything Javari needs to deliver for customers

-- ============================================
-- CORE USER SYSTEM
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  
  -- Subscription & Credits
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'premium', 'enterprise')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due', 'trialing')),
  subscription_provider TEXT CHECK (subscription_provider IN ('stripe', 'paypal')),
  subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  
  -- Role & Status
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'creator', 'moderator', 'support', 'admin', 'super_admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'pending_verification')),
  
  -- Preferences (Javari reads these)
  preferences JSONB DEFAULT '{
    "theme": "system",
    "language": "en",
    "notifications": {"email": true, "push": true, "marketing": false},
    "javari": {"voice": "default", "personality": "helpful", "auto_suggestions": true}
  }'::jsonb,
  
  -- Metadata
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREDIT SYSTEM (Core of Everything)
-- ============================================

-- User credit balances
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INTEGER DEFAULT 0,
  lifetime_spent INTEGER DEFAULT 0,
  lifetime_gifted INTEGER DEFAULT 0,
  
  -- Monthly tracking for subscription credits
  monthly_credits_received INTEGER DEFAULT 0,
  monthly_credits_reset_at TIMESTAMPTZ,
  
  -- Bonus credits (promotions, referrals)
  bonus_credits INTEGER DEFAULT 0,
  bonus_expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Credit transaction log (every credit movement)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Transaction details
  type TEXT NOT NULL CHECK (type IN (
    'purchase', 'subscription_grant', 'usage', 'refund', 
    'bonus', 'referral', 'gift_sent', 'gift_received', 
    'admin_adjustment', 'error_refund', 'promotional'
  )),
  credits INTEGER NOT NULL, -- Positive = add, Negative = deduct
  balance_after INTEGER NOT NULL,
  
  -- What caused this transaction
  source TEXT, -- 'stripe', 'paypal', 'javari', 'admin', 'system'
  source_id TEXT, -- payment_id, subscription_id, etc.
  
  -- For usage transactions
  app_id TEXT, -- Which app/tool consumed credits
  app_name TEXT,
  task_id UUID, -- Reference to the specific task
  
  -- Cost tracking (what we actually paid)
  actual_cost_usd DECIMAL(10,6), -- Our actual API cost
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit pricing configuration (Admin-managed)
CREATE TABLE IF NOT EXISTS public.credit_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  app_id TEXT NOT NULL,
  app_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'image_generate', 'video_create', etc.
  
  -- Credit cost to user
  credits_per_use INTEGER NOT NULL,
  
  -- Our actual cost (for profit tracking)
  estimated_cost_usd DECIMAL(10,6) NOT NULL,
  
  -- Usage limits
  max_per_request INTEGER DEFAULT 1,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(app_id, operation)
);

-- ============================================
-- TOOL/APP REGISTRY (What Javari Can Do)
-- ============================================

CREATE TABLE IF NOT EXISTS public.tools (
  id TEXT PRIMARY KEY, -- 'image-generator', 'voice-clone', etc.
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'image', 'video', 'audio', 'text', 'utility', 'game'
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'beta', 'maintenance', 'disabled')),
  
  -- Pricing
  base_credits INTEGER NOT NULL DEFAULT 10,
  
  -- API Configuration (Javari uses this)
  api_provider TEXT, -- 'replicate', 'openai', 'elevenlabs', etc.
  api_endpoint TEXT,
  api_config JSONB DEFAULT '{}',
  
  -- UI Configuration
  icon TEXT,
  color TEXT,
  ui_config JSONB DEFAULT '{}', -- Input fields, options, etc.
  
  -- Capabilities (for Javari to understand)
  capabilities JSONB DEFAULT '[]', -- ['text_to_image', 'style_transfer', etc.]
  input_types JSONB DEFAULT '[]', -- ['text', 'image', 'audio']
  output_types JSONB DEFAULT '[]', -- ['image', 'video']
  
  -- Usage tracking
  total_uses INTEGER DEFAULT 0,
  total_credits_consumed INTEGER DEFAULT 0,
  
  -- Metadata
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TASK QUEUE (Javari's Work Orders)
-- ============================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Task details
  tool_id TEXT REFERENCES public.tools(id),
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'canceled', 'refunded'
  )),
  
  -- Input/Output
  input JSONB NOT NULL, -- What the user requested
  output JSONB, -- Result from API
  error TEXT, -- Error message if failed
  
  -- Credits
  credits_charged INTEGER DEFAULT 0,
  credits_refunded INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,
  
  -- API tracking
  api_provider TEXT,
  api_request_id TEXT,
  api_cost_usd DECIMAL(10,6),
  
  -- Javari context
  javari_session_id UUID,
  javari_conversation_id UUID,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER ASSETS (What Users Have Created)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id),
  
  -- Asset details
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio', 'document', 'code', 'other')),
  name TEXT,
  description TEXT,
  
  -- Storage
  storage_provider TEXT DEFAULT 'supabase', -- 'supabase', 'cloudinary', 'mux'
  storage_path TEXT,
  public_url TEXT,
  thumbnail_url TEXT,
  
  -- File info
  file_size INTEGER,
  mime_type TEXT,
  dimensions JSONB, -- {width, height} or {duration}
  
  -- Organization
  folder_id UUID,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  
  -- Metadata
  generation_params JSONB, -- Store the prompt/settings used
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS & PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Plan details
  plan_id TEXT NOT NULL, -- 'starter', 'pro', 'premium', 'enterprise'
  plan_name TEXT,
  
  -- Provider info
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal')),
  provider_subscription_id TEXT,
  provider_customer_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'active', 'past_due', 'canceled', 'suspended', 'trialing'
  )),
  
  -- Billing cycle
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  
  -- Credits per month
  monthly_credits INTEGER,
  
  -- Pricing
  price_amount DECIMAL(10,2),
  price_currency TEXT DEFAULT 'USD',
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Transaction type
  type TEXT NOT NULL CHECK (type IN (
    'credit_purchase', 'subscription_payment', 'subscription_refund',
    'credit_refund', 'payout', 'fee'
  )),
  
  -- Amount
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  credits INTEGER, -- If credit purchase, how many
  
  -- Provider
  provider TEXT CHECK (provider IN ('stripe', 'paypal')),
  provider_id TEXT, -- payment_intent_id, order_id, etc.
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'refunded', 'disputed'
  )),
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUPPORT SYSTEM (Pulse → Javari → Roy)
-- ============================================

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Ticket details
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'billing', 'technical', 'feature', 'bug', 'account', 'other'
  
  -- Escalation
  escalation_tier TEXT DEFAULT 'pulse' CHECK (escalation_tier IN ('pulse', 'javari', 'human')),
  assigned_to UUID REFERENCES public.users(id),
  
  -- Priority & Status
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  
  -- Resolution
  resolution TEXT,
  resolved_by TEXT, -- 'pulse', 'javari', 'human'
  resolved_at TIMESTAMPTZ,
  
  -- AI handling
  ai_attempts INTEGER DEFAULT 0,
  ai_resolution_attempted BOOLEAN DEFAULT false,
  ai_confidence_score DECIMAL(3,2),
  
  -- Satisfaction
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback TEXT,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  
  -- Message details
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'pulse', 'javari', 'human')),
  sender_id UUID, -- User ID if human
  sender_name TEXT,
  
  content TEXT NOT NULL,
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
  -- AI metadata
  ai_model TEXT,
  ai_confidence DECIMAL(3,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JAVARI CONTEXT & LEARNING
-- ============================================

-- Javari conversation sessions
CREATE TABLE IF NOT EXISTS public.javari_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Session info
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Context
  context JSONB DEFAULT '{}', -- Current working context
  
  -- Stats
  messages_count INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  
  -- Quality tracking
  user_satisfaction INTEGER,
  successful_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0
);

-- Javari conversation messages (for context)
CREATE TABLE IF NOT EXISTS public.javari_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.javari_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  
  -- Tool usage
  tool_calls JSONB DEFAULT '[]',
  tool_results JSONB DEFAULT '[]',
  
  -- Tokens (for cost tracking)
  input_tokens INTEGER,
  output_tokens INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Javari learning feedback
CREATE TABLE IF NOT EXISTS public.javari_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.javari_sessions(id),
  message_id UUID REFERENCES public.javari_messages(id),
  user_id UUID REFERENCES public.users(id),
  
  -- Feedback
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback_type TEXT CHECK (feedback_type IN ('helpful', 'not_helpful', 'wrong', 'slow', 'other')),
  comment TEXT,
  
  -- For learning
  correct_response TEXT, -- What should have been said
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GAMES PLATFORM
-- ============================================

CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Categorization
  category TEXT NOT NULL, -- 'action', 'puzzle', 'strategy', etc.
  tags TEXT[] DEFAULT '{}',
  
  -- Game info
  provider TEXT, -- 'gamepix', 'gamedistribution', 'custom'
  provider_id TEXT,
  embed_url TEXT,
  thumbnail_url TEXT,
  
  -- Requirements
  supports_mobile BOOLEAN DEFAULT true,
  supports_fullscreen BOOLEAN DEFAULT true,
  min_players INTEGER DEFAULT 1,
  max_players INTEGER DEFAULT 1,
  
  -- Stats
  plays_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'coming_soon')),
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CRAIVERSE (Social Impact Modules)
-- ============================================

CREATE TABLE IF NOT EXISTS public.craiverse_modules (
  id TEXT PRIMARY KEY, -- 'first-responders', 'veterans', etc.
  name TEXT NOT NULL,
  description TEXT,
  
  -- Targeting
  target_audience TEXT NOT NULL,
  geographic_focus TEXT[], -- States/regions
  
  -- Grant info
  grant_eligible BOOLEAN DEFAULT true,
  grant_programs TEXT[], -- Which grants apply
  
  -- Status
  status TEXT DEFAULT 'active',
  launch_date DATE,
  
  -- Stats
  organizations_served INTEGER DEFAULT 0,
  total_credits_distributed INTEGER DEFAULT 0,
  
  -- Configuration
  config JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.craiverse_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT REFERENCES public.craiverse_modules(id),
  
  -- Org details
  name TEXT NOT NULL,
  type TEXT, -- 'fire_dept', 'animal_rescue', 'church', etc.
  ein TEXT, -- Tax ID for nonprofits
  
  -- Contact
  contact_name TEXT,
  contact_email TEXT,
  phone TEXT,
  
  -- Location
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verification_docs TEXT[],
  
  -- Credits
  credits_balance INTEGER DEFAULT 0,
  credits_monthly_allocation INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'suspended')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATOR MARKETPLACE
-- ============================================

CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.users(id),
  
  -- Item details
  type TEXT NOT NULL CHECK (type IN ('template', 'preset', 'workflow', 'asset', 'plugin')),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Pricing
  price_credits INTEGER NOT NULL,
  creator_share_percent INTEGER DEFAULT 70, -- Creator gets 70%
  
  -- Content
  preview_url TEXT,
  content_url TEXT,
  
  -- Stats
  downloads_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'disabled')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANALYTICS & AUDIT
-- ============================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  
  -- Event details
  event_name TEXT NOT NULL,
  event_category TEXT, -- 'engagement', 'conversion', 'error', 'usage'
  
  -- Context
  page_path TEXT,
  referrer TEXT,
  
  -- Properties
  properties JSONB DEFAULT '{}',
  
  -- Device
  device_type TEXT,
  browser TEXT,
  os TEXT,
  
  -- Location
  country TEXT,
  region TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'admin', 'system', 'javari', 'bot')),
  actor_id UUID,
  actor_name TEXT,
  
  -- Action
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
  resource_type TEXT NOT NULL, -- 'user', 'subscription', 'task', etc.
  resource_id TEXT,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BOT MONITORING (9 Autonomous Bots)
-- ============================================

CREATE TABLE IF NOT EXISTS public.bots (
  id TEXT PRIMARY KEY, -- 'credit-monitor', 'health-checker', etc.
  name TEXT NOT NULL,
  description TEXT,
  
  -- Schedule
  schedule TEXT, -- Cron expression
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  
  -- Stats
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  
  -- Config
  config JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bot_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id TEXT REFERENCES public.bots(id),
  
  -- Run details
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Result
  status TEXT CHECK (status IN ('running', 'success', 'failed')),
  result JSONB,
  error TEXT,
  
  -- Actions taken
  actions_taken JSONB DEFAULT '[]'
);

-- ============================================
-- WEBHOOK LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  provider TEXT NOT NULL, -- 'stripe', 'paypal', 'replicate', etc.
  event_type TEXT NOT NULL,
  event_id TEXT,
  
  -- Payload
  payload JSONB NOT NULL,
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS FOR CREDIT SYSTEM
-- ============================================

-- Add credits to user
CREATE OR REPLACE FUNCTION add_user_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_source TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update or insert credit balance
  INSERT INTO user_credits (user_id, balance, lifetime_earned)
  VALUES (p_user_id, p_credits, p_credits)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    balance = user_credits.balance + p_credits,
    lifetime_earned = user_credits.lifetime_earned + p_credits,
    updated_at = NOW()
  RETURNING balance INTO v_new_balance;
  
  -- Log transaction
  INSERT INTO credit_transactions (
    user_id, type, credits, balance_after, source, source_id, description
  ) VALUES (
    p_user_id, 
    CASE WHEN p_source = 'subscription_grant' THEN 'subscription_grant' ELSE 'purchase' END,
    p_credits, 
    v_new_balance, 
    p_source, 
    p_reference_id, 
    p_description
  );
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- Deduct credits (returns true if successful)
CREATE OR REPLACE FUNCTION deduct_user_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_app_id TEXT,
  p_app_name TEXT,
  p_task_id UUID DEFAULT NULL,
  p_actual_cost DECIMAL DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current balance with lock
  SELECT balance INTO v_current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check sufficient balance
  IF v_current_balance IS NULL OR v_current_balance < p_credits THEN
    RETURN FALSE;
  END IF;
  
  -- Deduct credits
  v_new_balance := v_current_balance - p_credits;
  
  UPDATE user_credits
  SET 
    balance = v_new_balance,
    lifetime_spent = lifetime_spent + p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO credit_transactions (
    user_id, type, credits, balance_after, source, 
    app_id, app_name, task_id, actual_cost_usd
  ) VALUES (
    p_user_id, 'usage', -p_credits, v_new_balance, 'javari',
    p_app_id, p_app_name, p_task_id, p_actual_cost
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Refund credits
CREATE OR REPLACE FUNCTION refund_user_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_reason TEXT,
  p_task_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE user_credits
  SET 
    balance = balance + p_credits,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  INSERT INTO credit_transactions (
    user_id, type, credits, balance_after, source, task_id, description
  ) VALUES (
    p_user_id, 'error_refund', p_credits, v_new_balance, 'system', p_task_id, p_reason
  );
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- Check credit balance
CREATE OR REPLACE FUNCTION check_user_credits(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(balance, 0)
  FROM user_credits
  WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.javari_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.javari_messages ENABLE ROW LEVEL SECURITY;

-- Users can read/update own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Credits - users see own
CREATE POLICY "Users view own credits" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own transactions" ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

-- Tasks - users see own
CREATE POLICY "Users view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Assets - users manage own
CREATE POLICY "Users view own assets" ON public.user_assets FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users manage own assets" ON public.user_assets FOR ALL USING (auth.uid() = user_id);

-- Support tickets - users see own
CREATE POLICY "Users view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Javari sessions - users see own
CREATE POLICY "Users view own sessions" ON public.javari_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users view own messages" ON public.javari_messages FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription ON public.users(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON public.credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON public.tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_assets_user ON public.user_assets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status, escalation_tier);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_category ON public.games(category, status);

