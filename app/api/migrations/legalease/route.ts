import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ADMIN_KEY = process.env.ADMIN_API_KEY || 'cr-admin-2024';

export async function POST(request: Request) {
  try {
    // Verify admin key
    const authHeader = request.headers.get('x-admin-key');
    if (authHeader !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create legalease_documents table
    const { error: createError } = await supabase.rpc('exec_ddl', {
      ddl_command: `
        CREATE TABLE IF NOT EXISTS public.legalease_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          document_type TEXT NOT NULL DEFAULT 'contract',
          title TEXT NOT NULL,
          content TEXT,
          status TEXT DEFAULT 'draft',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_legalease_user ON public.legalease_documents(user_id);
        CREATE INDEX IF NOT EXISTS idx_legalease_type ON public.legalease_documents(document_type);
        CREATE INDEX IF NOT EXISTS idx_legalease_status ON public.legalease_documents(status);
        
        ALTER TABLE public.legalease_documents ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Users can view own documents" ON public.legalease_documents
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY IF NOT EXISTS "Users can insert own documents" ON public.legalease_documents
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY IF NOT EXISTS "Users can update own documents" ON public.legalease_documents
          FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY IF NOT EXISTS "Users can delete own documents" ON public.legalease_documents
          FOR DELETE USING (auth.uid() = user_id);
      `
    });

    if (createError) {
      // If RPC doesn't exist, try direct insert to verify table
      const { data, error: checkError } = await supabase
        .from('legalease_documents')
        .select('id')
        .limit(1);
      
      if (checkError && checkError.code === 'PGRST205') {
        return NextResponse.json({
          success: false,
          error: 'Table does not exist and cannot be created via API. Please create manually in Supabase dashboard.',
          sql: `
CREATE TABLE IF NOT EXISTS public.legalease_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL DEFAULT 'contract',
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legalease_user ON public.legalease_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_legalease_type ON public.legalease_documents(document_type);
ALTER TABLE public.legalease_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.legalease_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.legalease_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.legalease_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.legalease_documents FOR DELETE USING (auth.uid() = user_id);
          `
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Table already exists or was created',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'legalease_documents table created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
