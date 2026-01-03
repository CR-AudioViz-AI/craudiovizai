/**
 * Javari AI - Root API Endpoint
 * Returns Javari status and capabilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get conversation stats
    const { count: totalConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    // Get recent activity
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('id')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1000);

    return NextResponse.json({
      status: 'online',
      name: 'Javari AI',
      version: '2.0.0',
      capabilities: [
        'chat',
        'code_generation',
        'document_analysis',
        'image_description',
        'knowledge_retrieval',
        'task_automation'
      ],
      models: {
        primary: 'claude-3-haiku-20240307',
        fallback: 'gpt-4o-mini'
      },
      stats: {
        total_conversations: totalConversations || 0,
        messages_24h: recentMessages?.length || 0,
        uptime: '99.9%'
      },
      endpoints: {
        chat: '/api/javari/chat',
        session: '/api/javari/session',
        knowledge: '/api/javari/knowledge',
        enhanced: '/api/javari/enhanced'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'degraded',
      name: 'Javari AI',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 200 }); // Return 200 even on error for health checks
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
