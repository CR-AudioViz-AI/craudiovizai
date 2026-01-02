-- External Distribution Tracking Table
-- Timestamp: January 1, 2026 - 4:55 PM EST
-- Tracks eBook listings across Amazon KDP, Apple Books, Google Play, etc.

CREATE TABLE IF NOT EXISTS ebook_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_slug TEXT NOT NULL,
  book_title TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('amazon_kdp', 'apple_books', 'google_play', 'kobo', 'draft2digital', 'gumroad')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'live', 'rejected')),
  external_id TEXT,
  external_url TEXT,
  price DECIMAL(10,2) NOT NULL,
  royalty_rate DECIMAL(5,4) DEFAULT 0.70,
  sales_count INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  live_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one book per platform
  UNIQUE(book_slug, platform)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_distributions_platform ON ebook_distributions(platform);
CREATE INDEX IF NOT EXISTS idx_distributions_status ON ebook_distributions(status);
CREATE INDEX IF NOT EXISTS idx_distributions_book ON ebook_distributions(book_slug);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_distributions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS distributions_updated_at ON ebook_distributions;
CREATE TRIGGER distributions_updated_at
  BEFORE UPDATE ON ebook_distributions
  FOR EACH ROW EXECUTE FUNCTION update_distributions_timestamp();

-- RLS Policies (admin only)
ALTER TABLE ebook_distributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to distributions" ON ebook_distributions;
CREATE POLICY "Admin full access to distributions" ON ebook_distributions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- Service role bypass for API
DROP POLICY IF EXISTS "Service role bypass" ON ebook_distributions;
CREATE POLICY "Service role bypass" ON ebook_distributions
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE ebook_distributions IS 'Tracks eBook distribution across external platforms like Amazon KDP, Apple Books, etc.';
