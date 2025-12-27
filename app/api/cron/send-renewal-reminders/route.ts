import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email-service";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/cron/send-renewal-reminders - Runs daily
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find subscriptions renewing in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const startOfDay = new Date(threeDaysFromNow.setHours(0, 0, 0, 0));
    const endOfDay = new Date(threeDaysFromNow.setHours(23, 59, 59, 999));

    const { data: subscriptions, error } = await supabase
      .from("craiverse_subscriptions")
      .select(`
        id,
        current_period_end,
        user_id,
        craiverse_profiles!inner (email, display_name),
        craiverse_subscription_plans!inner (name, price_monthly)
      `)
      .eq("status", "active")
      .gte("current_period_end", startOfDay.toISOString())
      .lte("current_period_end", endOfDay.toISOString());

    if (error) throw error;

    let sent = 0;
    for (const sub of subscriptions || []) {
      const profile = sub.craiverse_profiles as any;
      const plan = sub.craiverse_subscription_plans as any;
      
      // Check if we already sent reminder
      const { data: existing } = await supabase
        .from("craiverse_email_log")
        .select("id")
        .eq("user_id", sub.user_id)
        .eq("template", "renewalReminder")
        .gte("sent_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (existing?.length) continue;

      const result = await sendEmail({
        to: profile.email,
        template: "renewalReminder",
        data: {
          name: profile.display_name || "there",
          plan: plan.name,
          amount: (plan.price_monthly / 100).toFixed(2),
          renewDate: new Date(sub.current_period_end).toLocaleDateString()
        }
      });

      if (result.success) {
        sent++;
        await supabase.from("craiverse_email_log").insert({
          user_id: sub.user_id,
          to_email: profile.email,
          template: "renewalReminder",
          resend_id: result.id
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      subscriptions_checked: subscriptions?.length || 0,
      reminders_sent: sent 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
