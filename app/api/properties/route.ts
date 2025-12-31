/**
 * CR AudioViz AI - Central Properties API
 * Real estate listings, leads, and property management
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // listings, leads, contacts, saved
    const user_id = searchParams.get('user_id');
    const property_id = searchParams.get('property_id');
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const min_price = searchParams.get('min_price');
    const max_price = searchParams.get('max_price');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (property_id) {
      const { data, error } = await supabase
        .from('properties')
        .select('*, property_images(*), property_features(*)')
        .eq('id', property_id)
        .single();
      if (error) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      return NextResponse.json({ property: data });
    }

    switch (type) {
      case 'leads':
        if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });
        const { data: leads } = await supabase
          .from('leads')
          .select('*')
          .eq('agent_id', user_id)
          .order('created_at', { ascending: false });
        return NextResponse.json({ leads: leads || [] });

      case 'contacts':
        if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });
        const { data: contacts } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', user_id)
          .order('name');
        return NextResponse.json({ contacts: contacts || [] });

      case 'saved':
        if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });
        const { data: saved } = await supabase
          .from('saved_properties')
          .select('*, properties(*)')
          .eq('user_id', user_id);
        return NextResponse.json({ saved: saved || [] });

      default:
        let query = supabase
          .from('properties')
          .select('*', { count: 'exact' })
          .eq('status', status || 'active')
          .order('listed_date', { ascending: false })
          .limit(limit);

        if (city) query = query.ilike('city', `%${city}%`);
        if (min_price) query = query.gte('price', min_price);
        if (max_price) query = query.lte('price', max_price);

        const { data: listings, count } = await query;
        return NextResponse.json({ listings: listings || [], total: count });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, user_id, ...data } = body;

    switch (type) {
      case 'property':
        const { data: property, error: propError } = await supabase
          .from('properties')
          .insert({ ...data, agent_id: user_id, status: 'active', listed_date: new Date().toISOString() })
          .select()
          .single();
        if (propError) return NextResponse.json({ error: propError.message }, { status: 500 });
        return NextResponse.json({ success: true, property });

      case 'lead':
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .insert({ ...data, agent_id: user_id, status: 'new', created_at: new Date().toISOString() })
          .select()
          .single();
        if (leadError) return NextResponse.json({ error: leadError.message }, { status: 500 });
        return NextResponse.json({ success: true, lead });

      case 'contact':
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .insert({ ...data, user_id, created_at: new Date().toISOString() })
          .select()
          .single();
        if (contactError) return NextResponse.json({ error: contactError.message }, { status: 500 });
        return NextResponse.json({ success: true, contact });

      case 'save':
        const { data: save, error: saveError } = await supabase
          .from('saved_properties')
          .insert({ user_id, property_id: data.property_id, created_at: new Date().toISOString() })
          .select()
          .single();
        if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });
        return NextResponse.json({ success: true, saved: save });

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
