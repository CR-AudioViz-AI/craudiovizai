// ================================================================================
// JAVARI CAPSULE API - /api/javari/memory/capsule/generate
// Generate conversation capsule for memory compression
// ================================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

const generateRequestId = () => `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  
  try {
    const body = await request.json();
    const {
      conversation_id,
      tenant_id = '00000000-0000-0000-0000-000000000000',
      user_id,
      store_in_car = false,
    } = body;
    
    if (!conversation_id) {
      return NextResponse.json({ error: 'conversation_id required', request_id: requestId }, { status: 400 });
    }
    
    // Get conversation
    const { data: conv } = await supabase
      .from('javari_conversations')
      .select('*')
      .eq('id', conversation_id)
      .single();
    
    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found', request_id: requestId }, { status: 404 });
    }
    
    // Get messages
    const { data: messages } = await supabase
      .from('javari_messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true });
    
    // Get memory items
    const { data: memories } = await supabase
      .from('javari_memory_items')
      .select('category, key, value, importance')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)
      .eq('is_pinned', true)
      .order('importance', { ascending: false });
    
    // Build capsule
    const capsuleLines = [
      '# Conversation Capsule',
      `Conversation: ${conv.title}`,
      `Thread: ${conv.thread_number}`,
      `Messages: ${messages?.length || 0}`,
      `Generated: ${new Date().toISOString()}`,
      '',
    ];
    
    // Add key discussion points
    capsuleLines.push('## Key Discussion Points');
    const keyPoints = new Set<string>();
    messages?.forEach((m, i) => {
      if (m.role === 'user' && m.content.length > 20) {
        const point = m.content.slice(0, 150).replace(/\n/g, ' ');
        if (!keyPoints.has(point)) {
          keyPoints.add(point);
        }
      }
    });
    Array.from(keyPoints).slice(0, 10).forEach(p => {
      capsuleLines.push(`- ${p}${p.length >= 150 ? '...' : ''}`);
    });
    
    // Add memory items
    if (memories && memories.length > 0) {
      capsuleLines.push('', '## Active Memory Items');
      memories.slice(0, 15).forEach(m => {
        capsuleLines.push(`- [${m.category}:${m.importance}] ${m.key}: ${m.value}`);
      });
    }
    
    // Add conversation stats
    capsuleLines.push('', '## Stats');
    capsuleLines.push(`- Total messages: ${conv.message_count}`);
    capsuleLines.push(`- Token estimate: ${conv.token_estimate}`);
    capsuleLines.push(`- Avg latency: ${conv.latency_ms_avg}ms`);
    
    const capsuleText = capsuleLines.join('\n');
    const capsuleHash = Buffer.from(capsuleText).toString('base64').slice(0, 32);
    
    // Mark previous capsules as not current
    await supabase
      .from('javari_memory_capsules')
      .update({ is_current: false })
      .eq('conversation_id', conversation_id);
    
    // Store capsule
    const carPath = store_in_car 
      ? `memory/capsules/${conversation_id}_${Date.now()}.md`
      : null;
    
    const { data: capsule, error } = await supabase
      .from('javari_memory_capsules')
      .insert({
        tenant_id,
        user_id,
        conversation_id,
        capsule_text: capsuleText,
        capsule_hash: capsuleHash,
        generated_by: 'system',
        token_count: Math.ceil(capsuleText.length / 4),
        is_current: true,
        car_path: carPath,
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message, request_id: requestId }, { status: 500 });
    }
    
    // Update conversation with capsule reference
    await supabase
      .from('javari_conversations')
      .update({
        last_capsule_id: capsule.id,
        last_capsule_version: (conv.last_capsule_version || 0) + 1,
        last_summary_at: new Date().toISOString(),
      })
      .eq('id', conversation_id);
    
    // Log event
    await supabase.from('javari_memory_events').insert({
      tenant_id,
      user_id,
      conversation_id,
      event_type: 'capsule_generated',
      payload: { capsule_id: capsule.id, token_count: capsule.token_count },
      request_id: requestId,
    });
    
    return NextResponse.json({
      request_id: requestId,
      capsule: {
        id: capsule.id,
        text: capsuleText,
        hash: capsuleHash,
        token_count: capsule.token_count,
        car_path: carPath,
      },
      conversation: {
        id: conversation_id,
        title: conv.title,
        thread_number: conv.thread_number,
      },
    });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message, request_id: requestId }, { status: 500 });
  }
}
