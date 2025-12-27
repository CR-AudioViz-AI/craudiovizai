import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Commission rates
const COMMISSION_RATES = {
  barrelverse: 0.10, // 10% on spirits sales
  cardverse: 0.08,   // 8% on card sales
  default: 0.05      // 5% default
};

// POST /api/marketplace/transaction - Process marketplace sale
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      seller_id, 
      buyer_id, 
      amount_cents, 
      platform,
      item_id,
      item_name,
      item_type
    } = body;

    if (!seller_id || !buyer_id || !amount_cents || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Calculate commission
    const commissionRate = COMMISSION_RATES[platform as keyof typeof COMMISSION_RATES] || COMMISSION_RATES.default;
    const commissionAmount = Math.round(amount_cents * commissionRate);
    const sellerAmount = amount_cents - commissionAmount;

    // Get seller Stripe account (for Connect payouts)
    const { data: seller } = await supabase
      .from("craiverse_profiles")
      .select("stripe_connect_id, email, display_name")
      .eq("id", seller_id)
      .single();

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from("craiverse_marketplace_transactions")
      .insert({
        seller_id,
        buyer_id,
        platform,
        item_id,
        item_name,
        item_type,
        gross_amount: amount_cents,
        commission_amount: commissionAmount,
        commission_rate: commissionRate,
        net_amount: sellerAmount,
        status: "pending"
      })
      .select()
      .single();

    if (txError) throw txError;

    // If seller has Stripe Connect, create transfer
    let transferId = null;
    if (seller?.stripe_connect_id) {
      try {
        const transfer = await stripe.transfers.create({
          amount: sellerAmount,
          currency: "usd",
          destination: seller.stripe_connect_id,
          metadata: {
            transaction_id: transaction.id,
            platform,
            item_id
          }
        });
        transferId = transfer.id;

        await supabase
          .from("craiverse_marketplace_transactions")
          .update({ 
            status: "completed", 
            stripe_transfer_id: transferId,
            completed_at: new Date().toISOString()
          })
          .eq("id", transaction.id);
      } catch (stripeError: any) {
        console.error("Stripe transfer failed:", stripeError);
        // Mark for manual review
        await supabase
          .from("craiverse_marketplace_transactions")
          .update({ status: "pending_review", error: stripeError.message })
          .eq("id", transaction.id);
      }
    }

    // Record platform revenue
    await supabase.from("craiverse_platform_revenue").insert({
      source: platform,
      transaction_id: transaction.id,
      amount: commissionAmount,
      type: "commission"
    });

    return NextResponse.json({
      success: true,
      transaction_id: transaction.id,
      gross_amount: amount_cents / 100,
      commission: commissionAmount / 100,
      seller_receives: sellerAmount / 100,
      transfer_id: transferId
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/marketplace/transaction - Get transaction details
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get("id");
  const sellerId = searchParams.get("seller_id");

  try {
    if (transactionId) {
      const { data, error } = await supabase
        .from("craiverse_marketplace_transactions")
        .select("*")
        .eq("id", transactionId)
        .single();

      if (error) throw error;
      return NextResponse.json({ transaction: data });
    }

    if (sellerId) {
      const { data, error } = await supabase
        .from("craiverse_marketplace_transactions")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return NextResponse.json({ transactions: data });
    }

    return NextResponse.json({ error: "id or seller_id required" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
