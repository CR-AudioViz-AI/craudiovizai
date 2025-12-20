import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

// Automated payment system test
export async function GET() {
  const results: Record<string, any> = {}
  
  // Test 1: Stripe Configuration
  try {
    const res = await fetch("https://api.stripe.com/v1/products?limit=5", {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    })
    const data = await res.json()
    results.stripe_products = {
      status: res.ok ? "pass" : "fail",
      count: data.data?.length || 0,
      products: data.data?.map((p: any) => ({ id: p.id, name: p.name, active: p.active })) || []
    }
  } catch (e: any) {
    results.stripe_products = { status: "fail", error: e.message }
  }
  
  // Test 2: Stripe Prices
  try {
    const res = await fetch("https://api.stripe.com/v1/prices?limit=20", {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    })
    const data = await res.json()
    results.stripe_prices = {
      status: res.ok ? "pass" : "fail", 
      count: data.data?.length || 0,
      prices: data.data?.map((p: any) => ({
        id: p.id,
        amount: p.unit_amount,
        currency: p.currency,
        interval: p.recurring?.interval || "one-time"
      })) || []
    }
  } catch (e: any) {
    results.stripe_prices = { status: "fail", error: e.message }
  }
  
  // Test 3: PayPal Configuration
  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64")
    
    const tokenRes = await fetch(
      process.env.PAYPAL_MODE === "live" 
        ? "https://api-m.paypal.com/v1/oauth2/token"
        : "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
      }
    )
    const tokenData = await tokenRes.json()
    results.paypal_auth = {
      status: tokenRes.ok ? "pass" : "fail",
      mode: process.env.PAYPAL_MODE,
      has_token: !!tokenData.access_token
    }
  } catch (e: any) {
    results.paypal_auth = { status: "fail", error: e.message }
  }
  
  // Test 4: Database Products Table
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, credits, active")
      .limit(20)
    
    results.database_products = {
      status: error ? "fail" : "pass",
      count: data?.length || 0,
      products: data || [],
      error: error?.message
    }
  } catch (e: any) {
    results.database_products = { status: "fail", error: e.message }
  }
  
  // Overall
  const passed = Object.values(results).filter((r: any) => r.status === "pass").length
  const total = Object.keys(results).length
  
  return NextResponse.json({
    status: passed === total ? "all_pass" : passed > 0 ? "partial" : "all_fail",
    summary: `${passed}/${total} tests passed`,
    timestamp: new Date().toISOString(),
    results
  })
}
