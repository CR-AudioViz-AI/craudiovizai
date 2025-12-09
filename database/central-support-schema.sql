-- =====================================================
-- CR AUDIOVIZ AI - CENTRAL SUPPORT SYSTEM SCHEMA
-- Database tables for unified ticketing, enhancement requests,
-- and cross-app support management
-- Created: December 9, 2025
-- =====================================================

-- =====================================================
-- 1. SUPPORT TICKETS (Enhanced from existing)
-- =====================================================

-- Ensure support_tickets table has all needed columns
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS source_app VARCHAR(100) DEFAULT 'craudiovizai.com';
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50);
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5);
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_source_app ON support_tickets(source_app);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON support_tickets(created_at DESC);

-- =====================================================
-- 2. TICKET MESSAGES (Conversation Thread)
-- =====================================================

CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'agent', 'bot', 'system')),
  sender_id UUID REFERENCES auth.users(id),
  sender_name VARCHAR(100),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created ON ticket_messages(created_at);

-- =====================================================
-- 3. ENHANCEMENT REQUESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS enhancement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_email VARCHAR(255),
  source_app VARCHAR(100) DEFAULT 'craudiovizai.com',
  
  -- Request Details
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  
  -- Voting
  vote_count INTEGER DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(30) DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'under_review', 'planned', 'in_progress', 
    'testing', 'completed', 'declined', 'duplicate'
  )),
  
  -- Planning
  target_release VARCHAR(50),
  estimated_effort VARCHAR(20),
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Metadata
  tags TEXT[],
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enhancements_user ON enhancement_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_enhancements_status ON enhancement_requests(status);
CREATE INDEX IF NOT EXISTS idx_enhancements_votes ON enhancement_requests(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_enhancements_source ON enhancement_requests(source_app);

-- =====================================================
-- 4. ENHANCEMENT VOTES
-- =====================================================

CREATE TABLE IF NOT EXISTS enhancement_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enhancement_id UUID NOT NULL REFERENCES enhancement_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enhancement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_enhancement ON enhancement_votes(enhancement_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON enhancement_votes(user_id);

-- =====================================================
-- 5. ENHANCEMENT COMMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS enhancement_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enhancement_id UUID NOT NULL REFERENCES enhancement_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  is_official BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_enhancement ON enhancement_comments(enhancement_id);

-- =====================================================
-- 6. APP REGISTRY (For Cross-App Support)
-- =====================================================

CREATE TABLE IF NOT EXISTS registered_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_slug VARCHAR(50) UNIQUE NOT NULL,
  app_name VARCHAR(100) NOT NULL,
  app_url VARCHAR(255) NOT NULL,
  app_icon_url VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  support_enabled BOOLEAN DEFAULT TRUE,
  enhancement_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate with known apps
INSERT INTO registered_apps (app_slug, app_name, app_url, description) VALUES
  ('craudiovizai', 'CR AudioViz AI Hub', 'https://craudiovizai.com', 'Central platform hub'),
  ('javariai', 'Javari AI', 'https://javariai.com', 'Autonomous AI assistant'),
  ('cardverse', 'CardVerse', 'https://cardverse.craudiovizai.com', 'Trading card platform')
ON CONFLICT (app_slug) DO NOTHING;

-- =====================================================
-- 7. SUPPORT CATEGORIES
-- =====================================================

CREATE TABLE IF NOT EXISTS support_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug VARCHAR(50) UNIQUE NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  parent_category UUID REFERENCES support_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Pre-populate categories
INSERT INTO support_categories (category_slug, category_name, description, icon, sort_order) VALUES
  ('billing', 'Billing & Payments', 'Questions about subscriptions, credits, and payments', 'credit-card', 1),
  ('technical', 'Technical Issues', 'Bugs, errors, and technical problems', 'bug', 2),
  ('account', 'Account & Security', 'Login issues, password reset, account settings', 'shield', 3),
  ('feature', 'Feature Questions', 'How to use specific features', 'lightbulb', 4),
  ('feedback', 'General Feedback', 'Suggestions and general comments', 'message-circle', 5)
ON CONFLICT (category_slug) DO NOTHING;

-- =====================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_comments ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY IF NOT EXISTS "Users view own tickets" ON support_tickets
  FOR SELECT USING (user_id = auth.uid());

-- Users can create tickets
CREATE POLICY IF NOT EXISTS "Users create tickets" ON support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can view messages on their tickets
CREATE POLICY IF NOT EXISTS "Users view own ticket messages" ON ticket_messages
  FOR SELECT USING (
    ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
    AND is_internal = FALSE
  );

-- Users can add messages to their tickets
CREATE POLICY IF NOT EXISTS "Users add ticket messages" ON ticket_messages
  FOR INSERT WITH CHECK (
    ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
    AND sender_type = 'user'
  );

-- Anyone can view enhancement requests
CREATE POLICY IF NOT EXISTS "Public view enhancements" ON enhancement_requests
  FOR SELECT USING (TRUE);

-- Authenticated users can create enhancement requests
CREATE POLICY IF NOT EXISTS "Auth users create enhancements" ON enhancement_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can vote once per enhancement
CREATE POLICY IF NOT EXISTS "Auth users vote" ON enhancement_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users view own votes" ON enhancement_votes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users delete own votes" ON enhancement_votes
  FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- 9. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update vote count
CREATE OR REPLACE FUNCTION update_enhancement_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE enhancement_requests 
    SET vote_count = vote_count + 1 
    WHERE id = NEW.enhancement_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE enhancement_requests 
    SET vote_count = vote_count - 1 
    WHERE id = OLD.enhancement_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vote count
DROP TRIGGER IF EXISTS trigger_update_vote_count ON enhancement_votes;
CREATE TRIGGER trigger_update_vote_count
  AFTER INSERT OR DELETE ON enhancement_votes
  FOR EACH ROW EXECUTE FUNCTION update_enhancement_vote_count();

-- Function to generate enhancement request number
CREATE OR REPLACE FUNCTION generate_enhancement_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_number := 'ENH-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || 
    UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for enhancement number
DROP TRIGGER IF EXISTS trigger_enhancement_number ON enhancement_requests;
CREATE TRIGGER trigger_enhancement_number
  BEFORE INSERT ON enhancement_requests
  FOR EACH ROW EXECUTE FUNCTION generate_enhancement_number();

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
