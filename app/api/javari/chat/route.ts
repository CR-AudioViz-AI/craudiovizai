// app/api/javari/chat/route.ts
// Javari Chat API - Processes user messages and executes tools
// Timestamp: Dec 11, 2025 11:00 PM EST

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// System prompt that defines Javari's capabilities
const JAVARI_SYSTEM_PROMPT = `You are Javari, the AI assistant for CR AudioViz AI platform.

CORE IDENTITY:
- You are helpful, creative, and efficient
- You help users create images, videos, music, and more using AI tools
- You manage credits and explain features clearly
- You embody "Your Story. Our Design" philosophy

CAPABILITIES YOU CAN USE:
- Image generation (image-generator, image-editor, background-remover, upscaler)
- Video creation (video-generator, lipsync)
- Audio/Voice (text-to-speech, voice-clone, music-generator, transcription)
- Text/Documents (ai-writer, code-generator, document-analyzer, translator)
- Utility (qr-generator, meme-generator)

CREDIT SYSTEM:
- Every action costs credits
- Credits NEVER expire on paid plans
- Always confirm credit cost before executing
- Automatically refund if operations fail

COMMUNICATION STYLE:
- Be concise but friendly
- Explain costs before actions
- Offer alternatives if user lacks credits
- Celebrate user creations

When user asks to create something:
1. Confirm what they want
2. Tell them the credit cost
3. Execute if they agree (or if implicit)
4. Show the result

TOOLS FORMAT:
To use a tool, respond with JSON in this format:
{"tool": "tool-id", "params": {...}, "credits": X}

User context will be provided with each message.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, user_id, message, context } = body;

    // 1. Log the user message
    await supabase.from('javari_messages').insert({
      session_id,
      user_id,
      role: 'user',
      content: message,
    });

    // 2. Get conversation history
    const { data: history } = await supabase
      .from('javari_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(20);

    // 3. Build messages for LLM
    const messages = [
      { role: 'system', content: JAVARI_SYSTEM_PROMPT },
      { 
        role: 'system', 
        content: `User context:
- Credits available: ${context.credits_available}
- Current page: ${context.current_page}
- User preferences: ${JSON.stringify(context.preferences || {})}` 
      },
      ...(history || []).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // 4. Call Anthropic API
    const llmResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'Content-Type': 'application/json',
        'anthropic-version': '2024-01-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: JAVARI_SYSTEM_PROMPT + `\n\nUser context:
- Credits available: ${context.credits_available}
- Current page: ${context.current_page}`,
        messages: messages.slice(1).filter(m => m.role !== 'system'),
      }),
    });

    const llmData = await llmResponse.json();
    let responseText = llmData.content?.[0]?.text || 'I apologize, I encountered an issue.';
    let toolCalls: any[] = [];
    let creditsUsed = 0;

    // 5. Check if response contains tool calls
    const toolMatch = responseText.match(/\{"tool":\s*"([^"]+)",\s*"params":\s*(\{[^}]+\}),\s*"credits":\s*(\d+)\}/);
    
    if (toolMatch) {
      const toolId = toolMatch[1];
      const toolParams = JSON.parse(toolMatch[2]);
      const toolCredits = parseInt(toolMatch[3]);

      // Execute the tool
      try {
        const toolResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://craudiovizai.com'}/api/tools/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tool_id: toolId,
            input: toolParams,
            user_id,
            session_id,
          }),
        });

        const toolResult = await toolResponse.json();

        if (toolResult.success) {
          toolCalls.push({
            name: toolId,
            result: toolResult,
          });
          creditsUsed = toolResult.credits_used;

          // Generate a friendly response about the result
          const followUpResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': process.env.ANTHROPIC_API_KEY!,
              'Content-Type': 'application/json',
              'anthropic-version': '2024-01-01',
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 512,
              messages: [{
                role: 'user',
                content: `The tool "${toolId}" completed successfully. Result: ${JSON.stringify(toolResult)}. Generate a brief, friendly response to the user about their creation. Include the output URL if available.`,
              }],
            }),
          });
          
          const followUp = await followUpResponse.json();
          responseText = followUp.content?.[0]?.text || `Done! I used ${creditsUsed} credits. Here's your result.`;
        } else {
          responseText = `I tried to help, but encountered an issue: ${toolResult.error}. Your credits were not charged.`;
        }
      } catch (toolError) {
        responseText = `I apologize, I couldn't complete that action. Please try again.`;
      }
    }

    // 6. Log assistant response
    await supabase.from('javari_messages').insert({
      session_id,
      user_id,
      role: 'assistant',
      content: responseText,
      tool_calls: toolCalls.length > 0 ? toolCalls : null,
    });

    // 7. Update session stats
    await supabase
      .from('javari_sessions')
      .update({
        messages_count: supabase.sql`messages_count + 2`,
        credits_used: supabase.sql`credits_used + ${creditsUsed}`,
        tasks_created: toolCalls.length > 0 ? supabase.sql`tasks_created + 1` : undefined,
      })
      .eq('id', session_id);

    return NextResponse.json({
      response: responseText,
      tool_calls: toolCalls,
      credits_used: creditsUsed,
    });

  } catch (error) {
    console.error('Javari chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
