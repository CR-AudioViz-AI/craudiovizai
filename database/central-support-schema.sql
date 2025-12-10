-- =====================================================
-- CR AUDIOVIZ AI - PRACTICAL SUPPORT & LEARNING SCHEMA
-- No fancy APIs, just working database systems
-- December 9, 2025
-- =====================================================

-- =====================================================
-- 1. SUPPORT TICKETS - Simple & Effective
-- =====================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  
  -- Who
  user_id UUID REFERENCES auth.users(id),
  user_email VARCHAR(255),
  user_name VARCHAR(100),
  
  -- What
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  source_app VARCHAR(100) DEFAULT 'craudiovizai.com',
  
  -- Status
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Assignment
  assigned_bot VARCHAR(50) DEFAULT 'Javari',
  
  -- Resolution
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket messages (conversation thread)
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'bot', 'admin')),
  sender_name VARCHAR(100),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || 
    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ticket_number ON support_tickets;
CREATE TRIGGER trigger_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- =====================================================
-- 2. ENHANCEMENT REQUESTS - Community Voting
-- =====================================================

CREATE TABLE IF NOT EXISTS enhancement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(20) UNIQUE,
  
  -- Who
  user_id UUID REFERENCES auth.users(id),
  user_email VARCHAR(255),
  
  -- What
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  source_app VARCHAR(100) DEFAULT 'all',
  
  -- Voting
  vote_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(30) DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'under_review', 'planned', 'in_progress', 
    'completed', 'declined', 'duplicate'
  )),
  
  -- Admin notes
  admin_response TEXT,
  target_release VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhancement votes
CREATE TABLE IF NOT EXISTS enhancement_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enhancement_id UUID NOT NULL REFERENCES enhancement_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enhancement_id, user_id)
);

-- Auto-generate enhancement numbers
CREATE OR REPLACE FUNCTION generate_enhancement_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_number := 'ENH-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || 
    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enhancement_number ON enhancement_requests;
CREATE TRIGGER trigger_enhancement_number
  BEFORE INSERT ON enhancement_requests
  FOR EACH ROW EXECUTE FUNCTION generate_enhancement_number();

-- Vote count trigger
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE enhancement_requests SET vote_count = vote_count + 1, updated_at = NOW()
    WHERE id = NEW.enhancement_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE enhancement_requests SET vote_count = vote_count - 1, updated_at = NOW()
    WHERE id = OLD.enhancement_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vote_count ON enhancement_votes;
CREATE TRIGGER trigger_vote_count
  AFTER INSERT OR DELETE ON enhancement_votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_count();

-- =====================================================
-- 3. JAVARI KNOWLEDGE SYSTEM - Learning Database
-- =====================================================

-- Core knowledge entries
CREATE TABLE IF NOT EXISTS javari_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Categorization
  category VARCHAR(50) NOT NULL, -- 'stocks', 'crypto', 'penny_stocks', 'platform', 'general'
  subcategory VARCHAR(50),
  
  -- Content
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[], -- For search
  
  -- Source
  source_type VARCHAR(50), -- 'document', 'conversation', 'prediction', 'manual', 'scraper'
  source_url VARCHAR(500),
  source_id VARCHAR(100),
  
  -- Quality
  confidence_score DECIMAL(3,2) DEFAULT 0.5, -- 0.00 to 1.00
  times_referenced INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_category ON javari_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_keywords ON javari_knowledge USING GIN(keywords);

-- Javari's stock/crypto predictions & learning
CREATE TABLE IF NOT EXISTS javari_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What was predicted
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('stock', 'penny_stock', 'crypto')),
  ticker VARCHAR(20) NOT NULL,
  asset_name VARCHAR(100),
  
  -- The prediction
  prediction_type VARCHAR(30) NOT NULL, -- 'buy', 'sell', 'hold', 'watch', 'avoid'
  prediction_reason TEXT NOT NULL,
  confidence_level VARCHAR(20), -- 'low', 'medium', 'high'
  
  -- Price at prediction
  price_at_prediction DECIMAL(18,8),
  target_price DECIMAL(18,8),
  stop_loss DECIMAL(18,8),
  
  -- Outcome tracking
  outcome VARCHAR(30), -- 'correct', 'incorrect', 'partial', 'pending'
  price_at_outcome DECIMAL(18,8),
  outcome_date TIMESTAMPTZ,
  outcome_notes TEXT,
  
  -- Learning
  lessons_learned TEXT,
  factors_that_worked TEXT[],
  factors_that_failed TEXT[],
  
  -- Timestamps
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictions_ticker ON javari_predictions(ticker);
CREATE INDEX IF NOT EXISTS idx_predictions_outcome ON javari_predictions(outcome);
CREATE INDEX IF NOT EXISTS idx_predictions_type ON javari_predictions(asset_type);

-- Javari conversation memory
CREATE TABLE IF NOT EXISTS javari_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Session
  session_id VARCHAR(100),
  user_id UUID REFERENCES auth.users(id),
  source_app VARCHAR(100) DEFAULT 'javariai.com',
  
  -- Message
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Learning extraction
  extracted_topics TEXT[],
  extracted_entities TEXT[], -- stocks mentioned, etc.
  sentiment VARCHAR(20), -- 'positive', 'negative', 'neutral'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_session ON javari_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON javari_conversations(user_id);

-- Javari activity log (what she's doing)
CREATE TABLE IF NOT EXISTS javari_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  activity_type VARCHAR(50) NOT NULL, -- 'learned', 'predicted', 'answered', 'scraped', 'analyzed'
  description TEXT NOT NULL,
  
  -- Related entities
  related_ticker VARCHAR(20),
  related_knowledge_id UUID REFERENCES javari_knowledge(id),
  related_prediction_id UUID REFERENCES javari_predictions(id),
  
  -- Metrics
  success BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. FUTURE ENHANCEMENTS (Placeholder)
-- =====================================================

-- Note: These are planned but not active
-- - Real-time AI provider switching (needs API budget)
-- - Multi-model routing (needs API budget)  
-- - Live market data integration (needs data subscriptions)
-- - Advanced sentiment analysis (needs ML infrastructure)

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE javari_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE javari_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE javari_conversations ENABLE ROW LEVEL SECURITY;

-- Users see own tickets
CREATE POLICY "users_own_tickets" ON support_tickets
  FOR ALL USING (user_id = auth.uid() OR auth.uid() IS NULL);

-- Users see own ticket messages
CREATE POLICY "users_own_messages" ON ticket_messages
  FOR SELECT USING (
    ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
  );

-- Anyone can view enhancements
CREATE POLICY "public_view_enhancements" ON enhancement_requests
  FOR SELECT USING (TRUE);

-- Auth users can create enhancements
CREATE POLICY "auth_create_enhancements" ON enhancement_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users manage own votes
CREATE POLICY "users_own_votes" ON enhancement_votes
  FOR ALL USING (user_id = auth.uid());

-- Public read for knowledge
CREATE POLICY "public_read_knowledge" ON javari_knowledge
  FOR SELECT USING (TRUE);

-- Public read for predictions
CREATE POLICY "public_read_predictions" ON javari_predictions
  FOR SELECT USING (TRUE);

-- Users see own conversations
CREATE POLICY "users_own_conversations" ON javari_conversations
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
