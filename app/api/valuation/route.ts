/**
 * CR AudioViz AI - Central Valuation API
 * Price valuation and market analytics for collectibles
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

// GET /api/valuation - Get valuations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const item_id = searchParams.get('item_id');
    const category = searchParams.get('category');
    const name = searchParams.get('name');
    const grade = searchParams.get('grade');

    if (item_id) {
      // Get valuation history for specific item
      const { data, error } = await supabase
        .from('valuations')
        .select('*')
        .eq('item_id', item_id)
        .order('date', { ascending: false })
        .limit(100);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Calculate trends
      const prices = data?.map(d => d.value) || [];
      const trend = prices.length > 1 
        ? ((prices[0] - prices[prices.length - 1]) / prices[prices.length - 1] * 100).toFixed(2)
        : 0;

      return NextResponse.json({ 
        valuations: data,
        current_value: prices[0] || 0,
        trend_percent: trend,
        history_count: data?.length || 0
      });
    }

    // Market lookup by name/category/grade
    if (name || category) {
      const { data, error } = await supabase
        .from('market_prices')
        .select('*')
        .ilike('name', `%${name || ''}%`)
        .eq(category ? 'category' : 'id', category || 'id')
        .order('last_updated', { ascending: false })
        .limit(50);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ market_prices: data });
    }

    return NextResponse.json({ error: 'item_id or name/category required' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/valuation - Record a valuation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      item_id, value, source, 
      condition, grade, grading_company,
      notes, app_id 
    } = body;

    if (!item_id || value === undefined) {
      return NextResponse.json(
        { error: 'item_id and value are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('valuations')
      .insert({
        item_id,
        value,
        source: source || 'manual',
        condition,
        grade,
        grading_company,
        notes,
        app_id: app_id || 'unknown',
        date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update item's current_value
    await supabase
      .from('collectibles')
      .update({ current_value: value, updated_at: new Date().toISOString() })
      .eq('id', item_id);

    return NextResponse.json({ success: true, valuation: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
