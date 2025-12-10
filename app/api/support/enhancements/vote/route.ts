// app/api/support/enhancements/vote/route.ts
// API for voting on enhancement requests

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST - Add vote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enhancement_id, user_id } = body;

    if (!enhancement_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Enhancement ID and User ID are required' },
        { status: 400 }
      );
    }

    // Check if already voted
    const { data: existing } = await supabase
      .from('enhancement_votes')
      .select()
      .eq('enhancement_id', enhancement_id)
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Already voted on this enhancement' },
        { status: 400 }
      );
    }

    // Add vote
    const { error } = await supabase
      .from('enhancement_votes')
      .insert({ enhancement_id, user_id });

    if (error) throw error;

    // Get updated count
    const { data: enhancement } = await supabase
      .from('enhancement_requests')
      .select('vote_count')
      .eq('id', enhancement_id)
      .single();

    return NextResponse.json({ 
      success: true, 
      vote_count: enhancement?.vote_count || 0 
    });
  } catch (error) {
    console.error('Error adding vote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add vote' },
      { status: 500 }
    );
  }
}

// DELETE - Remove vote
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enhancement_id = searchParams.get('enhancement_id');
    const user_id = searchParams.get('user_id');

    if (!enhancement_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Enhancement ID and User ID are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('enhancement_votes')
      .delete()
      .eq('enhancement_id', enhancement_id)
      .eq('user_id', user_id);

    if (error) throw error;

    // Get updated count
    const { data: enhancement } = await supabase
      .from('enhancement_requests')
      .select('vote_count')
      .eq('id', enhancement_id)
      .single();

    return NextResponse.json({ 
      success: true, 
      vote_count: enhancement?.vote_count || 0 
    });
  } catch (error) {
    console.error('Error removing vote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove vote' },
      { status: 500 }
    );
  }
}
