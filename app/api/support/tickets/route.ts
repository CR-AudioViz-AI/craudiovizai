// app/api/support/tickets/route.ts
// API for support ticket management

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - List tickets (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);
    if (source) query = query.eq('source_app', source);
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, tickets: data });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// POST - Create new ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { subject, description, category, source_app, user_email, user_name, user_id, priority } = body;

    if (!subject || !description || !category) {
      return NextResponse.json(
        { success: false, error: 'Subject, description, and category are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        subject,
        description,
        category,
        source_app: source_app || 'craudiovizai.com',
        user_email,
        user_name,
        user_id,
        priority: priority || 'normal',
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('javari_activity_log').insert({
      activity_type: 'ticket_created',
      description: `New ticket created: ${subject}`,
      success: true,
    });

    return NextResponse.json({ success: true, ticket: data });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

// PATCH - Update ticket status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticket_id, status, resolution_notes } = body;

    if (!ticket_id) {
      return NextResponse.json(
        { success: false, error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (resolution_notes) updateData.resolution_notes = resolution_notes;
    if (status === 'resolved') updateData.resolved_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticket_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, ticket: data });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
