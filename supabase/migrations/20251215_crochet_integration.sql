-- =====================================================
-- MIGRATION: CrochetAI Integration
-- 
-- Adds:
-- 1. deduct_credits function for atomic credit operations
-- 2. ai_generations table extension for crochet
-- 3. Hobbies app category
-- 
-- @author CR AudioViz AI
-- @created December 15, 2025
-- =====================================================

-- =====================================================
-- CREDITS FUNCTIONS
-- =====================================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS deduct_credits(UUID, INTEGER, TEXT);

-- Create atomic deduct_credits function
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Get current balance with row lock
  SELECT credits_balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  -- Check if user exists
  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Deduct credits
  UPDATE profiles
  SET 
    credits_balance = credits_balance - p_amount,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    balance_after
  ) VALUES (
    p_user_id,
    -p_amount,
    'spend',
    p_description,
    v_current_balance - p_amount
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AI GENERATIONS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  model_used TEXT,
  prompt TEXT,
  result_type TEXT,
  output_url TEXT,
  credits_used INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_tool_name ON ai_generations(tool_name);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ai_generations(created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

-- Users can view their own generations
CREATE POLICY IF NOT EXISTS "Users can view own generations"
  ON public.ai_generations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own generations
CREATE POLICY IF NOT EXISTS "Users can insert own generations"
  ON public.ai_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CREDIT TRANSACTIONS TABLE (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'spend', 'refund', 'bonus', 'subscription')),
  description TEXT,
  balance_after INTEGER,
  payment_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY IF NOT EXISTS "Users can view own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- ENSURE PROFILES HAS credits_balance
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'credits_balance'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN credits_balance INTEGER DEFAULT 0;
  END IF;
END $$;

-- =====================================================
-- APP CATEGORIES FOR NAVIGATION
-- =====================================================

CREATE TABLE IF NOT EXISTS public.app_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Hobbies category if not exists
INSERT INTO app_categories (name, slug, description, icon, display_order)
VALUES ('Hobbies', 'hobbies', 'Creative tools for hobbies and crafts', '🎨', 5)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER, TEXT) TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION deduct_credits IS 'Atomically deducts credits from user balance with transaction logging';
COMMENT ON TABLE ai_generations IS 'Logs all AI tool generations for tracking and analytics';
COMMENT ON TABLE credit_transactions IS 'Complete audit trail of all credit movements';
