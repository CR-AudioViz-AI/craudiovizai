// app/api/support/tickets/route.ts
// Support Ticket System API - Pulse → Javari → Roy Escalation
// Timestamp: Dec 11, 2025 10:44 PM EST

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Tier definitions
const ESCALATION_TIERS = {
  pulse: {
    name: 'Pulse AI',
    level: 1,
    autoResolveTarget: 0.60, // 60% target
    maxHandleTime: 300, // 5 minutes
    capabilities: ['faq', 'account', 'billing', 'password', 'basic_troubleshooting'],
  },
  javari: {
    name: 'Javari AI',
    level: 2,
    autoResolveTarget: 0.30, // 30% of remaining
    maxHandleTime: 3600, // 1 hour
    capabilities: ['code_fix', 'build_solution', 'integration', 'advanced_troubleshooting'],
  },
  human: {
    name: 'Roy / Human Agent',
    level: 3,
    autoResolveTarget: 0.10, // 10% escalated
    capabilities: ['executive_decision', 'refund', 'policy_exception', 'complex_issue'],
  },
};

// GET - List tickets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('support_tickets')
      .select('*, user:users(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) query = query.eq('user_id', userId);
    if (status) query = query.eq('status', status);
    if (tier) query = query.eq('escalation_tier', tier);

    const { data: tickets, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, tickets });

  } catch (error) {
    console.error('Fetch tickets error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// POST - Create or update ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ticketId, userId, subject, message, category, priority } = body;

    // ============================================
    // CREATE - New ticket
    // ============================================
    if (action === 'create') {
      if (!userId || !subject || !message) {
        return NextResponse.json({ error: 'userId, subject, and message required' }, { status: 400 });
      }

      // Create ticket - starts at Pulse tier
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userId,
          subject,
          category: category || 'general',
          priority: priority || 'medium',
          status: 'open',
          escalation_tier: 'pulse',
          escalation_history: [{ tier: 'pulse', timestamp: new Date().toISOString(), reason: 'New ticket' }],
        })
        .select()
        .single();

      if (error) throw error;

      // Add first message
      await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id,
        user_id: userId,
        sender_type: 'user',
        message,
      });

      // Trigger Pulse AI auto-response
      await triggerPulseAI(ticket.id, subject, message, category);

      return NextResponse.json({ success: true, ticket });
    }

    // ============================================
    // REPLY - Add message to ticket
    // ============================================
    if (action === 'reply') {
      if (!ticketId || !message) {
        return NextResponse.json({ error: 'ticketId and message required' }, { status: 400 });
      }

      const { data: msg, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          sender_type: userId ? 'user' : 'agent',
          message,
        })
        .select()
        .single();

      if (error) throw error;

      // Update ticket last activity
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      return NextResponse.json({ success: true, message: msg });
    }

    // ============================================
    // ESCALATE - Move to next tier
    // ============================================
    if (action === 'escalate') {
      if (!ticketId) {
        return NextResponse.json({ error: 'ticketId required' }, { status: 400 });
      }

      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('escalation_tier, escalation_history')
        .eq('id', ticketId)
        .single();

      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      // Determine next tier
      const currentTier = ticket.escalation_tier;
      let nextTier = currentTier;
      
      if (currentTier === 'pulse') nextTier = 'javari';
      else if (currentTier === 'javari') nextTier = 'human';

      if (nextTier === currentTier) {
        return NextResponse.json({ 
          success: false, 
          error: 'Already at highest escalation tier' 
        });
      }

      // Update escalation
      const history = ticket.escalation_history || [];
      history.push({
        tier: nextTier,
        timestamp: new Date().toISOString(),
        reason: body.reason || 'Manual escalation',
      });

      await supabase
        .from('support_tickets')
        .update({
          escalation_tier: nextTier,
          escalation_history: history,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      // Add system message
      await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        sender_type: 'system',
        message: `Ticket escalated to ${ESCALATION_TIERS[nextTier as keyof typeof ESCALATION_TIERS].name}`,
      });

      return NextResponse.json({
        success: true,
        previousTier: currentTier,
        newTier: nextTier,
        tierName: ESCALATION_TIERS[nextTier as keyof typeof ESCALATION_TIERS].name,
      });
    }

    // ============================================
    // RESOLVE - Close ticket
    // ============================================
    if (action === 'resolve') {
      if (!ticketId) {
        return NextResponse.json({ error: 'ticketId required' }, { status: 400 });
      }

      await supabase
        .from('support_tickets')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution: body.resolution || 'Resolved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      return NextResponse.json({ success: true, status: 'resolved' });
    }

    // ============================================
    // CLOSE - Close ticket without resolution
    // ============================================
    if (action === 'close') {
      if (!ticketId) {
        return NextResponse.json({ error: 'ticketId required' }, { status: 400 });
      }

      await supabase
        .from('support_tickets')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      return NextResponse.json({ success: true, status: 'closed' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Ticket operation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    );
  }
}

// Trigger Pulse AI for auto-response
async function triggerPulseAI(ticketId: string, subject: string, message: string, category: string) {
  try {
    // Simple keyword-based auto-responses for now
    // In production, this would call an AI model
    
    const responses: Record<string, string> = {
      password: "I can help you reset your password. Please click the 'Forgot Password' link on the login page, or I can send you a reset link right now. Would you like me to do that?",
      billing: "I'd be happy to help with your billing question. Could you tell me more about what you need? I can help with viewing invoices, updating payment methods, or understanding charges.",
      credits: "I see you have a question about credits. Your credits never expire on paid plans! I can help you check your balance, purchase more credits, or understand how credits are used.",
      login: "Having trouble logging in? Let's get that sorted. Try clearing your browser cache and cookies first. If that doesn't work, I can send you a password reset link.",
      cancel: "I understand you're considering cancellation. Before we proceed, is there anything I can help resolve? If you'd still like to cancel, I can guide you through the process or connect you with a team member.",
    };

    let autoResponse = "Thank you for reaching out! I'm Pulse, your first point of contact. I'm reviewing your request and will respond shortly. If I can't fully resolve your issue, I'll escalate to our specialized AI or human team.";

    // Check for keyword matches
    const lowerSubject = subject.toLowerCase();
    const lowerMessage = message.toLowerCase();
    
    for (const [keyword, response] of Object.entries(responses)) {
      if (lowerSubject.includes(keyword) || lowerMessage.includes(keyword)) {
        autoResponse = response;
        break;
      }
    }

    // Add Pulse AI response
    await supabase.from('ticket_messages').insert({
      ticket_id: ticketId,
      sender_type: 'ai',
      sender_name: 'Pulse AI',
      message: autoResponse,
    });

    // Update ticket
    await supabase
      .from('support_tickets')
      .update({
        status: 'in_progress',
        first_response_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

  } catch (error) {
    console.error('Pulse AI error:', error);
  }
}
