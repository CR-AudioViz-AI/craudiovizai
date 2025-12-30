// /api/marketplace/orders/route.ts
// Marketplace Orders API - CR AudioViz AI
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Default platform commission rate
const DEFAULT_COMMISSION_RATE = 15; // 15%

// GET: List orders (for customer or vendor)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const orderNumber = searchParams.get('orderNumber');
    const userId = searchParams.get('userId'); // Customer
    const vendorId = searchParams.get('vendorId'); // Vendor
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get single order
    if (orderId || orderNumber) {
      const { data, error } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          items:marketplace_order_items(
            *,
            product:marketplace_products(id, title, images)
          )
        `)
        .eq(orderId ? 'id' : 'order_number', orderId || orderNumber)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      return NextResponse.json({ order: data });
    }

    // Build query
    let query = supabase
      .from('marketplace_orders')
      .select(`
        *,
        items:marketplace_order_items(
          id, product_title, quantity, total_cents, fulfillment_status
        )
      `, { count: 'exact' });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    if (status) {
      query = query.eq('payment_status', status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      orders: data || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create order from cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      customerEmail,
      customerName,
      items, // Array of { productId, variantId, quantity }
      shippingAddress,
      paymentMethod,
      customerNotes
    } = body;

    if (!customerEmail || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'customerEmail and items required' },
        { status: 400 }
      );
    }

    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch product details and calculate totals
    const productIds = items.map((i: any) => i.productId);
    const { data: products, error: productError } = await supabase
      .from('marketplace_products')
      .select(`
        *,
        vendor:marketplace_vendors(id, commission_rate)
      `)
      .in('id', productIds);

    if (productError || !products) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    // Build order items and calculate totals
    let subtotalCents = 0;
    let platformFeeCents = 0;
    let vendorPayoutCents = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      if (product.status !== 'active') {
        return NextResponse.json(
          { error: `Product not available: ${product.title}` },
          { status: 400 }
        );
      }

      // Check inventory for physical products
      if (product.track_inventory && product.inventory_count < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient inventory for: ${product.title}` },
          { status: 400 }
        );
      }

      const quantity = item.quantity || 1;
      const unitPrice = product.price_cents;
      const itemTotal = unitPrice * quantity;
      const commissionRate = product.vendor?.commission_rate || DEFAULT_COMMISSION_RATE;
      const itemPlatformFee = Math.round(itemTotal * (commissionRate / 100));
      const itemVendorPayout = itemTotal - itemPlatformFee;

      subtotalCents += itemTotal;
      platformFeeCents += itemPlatformFee;
      vendorPayoutCents += itemVendorPayout;

      orderItems.push({
        product_id: product.id,
        variant_id: item.variantId || null,
        vendor_id: product.vendor_id,
        product_title: product.title,
        product_type: product.product_type,
        variant_name: null, // TODO: Get variant name if applicable
        quantity,
        unit_price_cents: unitPrice,
        total_cents: itemTotal,
        commission_rate: commissionRate,
        platform_fee_cents: itemPlatformFee,
        vendor_payout_cents: itemVendorPayout,
        download_url: product.download_url
      });
    }

    // Calculate final totals (no shipping or tax for now)
    const totalCents = subtotalCents;

    // Generate order number
    const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${
      Math.random().toString(36).substring(2, 8).toUpperCase()
    }`;

    // Determine if single vendor order
    const vendorIds = [...new Set(orderItems.map(i => i.vendor_id))];
    const singleVendorId = vendorIds.length === 1 ? vendorIds[0] : null;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('marketplace_orders')
      .insert({
        order_number: orderNumber,
        user_id: userId || null,
        customer_email: customerEmail,
        customer_name: customerName,
        vendor_id: singleVendorId,
        subtotal_cents: subtotalCents,
        total_cents: totalCents,
        platform_fee_cents: platformFeeCents,
        vendor_payout_cents: vendorPayoutCents,
        payment_status: 'pending',
        payment_method: paymentMethod || 'stripe',
        shipping_address: shippingAddress || null,
        customer_notes: customerNotes
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Create order items
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id
    }));

    const { error: itemsError } = await supabase
      .from('marketplace_order_items')
      .insert(itemsWithOrderId);

    if (itemsError) {
      console.error('Order items error:', itemsError);
      // Order created but items failed - this is bad, should rollback
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    // Deduct inventory for tracked products
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (product?.track_inventory) {
        await supabase
          .from('marketplace_products')
          .update({ inventory_count: product.inventory_count - item.quantity })
          .eq('id', item.productId);
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items: itemsWithOrderId
      },
      message: 'Order created successfully'
    });

  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update order status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      paymentStatus,
      fulfillmentStatus,
      trackingNumber,
      trackingUrl,
      internalNotes
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 });
    }

    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (paymentStatus) {
      updates.payment_status = paymentStatus;
      if (paymentStatus === 'paid') {
        updates.paid_at = new Date().toISOString();
      }
    }

    if (fulfillmentStatus) {
      updates.fulfillment_status = fulfillmentStatus;
      if (fulfillmentStatus === 'shipped' || fulfillmentStatus === 'delivered') {
        updates.fulfilled_at = new Date().toISOString();
      }
      if (fulfillmentStatus === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
      }
    }

    if (trackingNumber) updates.tracking_number = trackingNumber;
    if (trackingUrl) updates.tracking_url = trackingUrl;
    if (internalNotes) updates.internal_notes = internalNotes;

    const { data, error } = await supabase
      .from('marketplace_orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If fulfillment status changed, update order items too
    if (fulfillmentStatus) {
      await supabase
        .from('marketplace_order_items')
        .update({ fulfillment_status: fulfillmentStatus })
        .eq('order_id', orderId);
    }

    return NextResponse.json({ success: true, order: data });

  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
