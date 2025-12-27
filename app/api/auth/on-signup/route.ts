import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email-service";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/auth/on-signup - Called after successful signup
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, email, name } = body;

    if (!user_id || !email) {
      return NextResponse.json({ error: "Missing user_id or email" }, { status: 400 });
    }

    // Check if welcome email already sent
    const { data: existing } = await supabase
      .from("craiverse_email_log")
      .select("id")
      .eq("user_id", user_id)
      .eq("template", "welcome")
      .limit(1);

    if (existing?.length) {
      return NextResponse.json({ message: "Welcome email already sent" });
    }

    // Send welcome email
    const result = await sendEmail({
      to: email,
      template: "welcome",
      data: { name: name || "there", email }
    });

    if (result.success) {
      await supabase.from("craiverse_email_log").insert({
        user_id,
        to_email: email,
        template: "welcome",
        resend_id: result.id
      });

      // Create initial credit record
      await supabase.from("craiverse_credits").upsert({
        user_id,
        balance: 100,
        lifetime_earned: 100
      }, { onConflict: "user_id" });

      // Create welcome notification
      await supabase.from("craiverse_notifications").insert({
        user_id,
        type: "welcome",
        title: "Welcome to CRAIverse! 🎉",
        message: "You have 100 free credits to get started. Explore our apps and create something amazing!",
        action_url: "/apps",
        action_label: "Browse Apps"
      });
    }

    return NextResponse.json({ success: true, email_sent: result.success });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
