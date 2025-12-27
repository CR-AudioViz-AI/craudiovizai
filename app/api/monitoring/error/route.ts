import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/monitoring/error - Receives errors and creates tickets
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      error_message, 
      error_stack, 
      source_app, 
      source_url, 
      user_id,
      severity = "medium"
    } = body;

    // Generate ticket number
    const ticketNumber = `ERR-${Date.now().toString(36).toUpperCase()}`;

    // Create ticket in craiverse_tickets
    const { data: ticket, error } = await supabase
      .from("craiverse_tickets")
      .insert({
        ticket_number: ticketNumber,
        subject: `[Auto] Error in ${source_app}: ${error_message?.substring(0, 100)}`,
        description: `**Error Message:**
${error_message}

**Stack Trace:**
\`\`\`
${error_stack?.substring(0, 2000)}
\`\`\`

**Source URL:** ${source_url}`,
        category: "bug_report",
        priority: severity === "critical" ? "urgent" : severity,
        status: "open",
        source_app,
        source_url,
        user_id: user_id || null,
        metadata: { auto_generated: true, error_type: "runtime" }
      })
      .select()
      .single();

    if (error) throw error;

    // Send Discord notification for critical errors
    if (severity === "critical" && process.env.DISCORD_WEBHOOK_URL) {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: `🚨 Critical Error: ${ticketNumber}`,
            description: error_message?.substring(0, 500),
            color: 0xFF0000,
            fields: [
              { name: "App", value: source_app || "Unknown", inline: true },
              { name: "Ticket", value: ticketNumber, inline: true }
            ],
            timestamp: new Date().toISOString()
          }]
        })
      });
    }

    return NextResponse.json({ 
      success: true, 
      ticket_number: ticketNumber,
      ticket_id: ticket.id 
    });

  } catch (error: any) {
    console.error("Error handler failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
