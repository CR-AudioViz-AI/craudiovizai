import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/monitoring/payment-failure
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, amount, currency, error_code, error_message, provider } = body;

    // Get user info
    const { data: profile } = await supabase
      .from("craiverse_profiles")
      .select("email, display_name")
      .eq("id", user_id)
      .single();

    // Create ticket
    const ticketNumber = `PAY-${Date.now().toString(36).toUpperCase()}`;
    
    await supabase.from("craiverse_tickets").insert({
      ticket_number: ticketNumber,
      user_id,
      subject: `[Auto] Payment Failed - ${provider} - $${(amount/100).toFixed(2)}`,
      description: `**Payment Failure Details:**

- Amount: $${(amount/100).toFixed(2)} ${currency?.toUpperCase()}
- Provider: ${provider}
- Error Code: ${error_code}
- Error: ${error_message}
- User: ${profile?.display_name || "Unknown"} (${profile?.email})`,
      category: "billing",
      priority: "high",
      status: "open",
      source_app: "payments",
      metadata: { auto_generated: true, payment_provider: provider, amount }
    });

    // Send email notification to user
    if (profile?.email && process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "CR AudioViz AI <billing@craudiovizai.com>",
          to: profile.email,
          subject: "Payment Issue - Action Required",
          html: `
            <h2>Payment Processing Issue</h2>
            <p>Hi ${profile.display_name || "there"},</p>
            <p>We encountered an issue processing your payment of <strong>$${(amount/100).toFixed(2)}</strong>.</p>
            <p><strong>Error:</strong> ${error_message}</p>
            <p>Please update your payment method or try again:</p>
            <p><a href="https://craudiovizai.com/dashboard/billing">Update Payment Method</a></p>
            <p>If you need help, reply to this email or contact support.</p>
            <p>- The CR AudioViz AI Team</p>
          `
        })
      });
    }

    // Discord alert
    if (process.env.DISCORD_WEBHOOK_URL) {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: `💳 Payment Failed`,
            color: 0xFFA500,
            fields: [
              { name: "Amount", value: `$${(amount/100).toFixed(2)}`, inline: true },
              { name: "Provider", value: provider, inline: true },
              { name: "Ticket", value: ticketNumber, inline: true },
              { name: "Error", value: error_message?.substring(0, 200) }
            ]
          }]
        })
      });
    }

    return NextResponse.json({ success: true, ticket_number: ticketNumber });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
