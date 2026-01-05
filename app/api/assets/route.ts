// Universal Assets API - GET /api/assets
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const owner = searchParams.get('owner');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Build query
    let query = supabase
      .from('universal_assets')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (type) query = query.eq('asset_type', type);
    if (category) query = query.eq('category', category);
    if (owner) query = query.eq('owner_id', owner);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data: assets, count, error } = await query;

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json({ success: false, error: 'Failed to search assets' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      assets: assets || [],
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('universal_assets')
      .insert({
        asset_type: body.asset_type,
        category: body.category || 'uncategorized',
        name: body.name,
        description: body.description,
        file_url: body.file_url,
        file_path: body.file_path,
        file_size_bytes: body.file_size_bytes,
        mime_type: body.mime_type,
        metadata: body.metadata || {},
        tags: body.tags || [],
        owner_id: body.owner_id,
        is_public: body.is_public ?? true,
        is_free: body.is_free ?? true,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, asset: data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
