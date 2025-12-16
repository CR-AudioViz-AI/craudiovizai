// app/api/grants/milestones/route.ts
// Grant Milestones API
// Timestamp: Sunday, December 15, 2025

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// GET - List milestones for a grant
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const grant_id = searchParams.get('grant_id');

    let query = supabase
      .from('grant_milestones')
      .select('*')
      .order('due_date', { ascending: true });

    if (grant_id) {
      query = query.eq('grant_id', grant_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ milestones: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create milestone
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('grant_milestones')
      .insert(body)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update milestone
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Milestone ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('grant_milestones')
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

// DELETE - Remove milestone
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Milestone ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('grant_milestones')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
