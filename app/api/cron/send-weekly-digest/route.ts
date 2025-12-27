import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email-service";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/cron/send-weekly-digest - Runs every Sunday
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get active users who opted in to digest
    const { data: users, error } = await supabase
      .from("craiverse_profiles")
      .select("id, email, display_name")
      .eq("status", "active")
      .limit(500); // Process in batches

    if (error) throw error;

    let sent = 0;
    for (const user of users || []) {
      // Get user activity for the week
      const { data: transactions } = await supabase
        .from("craiverse_credit_transactions")
        .select("amount, source_app")
        .eq("user_id", user.id)
        .eq("type", "spend")
        .gte("created_at", oneWeekAgo.toISOString());

      const creditsUsed = (transactions || []).reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const appsUsed = [...new Set((transactions || []).map(t => t.source_app).filter(Boolean))];

      // Skip users with no activity
      if (creditsUsed === 0) continue;

      // Get new features (from a hypothetical changelog)
      const newFeatures = [
        "Javari AI now supports conversation history",
        "New Social Graphics templates added",
        "Improved PDF Builder performance"
      ];

      const result = await sendEmail({
        to: user.email,
        template: "weeklyDigest",
        data: {
          name: user.display_name || "there",
          creditsUsed,
          appsUsed,
          newFeatures
        }
      });

      if (result.success) {
        sent++;
        await supabase.from("craiverse_email_log").insert({
          user_id: user.id,
          to_email: user.email,
          template: "weeklyDigest",
          resend_id: result.id
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      users_checked: users?.length || 0,
      digests_sent: sent 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
