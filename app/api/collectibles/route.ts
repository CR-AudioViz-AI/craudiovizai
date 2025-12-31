/**
 * CR AudioViz AI - Central Collectibles API
 * Master API for all collector apps (cards, coins, stamps, etc.)
 * 
 * @author CR AudioViz AI, LLC
 * @created December 31, 2025
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Supported collectible categories
const CATEGORIES = [
  'trading-cards', 'coins', 'stamps', 'comics', 'sports-memorabilia',
  'vinyl-records', 'watches', 'sneakers', 'toys', 'art', 'antiques',
  'wine', 'whiskey', 'jewelry', 'books', 'games', 'instruments',
  'cameras', 'dolls', 'fossils', 'militaria', 'autographs', 'posters',
  'maps', 'magazines', 'postcards', 'pens', 'pottery', 'christmas',
  'pinball', 'trains', 'pez', 'beanie-babies', 'lego', 'funko', 'hot-wheels'
];

// GET /api/collectibles - Get items or categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const user_id = searchParams.get('user_id');
    const item_id = searchParams.get('item_id');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Return categories list
    if (!category && !item_id && !user_id) {
      return NextResponse.json({ categories: CATEGORIES });
    }

    // Get single item
    if (item_id) {
      const { data, error } = await supabase
        .from('collectibles')
        .select('*, collectible_images(*), collectible_prices(*)')
        .eq('id', item_id)
        .single();

      if (error) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      return NextResponse.json({ item: data });
    }

    // Build query
    let query = supabase
      .from('collectibles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq('category', category);
    if (user_id) query = query.eq('user_id', user_id);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ 
      items: data, 
      total: count,
      limit,
      offset 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/collectibles - Add item to collection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      user_id, category, name, description, 
      condition, grade, grading_company,
      purchase_price, purchase_date, current_value,
      images, metadata, app_id
    } = body;

    if (!user_id || !category || !name) {
      return NextResponse.json(
        { error: 'user_id, category, and name are required' },
        { status: 400 }
      );
    }

    if (!CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('collectibles')
      .insert({
        user_id,
        category,
        name,
        description,
        condition,
        grade,
        grading_company,
        purchase_price,
        purchase_date,
        current_value,
        metadata: metadata || {},
        app_id: app_id || 'unknown',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Add images if provided
    if (images && Array.isArray(images)) {
      for (const img of images) {
        await supabase.from('collectible_images').insert({
          collectible_id: data.id,
          url: img.url,
          type: img.type || 'front',
          created_at: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/collectibles - Update item
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('collectibles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/collectibles - Remove item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('collectibles')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
