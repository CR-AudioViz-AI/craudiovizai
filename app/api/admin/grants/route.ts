// app/api/admin/grants/route.ts
// Grant CRUD Operations API
// Timestamp: Saturday, December 13, 2025 - 1:00 PM EST

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET: List all grants with filters
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const agency = searchParams.get('agency');
  const module = searchParams.get('module');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let query = supabase
      .from('grant_opportunities')
      .select('*')
      .order('application_deadline', { ascending: true, nullsFirst: false })
      .limit(limit);

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (agency) query = query.ilike('agency_name', `%${agency}%`);
    if (module) query = query.contains('target_modules', [module]);
    if (search) query = query.or(`grant_name.ilike.%${search}%,description.ilike.%${search}%`);

    const { data: grants, error } = await query;

    if (error) throw error;

    return NextResponse.json({ grants });
  } catch (error) {
    console.error('Error fetching grants:', error);
    return NextResponse.json({ error: 'Failed to fetch grants' }, { status: 500 });
  }
}

// POST: Create new grant
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.grant_name || !body.agency_name) {
      return NextResponse.json({ error: 'Grant name and agency are required' }, { status: 400 });
    }

    const { data: newGrant, error } = await supabase
      .from('grant_opportunities')
      .insert({
        ...body,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newGrant);
  } catch (error) {
    console.error('Error creating grant:', error);
    return NextResponse.json({ error: 'Failed to create grant' }, { status: 500 });
  }
}

// app/api/admin/grants/[id]/route.ts
// Individual grant operations

export async function GETGrant(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: grant, error } = await supabase
      .from('grant_opportunities')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;
    if (!grant) {
      return NextResponse.json({ error: 'Grant not found' }, { status: 404 });
    }

    return NextResponse.json(grant);
  } catch (error) {
    console.error('Error fetching grant:', error);
    return NextResponse.json({ error: 'Failed to fetch grant' }, { status: 500 });
  }
}

export async function PATCHGrant(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    const { data: updatedGrant, error } = await supabase
      .from('grant_opportunities')
      .update({
        ...body,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updatedGrant);
  } catch (error) {
    console.error('Error updating grant:', error);
    return NextResponse.json({ error: 'Failed to update grant' }, { status: 500 });
  }
}

export async function DELETEGrant(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Soft delete - set status to archived
    const { error } = await supabase
      .from('grant_opportunities')
      .update({ status: 'archived', updated_by: user.id })
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting grant:', error);
    return NextResponse.json({ error: 'Failed to delete grant' }, { status: 500 });
  }
}
