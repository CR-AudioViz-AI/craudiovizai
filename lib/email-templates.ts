import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'CRAIverse <noreply@craudiovizai.com>';
const SUPPORT_EMAIL = 'support@craudiovizai.com';

// Generic send email function
export async function sendEmail({
  to,
  subject,
  html,
  from = FROM_EMAIL
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html
    });
    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error('Email send exception:', err);
    return { success: false, error: err };
  }
}


// Email template styles
const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #1a1a1a;
  line-height: 1.6;
`;

const buttonStyle = `
  display: inline-block;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
`;

const footerStyle = `
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 14px;
`;

// Generate HTML wrapper
function wrapEmail(content: string, preheader: string = ''): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CRAIverse</title>
</head>
<body style="margin: 0; padding: 0; background: #f3f4f6;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6; padding: 24px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px;">CRAIverse</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your AI-Powered Creative Ecosystem</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px; ${baseStyles}">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px; background: #f9fafb; ${footerStyle}">
              <p style="margin: 0;">
                <a href="https://craudiovizai.com" style="color: #6366f1; text-decoration: none;">CRAIverse</a> |
                <a href="https://craudiovizai.com/support" style="color: #6366f1; text-decoration: none;">Support</a> |
                <a href="https://craudiovizai.com/settings" style="color: #6366f1; text-decoration: none;">Settings</a>
              </p>
              <p style="margin: 12px 0 0; font-size: 12px; color: #9ca3af;">
                © 2025 CR AudioViz AI LLC. All rights reserved.<br>
                Southwest Florida, United States
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ===== EMAIL TEMPLATES =====

export async function sendWelcomeEmail(email: string, name?: string) {
  const displayName = name || 'there';
  
  const content = `
    <h2 style="margin: 0 0 16px; color: #1a1a1a;">Welcome to CRAIverse! 🎉</h2>
    <p>Hey ${displayName},</p>
    <p>You've just joined the ultimate AI-powered creative ecosystem. Here's what's waiting for you:</p>
    
    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px; color: #4f46e5;">🎁 Your Welcome Gift</h3>
      <p style="margin: 0; font-size: 24px; font-weight: bold; color: #059669;">50 Free Credits</p>
      <p style="margin: 8px 0 0; color: #6b7280;">Use them across any of our 60+ tools and apps!</p>
    </div>
    
    <h3 style="margin: 24px 0 12px;">Get Started With:</h3>
    <ul style="padding-left: 20px;">
      <li><strong>Javari AI</strong> - Your autonomous AI development assistant</li>
      <li><strong>BarrelVerse</strong> - Discover premium spirits and cocktails</li>
      <li><strong>CardVerse</strong> - Master trading card collecting</li>
      <li><strong>Market Oracle</strong> - AI-powered market analysis</li>
      <li><strong>60+ Business Tools</strong> - From invoices to logos</li>
    </ul>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://craudiovizai.com/dashboard" style="${buttonStyle}">
        Explore Your Dashboard →
      </a>
    </div>
    
    <p>Need help getting started? Our <a href="https://craudiovizai.com/knowledge" style="color: #6366f1;">Knowledge Base</a> has everything you need, or <a href="https://craudiovizai.com/support" style="color: #6366f1;">reach out to support</a>.</p>
    
    <p>Welcome aboard! 🚀</p>
    <p style="margin: 0;"><strong>The CRAIverse Team</strong></p>
  `;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Welcome to CRAIverse! 🎉 Your 50 free credits are ready',
    html: wrapEmail(content, 'Your journey into AI-powered creativity starts now!'),
  });
}

export async function sendCreditsAddedEmail(email: string, credits: number, reason: string) {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1a1a1a;">Credits Added to Your Account! 🪙</h2>
    
    <div style="background: linear-gradient(135deg, #059669, #10b981); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">Credits Added</p>
      <p style="margin: 8px 0 0; color: white; font-size: 48px; font-weight: bold;">+${credits}</p>
    </div>
    
    <p><strong>Reason:</strong> ${reason}</p>
    
    <p>Your credits are ready to use across all CRAIverse apps and tools!</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://craudiovizai.com/credits" style="${buttonStyle}">
        View Your Balance →
      </a>
    </div>
  `;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `+${credits} credits added to your CRAIverse account`,
    html: wrapEmail(content, `${credits} credits have been added to your account.`),
  });
}

export async function sendLowCreditsEmail(email: string, balance: number) {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1a1a1a;">Running Low on Credits ⚠️</h2>
    
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0; color: #92400e;">Your credit balance is getting low:</p>
      <p style="margin: 8px 0 0; font-size: 32px; font-weight: bold; color: #d97706;">${balance} credits remaining</p>
    </div>
    
    <p>To continue using CRAIverse apps without interruption, consider adding more credits or upgrading your plan.</p>
    
    <h3 style="margin: 24px 0 12px;">Top Up Options:</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
      <tr>
        <td style="padding: 8px; background: #f3f4f6; border-radius: 8px 8px 0 0;">
          <strong>Starter</strong> - 100 credits - $5
        </td>
      </tr>
      <tr>
        <td style="padding: 8px; background: #e0e7ff;">
          <strong>Popular</strong> - 500 credits + 50 bonus - $20 ⭐
        </td>
      </tr>
      <tr>
        <td style="padding: 8px; background: #f3f4f6;">
          <strong>Pro</strong> - 1,000 credits + 150 bonus - $35
        </td>
      </tr>
      <tr>
        <td style="padding: 8px; background: #f3f4f6; border-radius: 0 0 8px 8px;">
          <strong>Enterprise</strong> - 5,000 credits + 1,000 bonus - $150
        </td>
      </tr>
    </table>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://craudiovizai.com/credits/buy" style="${buttonStyle}">
        Buy Credits →
      </a>
    </div>
  `;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Low credits alert: ${balance} credits remaining`,
    html: wrapEmail(content, 'Your CRAIverse credits are running low.'),
  });
}

export async function sendTicketCreatedEmail(email: string, ticketId: string, subject: string) {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1a1a1a;">Support Ticket Created 📩</h2>
    
    <p>We've received your support request and our team is on it!</p>
    
    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Ticket ID</p>
      <p style="margin: 4px 0 0; font-family: monospace; font-size: 18px;">#${ticketId.slice(0, 8).toUpperCase()}</p>
      <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px;">Subject</p>
      <p style="margin: 4px 0 0; font-weight: 500;">${subject}</p>
    </div>
    
    <p><strong>What happens next?</strong></p>
    <ul style="padding-left: 20px;">
      <li>Our team will review your request</li>
      <li>You'll receive an email when we respond</li>
      <li>You can also check status in your dashboard</li>
    </ul>
    
    <p>Expected response time: <strong>24-48 hours</strong></p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://craudiovizai.com/support/tickets/${ticketId}" style="${buttonStyle}">
        View Ticket Status →
      </a>
    </div>
  `;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Ticket received: ${subject}`,
    html: wrapEmail(content, 'We\'ve received your support request.'),
  });
}

export async function sendTicketResponseEmail(email: string, ticketId: string, subject: string) {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1a1a1a;">New Response to Your Ticket 💬</h2>
    
    <div style="background: #dbeafe; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0; color: #1e40af; font-weight: 500;">Our support team has responded!</p>
    </div>
    
    <p><strong>Ticket:</strong> ${subject}</p>
    <p><strong>Ticket ID:</strong> #${ticketId.slice(0, 8).toUpperCase()}</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://craudiovizai.com/support/tickets/${ticketId}" style="${buttonStyle}">
        View Response →
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">You can reply directly from the ticket page.</p>
  `;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Response to your ticket: ${subject}`,
    html: wrapEmail(content, 'We\'ve responded to your support ticket.'),
  });
}

export async function sendPaymentReceiptEmail(
  email: string,
  amount: number,
  credits: number,
  transactionId: string
) {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1a1a1a;">Payment Received ✅</h2>
    
    <p>Thank you for your purchase! Here's your receipt:</p>
    
    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">Amount Paid</span>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
            $${(amount / 100).toFixed(2)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span style="color: #6b7280;">Credits Added</span>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #059669;">
            +${credits}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #6b7280;">Transaction ID</span>
          </td>
          <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px;">
            ${transactionId}
          </td>
        </tr>
      </table>
    </div>
    
    <p>Your credits are ready to use immediately!</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://craudiovizai.com/dashboard" style="${buttonStyle}">
        Start Using Your Credits →
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      Questions about your purchase? <a href="https://craudiovizai.com/support" style="color: #6366f1;">Contact support</a>
    </p>
  `;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Receipt: $${(amount / 100).toFixed(2)} - ${credits} credits added`,
    html: wrapEmail(content, 'Thank you for your purchase!'),
  });
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1a1a1a;">Reset Your Password 🔐</h2>
    
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetLink}" style="${buttonStyle}">
        Reset Password →
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour.</p>
    
    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>Didn't request this?</strong><br>
        If you didn't request a password reset, you can safely ignore this email. Your password won't change unless you click the link above.
      </p>
    </div>
  `;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset your CRAIverse password',
    html: wrapEmail(content, 'Reset your password to regain access to your account.'),
  });
}

export async function sendEnhancementStatusEmail(
  email: string,
  title: string,
  status: string,
  response?: string
) {
  const statusColors: Record<string, string> = {
    'planned': '#3b82f6',
    'in_progress': '#f59e0b',
    'completed': '#059669',
    'declined': '#ef4444',
  };

  const statusEmojis: Record<string, string> = {
    'planned': '📋',
    'in_progress': '🚧',
    'completed': '✅',
    'declined': '❌',
  };

  const content = `
    <h2 style="margin: 0 0 16px; color: #1a1a1a;">Enhancement Request Update ${statusEmojis[status] || '📝'}</h2>
    
    <p>Your enhancement request has been updated:</p>
    
    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Request</p>
      <p style="margin: 4px 0 0; font-weight: 600;">${title}</p>
      <p style="margin: 16px 0 0; color: #6b7280; font-size: 14px;">Status</p>
      <p style="margin: 4px 0 0;">
        <span style="display: inline-block; background: ${statusColors[status] || '#6b7280'}; color: white; padding: 4px 12px; border-radius: 16px; font-size: 14px; font-weight: 500;">
          ${status.replace('_', ' ').toUpperCase()}
        </span>
      </p>
    </div>
    
    ${response ? `
      <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; color: #1e40af; font-weight: 500;">Official Response:</p>
        <p style="margin: 8px 0 0; color: #1e3a8a;">${response}</p>
      </div>
    ` : ''}
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://craudiovizai.com/enhancements" style="${buttonStyle}">
        View All Requests →
      </a>
    </div>
    
    <p>Thank you for helping us improve CRAIverse!</p>
  `;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Enhancement ${status}: ${title}`,
    html: wrapEmail(content, `Your enhancement request is now ${status}.`),
  });
}

// Export all templates
export const emailTemplates = {
  sendWelcomeEmail,
  sendCreditsAddedEmail,
  sendLowCreditsEmail,
  sendTicketCreatedEmail,
  sendTicketResponseEmail,
  sendPaymentReceiptEmail,
  sendPasswordResetEmail,
  sendEnhancementStatusEmail,
};
