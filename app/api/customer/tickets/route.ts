import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/customer/tickets - Get user tickets
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("craiverse_profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;

    let query = supabaseAdmin
      .from("craiverse_tickets")
      .select(`
        *,
        craiverse_ticket_messages (
          id, message, is_staff, created_at,
          craiverse_profiles (display_name, avatar_url)
        )
      `, { count: "exact" })
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      tickets: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/customer/tickets - Create new ticket
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("craiverse_profiles")
      .select("id, email, display_name")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { subject, description, category, priority, source_app } = body;

    if (!subject || !description) {
      return NextResponse.json({ error: "Subject and description required" }, { status: 400 });
    }

    // Generate ticket number
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;

    const { data: ticket, error } = await supabaseAdmin
      .from("craiverse_tickets")
      .insert({
        ticket_number: ticketNumber,
        user_id: profile.id,
        subject,
        description,
        category: category || "general",
        priority: priority || "medium",
        status: "open",
        source_app: source_app || "portal"
      })
      .select()
      .single();

    if (error) throw error;

    // Send Discord notification
    if (process.env.DISCORD_WEBHOOK_URL) {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: `🎫 New Ticket: ${ticketNumber}`,
            description: subject,
            color: 0x3B82F6,
            fields: [
              { name: "Category", value: category || "general", inline: true },
              { name: "Priority", value: priority || "medium", inline: true },
              { name: "User", value: profile.display_name || profile.email, inline: true }
            ],
            timestamp: new Date().toISOString()
          }]
        })
      });
    }

    return NextResponse.json({ success: true, ticket });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
