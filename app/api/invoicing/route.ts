/**
 * CR AudioViz AI - Central Invoicing API
 * Invoice and client management
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
    const user_id = searchParams.get('user_id');
    const invoice_id = searchParams.get('invoice_id');
    const client_id = searchParams.get('client_id');
    const status = searchParams.get('status');
    const type = searchParams.get('type'); // invoices, clients, recurring

    if (invoice_id) {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, invoice_items(*), clients(*)')
        .eq('id', invoice_id)
        .single();
      if (error) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      return NextResponse.json({ invoice: data });
    }

    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    switch (type) {
      case 'clients':
        const { data: clients } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user_id)
          .order('name');
        return NextResponse.json({ clients: clients || [] });

      case 'recurring':
        const { data: recurring } = await supabase
          .from('recurring_invoices')
          .select('*, clients(*)')
          .eq('user_id', user_id)
          .eq('active', true);
        return NextResponse.json({ recurring: recurring || [] });

      default:
        let query = supabase
          .from('invoices')
          .select('*, clients(name, email)')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false });
        if (status) query = query.eq('status', status);
        if (client_id) query = query.eq('client_id', client_id);
        const { data: invoices } = await query;
        return NextResponse.json({ invoices: invoices || [] });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, user_id, ...data } = body;

    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    switch (type) {
      case 'invoice':
        const { items, ...invoiceData } = data;
        const invoice_number = `INV-${Date.now()}`;
        
        const { data: invoice, error: invError } = await supabase
          .from('invoices')
          .insert({
            ...invoiceData,
            user_id,
            invoice_number,
            status: 'draft',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (invError) return NextResponse.json({ error: invError.message }, { status: 500 });

        // Add line items
        if (items?.length) {
          for (const item of items) {
            await supabase.from('invoice_items').insert({
              invoice_id: invoice.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              amount: item.quantity * item.unit_price
            });
          }
        }

        return NextResponse.json({ success: true, invoice });

      case 'client':
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .insert({ ...data, user_id, created_at: new Date().toISOString() })
          .select()
          .single();
        if (clientError) return NextResponse.json({ error: clientError.message }, { status: 500 });
        return NextResponse.json({ success: true, client });

      case 'recurring':
        const { data: rec, error: recError } = await supabase
          .from('recurring_invoices')
          .insert({ ...data, user_id, active: true, created_at: new Date().toISOString() })
          .select()
          .single();
        if (recError) return NextResponse.json({ error: recError.message }, { status: 500 });
        return NextResponse.json({ success: true, recurring: rec });

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoice_id, status, ...updates } = body;

    if (!invoice_id) return NextResponse.json({ error: 'invoice_id required' }, { status: 400 });

    const updateData: any = { ...updates, updated_at: new Date().toISOString() };
    if (status) {
      updateData.status = status;
      if (status === 'sent') updateData.sent_at = new Date().toISOString();
      if (status === 'paid') updateData.paid_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoice_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, invoice: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
