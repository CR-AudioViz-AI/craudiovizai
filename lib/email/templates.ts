import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "Javari AI <hello@craudiovizai.com>";

export interface EmailTemplate {
  subject: string;
  html: string;
}

export const EmailTemplates = {
  welcome: (name: string): EmailTemplate => ({
    subject: "Welcome to CR AudioViz AI! 🎉",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px;border-radius:16px 16px 0 0;text-align:center">
        <h1 style="color:white;margin:0">Welcome to the CRAIverse!</h1>
      </div>
      <div style="background:#f9fafb;padding:40px;border-radius:0 0 16px 16px">
        <p>Hi ${name},</p>
        <p>Thank you for joining! Here's what you can do:</p>
        <ul><li>Create invoices with Invoice Generator</li><li>Build PDFs with PDF Builder Pro</li><li>Get AI stock predictions with Market Oracle</li></ul>
        <div style="text-align:center;margin:30px 0"><a href="https://craudiovizai.com/dashboard" style="background:#6366f1;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:600">Get Started</a></div>
      </div>
    </div>`
  }),

  lowCredits: (name: string, balance: number): EmailTemplate => ({
    subject: "⚠️ Your credits are running low",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#fef3c7;padding:20px;border-radius:16px 16px 0 0;text-align:center">
        <h1 style="color:#92400e;margin:0">Credits Running Low</h1>
      </div>
      <div style="background:#fffbeb;padding:30px;border-radius:0 0 16px 16px">
        <p>Hi ${name},</p>
        <p>Your credit balance is now <strong>${balance} credits</strong>.</p>
        <div style="text-align:center;margin:30px 0"><a href="https://craudiovizai.com/dashboard/credits" style="background:#f59e0b;color:white;padding:14px 28px;text-decoration:none;border-radius:8px">Buy Credits</a></div>
      </div>
    </div>`
  }),

  subscriptionRenewal: (name: string, plan: string, date: string, amount: string): EmailTemplate => ({
    subject: `Your ${plan} subscription renews soon`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:30px;border-radius:16px 16px 0 0;text-align:center">
        <h1 style="color:white;margin:0">Subscription Renewal</h1>
      </div>
      <div style="background:#f9fafb;padding:30px;border-radius:0 0 16px 16px">
        <p>Hi ${name},</p>
        <p>Your <strong>${plan}</strong> subscription renews on <strong>${date}</strong> for <strong>${amount}</strong>.</p>
        <div style="text-align:center;margin:30px 0"><a href="https://craudiovizai.com/dashboard/billing" style="background:#6366f1;color:white;padding:14px 28px;text-decoration:none;border-radius:8px">Manage Subscription</a></div>
      </div>
    </div>`
  }),

  paymentFailed: (name: string, reason: string): EmailTemplate => ({
    subject: "⚠️ Payment failed - action required",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#fee2e2;padding:20px;border-radius:16px 16px 0 0;text-align:center">
        <h1 style="color:#991b1b;margin:0">Payment Failed</h1>
      </div>
      <div style="background:#fef2f2;padding:30px;border-radius:0 0 16px 16px">
        <p>Hi ${name},</p>
        <p>Payment failed: <strong>${reason}</strong></p>
        <div style="text-align:center;margin:30px 0"><a href="https://craudiovizai.com/dashboard/billing" style="background:#dc2626;color:white;padding:14px 28px;text-decoration:none;border-radius:8px">Update Payment</a></div>
      </div>
    </div>`
  }),

  ticketUpdate: (name: string, ticketId: string, status: string, message: string): EmailTemplate => ({
    subject: `Support ticket #${ticketId} - ${status}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#e0e7ff;padding:20px;border-radius:16px 16px 0 0">
        <h1 style="color:#3730a3;margin:0">Support Update</h1>
      </div>
      <div style="background:#f5f3ff;padding:30px;border-radius:0 0 16px 16px">
        <p>Hi ${name}, ticket <strong>#${ticketId}</strong> updated to: <strong>${status}</strong></p>
        <div style="background:white;padding:20px;border-radius:8px;margin:20px 0"><p style="margin:0">${message}</p></div>
      </div>
    </div>`
  }),

  weeklyDigest: (name: string, stats: { creditsUsed: number; aiCalls: number; savings: number }): EmailTemplate => ({
    subject: "Your weekly CRAIverse digest 📊",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:30px;border-radius:16px 16px 0 0;text-align:center">
        <h1 style="color:white;margin:0">Weekly Digest</h1>
      </div>
      <div style="background:#f9fafb;padding:30px;border-radius:0 0 16px 16px">
        <p>Hi ${name}, here's your week:</p>
        <div style="display:flex;justify-content:space-around;margin:20px 0">
          <div style="text-align:center"><div style="font-size:24px;font-weight:bold;color:#6366f1">${stats.creditsUsed}</div><div style="color:#6b7280">Credits Used</div></div>
          <div style="text-align:center"><div style="font-size:24px;font-weight:bold;color:#6366f1">${stats.aiCalls}</div><div style="color:#6b7280">AI Calls</div></div>
          <div style="text-align:center"><div style="font-size:24px;font-weight:bold;color:#10b981">$${stats.savings}</div><div style="color:#6b7280">Estimated Savings</div></div>
        </div>
      </div>
    </div>`
  })
};

export async function sendEmail(to: string, template: EmailTemplate) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: template.subject,
      html: template.html
    });
    if (error) throw error;
    return { success: true, id: data?.id };
  } catch (error: any) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
}

export async function sendBulkEmails(recipients: { email: string; template: EmailTemplate }[]) {
  const results = await Promise.allSettled(
    recipients.map(r => sendEmail(r.email, r.template))
  );
  return results.map((r, i) => ({
    email: recipients[i].email,
    success: r.status === "fulfilled" && r.value.success
  }));
}
