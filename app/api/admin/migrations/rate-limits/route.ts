/**
 * CR AudioViz AI - Rate Limits Table Migration
 * =============================================
 * 
 * Creates the rate_limits table for tracking API usage
 * 
 * @version 1.0.0
 * @date January 2, 2026 - 2:05 AM EST
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // The SQL to create rate_limits table
    const sql = `
      -- Rate Limits Table
      CREATE TABLE IF NOT EXISTS rate_limits (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        identifier TEXT NOT NULL,
        category TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'
      );
      
      -- Indexes for efficient querying
      CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier 
        ON rate_limits(identifier);
      CREATE INDEX IF NOT EXISTS idx_rate_limits_timestamp 
        ON rate_limits(timestamp);
      CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
        ON rate_limits(timestamp) WHERE timestamp < NOW() - INTERVAL '24 hours';
      
      -- Auto-cleanup function
      CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
      RETURNS void AS $$
      BEGIN
        DELETE FROM rate_limits WHERE timestamp < NOW() - INTERVAL '24 hours';
      END;
      $$ LANGUAGE plpgsql;
      
      -- Credit decrement function (atomic)
      CREATE OR REPLACE FUNCTION decrement_credits_if_available(
        p_user_id UUID,
        p_amount INTEGER
      )
      RETURNS JSON AS $$
      DECLARE
        current_balance INTEGER;
        new_balance INTEGER;
      BEGIN
        SELECT credits_balance INTO current_balance
        FROM profiles
        WHERE id = p_user_id
        FOR UPDATE;
        
        IF current_balance IS NULL THEN
          RETURN json_build_object('success', false, 'remaining', 0, 'error', 'User not found');
        END IF;
        
        IF current_balance < p_amount THEN
          RETURN json_build_object('success', false, 'remaining', current_balance, 'error', 'Insufficient credits');
        END IF;
        
        new_balance := current_balance - p_amount;
        
        UPDATE profiles
        SET credits_balance = new_balance,
            updated_at = NOW()
        WHERE id = p_user_id;
        
        RETURN json_build_object('success', true, 'remaining', new_balance);
      END;
      $$ LANGUAGE plpgsql;
      
      -- RLS for rate_limits (admin only)
      ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Admin can manage rate limits" ON rate_limits;
      CREATE POLICY "Admin can manage rate limits" ON rate_limits
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
          )
        );
      
      -- Service role can always access (for API operations)
      DROP POLICY IF EXISTS "Service role full access" ON rate_limits;
      CREATE POLICY "Service role full access" ON rate_limits
        FOR ALL USING (auth.role() = 'service_role');
    `;
    
    // Try to verify table exists
    const { data, error } = await supabase
      .from('rate_limits')
      .select('id')
      .limit(1)
    
    if (error && error.code === '42P01') {
      return NextResponse.json({
        success: false,
        message: 'Table needs creation - run SQL in Supabase Dashboard',
        sql
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Rate limits table ready',
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Return SQL for manual execution
  const sql = `
-- Rate Limits Table Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  category TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_timestamp ON rate_limits(timestamp);

-- Atomic credit decrement function
CREATE OR REPLACE FUNCTION decrement_credits_if_available(p_user_id UUID, p_amount INTEGER)
RETURNS JSON AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  SELECT credits_balance INTO current_balance FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF current_balance IS NULL THEN RETURN json_build_object('success', false, 'remaining', 0); END IF;
  IF current_balance < p_amount THEN RETURN json_build_object('success', false, 'remaining', current_balance); END IF;
  new_balance := current_balance - p_amount;
  UPDATE profiles SET credits_balance = new_balance WHERE id = p_user_id;
  RETURN json_build_object('success', true, 'remaining', new_balance);
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role access" ON rate_limits FOR ALL USING (auth.role() = 'service_role');
`
  
  return new NextResponse(sql, {
    headers: { 'Content-Type': 'text/plain' }
  })
}
