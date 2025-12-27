import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailTemplates, sendEmail } from "@/lib/email-templates";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/cron/renewal-reminders - Send renewal reminders (3 days before)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const targetDate = threeDaysFromNow.toISOString().split("T")[0];

    // Find subscriptions renewing in 3 days
    const { data: subscriptions, error } = await supabase
      .from("craiverse_subscriptions")
      .select(`
        id,
        current_period_end,
        craiverse_profiles (id, email, display_name),
        craiverse_subscription_plans (name, price_monthly)
      `)
      .eq("status", "active")
      .gte("current_period_end", targetDate + "T00:00:00")
      .lt("current_period_end", targetDate + "T23:59:59");

    if (error) throw error;

    let sent = 0;
    for (const sub of subscriptions || []) {
      const profile = sub.craiverse_profiles as any;
      const plan = sub.craiverse_subscription_plans as any;
      
      if (!profile?.email) continue;

      const renewDate = new Date(sub.current_period_end).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      });

      const template = emailTemplates.renewalReminder(
        profile.display_name || "there",
        plan.name,
        renewDate,
        plan.price_monthly
      );

      const result = await sendEmail(profile.email, template);
      if (result.success) sent++;
    }

    return NextResponse.json({ 
      success: true, 
      subscriptions_found: subscriptions?.length || 0,
      emails_sent: sent 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
