/**
 * CR AudioViz AI - Email Queue Table Migration
 * =============================================
 * 
 * Creates the email_queue table for storing scheduled emails
 * 
 * @version 1.0.0
 * @date January 2, 2026 - 1:42 AM EST
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
    // Create email_queue table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Email Queue Table
        CREATE TABLE IF NOT EXISTS email_queue (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          to_email TEXT NOT NULL,
          subject TEXT NOT NULL,
          template_id TEXT NOT NULL,
          data JSONB DEFAULT '{}',
          sequence TEXT,
          step INTEGER DEFAULT 1,
          scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          sent_at TIMESTAMPTZ,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
          error_message TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Indexes for efficient querying
        CREATE INDEX IF NOT EXISTS idx_email_queue_status 
          ON email_queue(status) WHERE status = 'pending';
        CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled 
          ON email_queue(scheduled_at) WHERE status = 'pending';
        CREATE INDEX IF NOT EXISTS idx_email_queue_user 
          ON email_queue(user_id);
        
        -- Add columns to profiles if they don't exist
        ALTER TABLE profiles 
          ADD COLUMN IF NOT EXISTS welcome_email_sent TIMESTAMPTZ;
        
        -- Add columns to subscriptions if they don't exist
        DO $$ 
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
            ALTER TABLE subscriptions 
              ADD COLUMN IF NOT EXISTS churn_email_sent TIMESTAMPTZ;
          END IF;
        END $$;
        
        -- RLS Policies
        ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Admin can manage email queue" ON email_queue;
        CREATE POLICY "Admin can manage email queue" ON email_queue
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM profiles 
              WHERE profiles.id = auth.uid() 
              AND profiles.role IN ('admin', 'super_admin')
            )
          );
        
        DROP POLICY IF EXISTS "Users can view own emails" ON email_queue;
        CREATE POLICY "Users can view own emails" ON email_queue
          FOR SELECT
          USING (user_id = auth.uid());
      `
    })
    
    if (createError) {
      // Try direct SQL if RPC doesn't exist
      console.log('RPC not available, table may already exist')
    }
    
    // Verify table exists
    const { data: tables, error: checkError } = await supabase
      .from('email_queue')
      .select('id')
      .limit(1)
    
    if (checkError && checkError.code === '42P01') {
      return NextResponse.json({
        success: false,
        error: 'Table creation requires manual migration',
        sql: 'Run the SQL above in Supabase Dashboard'
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Email queue table ready',
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
-- Email Queue Table Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  sequence TEXT,
  step INTEGER DEFAULT 1,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_user ON email_queue(user_id);

-- Add to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcome_email_sent TIMESTAMPTZ;

-- RLS
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage email queue" ON email_queue
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
  ));

CREATE POLICY "Users can view own emails" ON email_queue
  FOR SELECT USING (user_id = auth.uid());
`
  
  return new NextResponse(sql, {
    headers: { 'Content-Type': 'text/plain' }
  })
}
