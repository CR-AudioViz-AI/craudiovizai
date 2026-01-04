// ================================================================================
// CR AUDIOVIZ AI - CENTRAL ASSET REPOSITORY (CAR) API
// Unified asset management with per-customer vault isolation
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

// Helper to get user from auth header
async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  
  const supabase = getSupabase();
  if (!supabase) return null;
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

// ============================================================================
// GET /api/car - List user's assets
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includePublic = searchParams.get('public') === 'true';
    
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    let query = supabase
      .from('assets')
      .select('*', { count: 'exact' });

    // Per-customer vault isolation: only show user's assets + public assets
    if (user) {
      if (includePublic) {
        query = query.or(`owned_by.eq.${user.id},is_public.eq.true`);
      } else {
        query = query.eq('owned_by', user.id);
      }
    } else {
      // Unauthenticated: only public assets
      query = query.eq('is_public', true);
    }

    // Apply filters
    if (category) {
      query = query.eq('category_id', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
    }

    query = query
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: assets, error, count } = await query;

    if (error) {
      console.error('CAR list error:', error);
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }

    return NextResponse.json({
      assets: assets || [],
      total: count || 0,
      limit,
      offset,
      user_id: user?.id || null
    });

  } catch (error: any) {
    console.error('CAR API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// POST /api/car - Upload/register new asset
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category_id,
      storage_path,
      original_filename,
      file_size_bytes,
      mime_type,
      file_extension,
      file_hash,
      is_public = false,
      tags = [],
      metadata = {}
    } = body;

    if (!name || !storage_path) {
      return NextResponse.json({ error: 'name and storage_path required' }, { status: 400 });
    }

    // Check for duplicates by hash within user's vault
    if (file_hash) {
      const { data: existing } = await supabase
        .from('assets')
        .select('id, name')
        .eq('owned_by', user.id)
        .eq('file_hash', file_hash)
        .single();

      if (existing) {
        return NextResponse.json({
          warning: 'duplicate_detected',
          existing_asset: existing,
          message: 'An asset with this file hash already exists in your vault'
        }, { status: 200 });
      }
    }

    // Create asset record
    const { data: asset, error } = await supabase
      .from('assets')
      .insert({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        category_id,
        storage_path,
        original_filename,
        file_size_bytes,
        mime_type,
        file_extension,
        file_hash,
        is_public,
        tags,
        metadata,
        owned_by: user.id,
        uploaded_by: user.id,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('CAR insert error:', error);
      return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
    }

    // Log to audit
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'asset_created',
      resource_type: 'asset',
      resource_id: asset.id,
      details: { name, storage_path }
    });

    return NextResponse.json({ asset, success: true }, { status: 201 });

  } catch (error: any) {
    console.error('CAR POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// DELETE /api/car?id=xxx - Soft delete asset
// ============================================================================
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('id');

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Verify ownership
    const { data: asset } = await supabase
      .from('assets')
      .select('id, owned_by')
      .eq('id', assetId)
      .single();

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (asset.owned_by !== user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this asset' }, { status: 403 });
    }

    // Soft delete
    const { error } = await supabase
      .from('assets')
      .update({
        status: 'deleted',
        archived_at: new Date().toISOString()
      })
      .eq('id', assetId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'asset_deleted',
      resource_type: 'asset',
      resource_id: assetId
    });

    return NextResponse.json({ success: true, deleted: assetId });

  } catch (error: any) {
    console.error('CAR DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
