// ================================================================================
// CR AUDIOVIZ AI - EVIDENCE ARTIFACTS API
// Store screenshots, traces, HAR files from testing
// ================================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

// ============================================================================
// GET /api/evidence - List evidence artifacts
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testRunId = searchParams.get('test_run_id');
    const type = searchParams.get('type'); // screenshot, trace, har, video
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    let query = supabase
      .from('evidence_artifacts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (testRunId) {
      query = query.eq('test_run_id', testRunId);
    }

    if (type) {
      query = query.eq('artifact_type', type);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Evidence fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch evidence' }, { status: 500 });
    }

    return NextResponse.json({
      artifacts: data || [],
      total: count || 0,
      limit
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST /api/evidence - Store new evidence artifact
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const {
      test_run_id,
      test_name,
      artifact_type, // screenshot, trace, har, video, log
      storage_path,
      file_size_bytes,
      description,
      metadata = {},
      device_profile,
      url_tested,
      status // pass, fail, error
    } = body;

    if (!artifact_type || !storage_path) {
      return NextResponse.json({ error: 'artifact_type and storage_path required' }, { status: 400 });
    }

    const { data: artifact, error } = await supabase
      .from('evidence_artifacts')
      .insert({
        test_run_id: test_run_id || crypto.randomUUID(),
        test_name,
        artifact_type,
        storage_path,
        file_size_bytes,
        description,
        metadata,
        device_profile,
        url_tested,
        status,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Evidence insert error:', error);
      return NextResponse.json({ error: 'Failed to store evidence' }, { status: 500 });
    }

    return NextResponse.json({ artifact, success: true }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
