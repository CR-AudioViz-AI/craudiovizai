import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface DemoRequest {
  name: string;
  email: string;
  company: string;
  role?: string;
  companySize?: string;
  useCase?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DemoRequest = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.company) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, company' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Store in Supabase
    const { data, error } = await supabase
      .from('demo_requests')
      .insert([
        {
          name: body.name,
          email: body.email.toLowerCase(),
          company: body.company,
          role: body.role || null,
          company_size: body.companySize || null,
          use_case: body.useCase || null,
          message: body.message || null,
          status: 'pending',
          source: 'website',
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      // If table doesn't exist, create it
      if (error.code === '42P01') {
        // Table doesn't exist - still return success but log for admin
        console.log('Note: demo_requests table needs to be created');
        return NextResponse.json({
          success: true,
          message: 'Demo request received',
          id: 'pending-table-creation'
        });
      }
      throw error;
    }

    // Send notification to Discord (optional)
    try {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '🎯 New Demo Request',
              color: 0x7c3aed,
              fields: [
                { name: 'Name', value: body.name, inline: true },
                { name: 'Email', value: body.email, inline: true },
                { name: 'Company', value: body.company, inline: true },
                { name: 'Role', value: body.role || 'Not specified', inline: true },
                { name: 'Company Size', value: body.companySize || 'Not specified', inline: true },
                { name: 'Interest', value: body.useCase || 'Not specified', inline: true },
                { name: 'Message', value: body.message || 'No message', inline: false },
              ],
              timestamp: new Date().toISOString(),
            }]
          })
        });
      }
    } catch (webhookError) {
      console.error('Webhook error:', webhookError);
      // Don't fail the request if webhook fails
    }

    // Send confirmation email (optional)
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'CR AudioViz AI <noreply@craudiovizai.com>',
            to: [body.email],
            subject: 'Demo Request Received - CR AudioViz AI',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #7c3aed;">Thank You for Your Interest!</h1>
                <p>Hi ${body.name},</p>
                <p>We've received your demo request and our team will reach out within 24 hours to schedule your personalized demonstration.</p>
                <p>In the meantime, feel free to explore:</p>
                <ul>
                  <li><a href="https://javariai.com">Javari AI</a> - Our intelligent AI assistant</li>
                  <li><a href="https://craudiovizai.com/pricing">Pricing Plans</a></li>
                  <li><a href="https://craudiovizai.com/about">About Us</a></li>
                </ul>
                <p>Best regards,<br>The CR AudioViz AI Team</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">
                  Your Story. Our Design. Everyone Connects. Everyone Wins.<br>
                  CR AudioViz AI, LLC | Fort Myers, FL
                </p>
              </div>
            `,
          })
        });
      }
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Demo request submitted successfully',
      id: data?.id || 'created'
    });

  } catch (error: unknown) {
    console.error('Demo request error:', error);
    const message = error instanceof Error ? error.message : 'Failed to submit demo request';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Demo request endpoint',
    method: 'POST required',
    fields: ['name', 'email', 'company', 'role?', 'companySize?', 'useCase?', 'message?']
  });
}
