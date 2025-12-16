// app/api/grants/route.ts
// Grant Management API - Full CRUD operations
// Timestamp: Sunday, December 15, 2025

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// GET - List all grants with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const funder_type = searchParams.get('funder_type');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('grant_opportunities')
      .select('*')
      .order('priority', { ascending: true })
      .order('deadline', { ascending: true, nullsFirst: false })
      .limit(limit);

    if (status && status !== 'all') query = query.eq('status', status);
    if (priority && priority !== 'all') query = query.eq('priority', priority);
    if (funder_type && funder_type !== 'all') query = query.eq('funder_type', funder_type);

    const { data, error } = await query;

    if (error) throw error;

    // Calculate stats
    const stats = {
      total: data?.length || 0,
      total_requested: data?.reduce((sum, g) => sum + (g.amount_requested || 0), 0) || 0,
      total_awarded: data?.filter(g => g.status === 'awarded').reduce((sum, g) => sum + (g.amount_awarded || g.amount_requested || 0), 0) || 0,
      by_status: {} as Record<string, number>,
      by_priority: {} as Record<string, number>,
      urgent: data?.filter(g => {
        if (!g.deadline) return false;
        const days = Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days <= 7 && days >= 0 && !['awarded', 'rejected', 'withdrawn', 'archived'].includes(g.status);
      }).length || 0
    };

    data?.forEach(g => {
      stats.by_status[g.status] = (stats.by_status[g.status] || 0) + 1;
      stats.by_priority[g.priority] = (stats.by_priority[g.priority] || 0) + 1;
    });

    return NextResponse.json({ grants: data, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new grant
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('grant_opportunities')
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update grant
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Grant ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('grant_opportunities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove grant
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Grant ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('grant_opportunities')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, deleted: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
