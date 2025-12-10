/**
 * CR AudioViz AI - Javari AI Chat API
 * 
 * Streaming chat API that:
 * - Uses Claude API for responses
 * - Supports streaming for real-time output
 * - Context-aware based on page
 * - Credit tracking (coming soon)
 * 
 * @timestamp Tuesday, December 10, 2024 - 12:55 AM EST
 * @author Claude (for Roy Henderson)
 */

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// System prompt for Javari
const SYSTEM_PROMPT = `You are Javari AI, the intelligent assistant for CR AudioViz AI platform.

## About CR AudioViz AI
CR AudioViz AI is a comprehensive creative platform offering:
- 60+ Professional Creative Tools (Logo Generator, Website Builder, eBook Creator, etc.)
- 1200+ Games
- CRAIverse Virtual World
- Universal Credit System
- AI-powered assistance

## Your Role
You are helpful, friendly, and knowledgeable. You help users:
- Navigate the platform
- Choose the right tools for their needs
- Understand pricing and credits
- Get started with creative projects
- Solve problems and answer questions

## Guidelines
- Be conversational and warm
- Keep responses concise but helpful (2-3 paragraphs max unless asked for more)
- Use emojis sparingly but appropriately
- If you don't know something specific about the platform, be honest
- Encourage users to explore the platform's features
- Never make up features that don't exist

## Company Info
- Company: CR AudioViz AI, LLC
- Location: Fort Myers, Florida
- Founded by: Cindy and Roy Henderson
- Mission: "Your Story. Our Design."
- Credits: Universal currency across all tools
- Plans: Free, Basic ($9.99), Pro ($24.99), Enterprise ($99.99)

Be helpful, be accurate, and help users succeed with their creative projects!`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, pageContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add page context to system prompt
    const contextualSystemPrompt = pageContext 
      ? `${SYSTEM_PROMPT}\n\n## Current Context\nThe user is currently on the ${pageContext} page. Tailor your responses to be relevant to what they're viewing.`
      : SYSTEM_PROMPT;

    // Format messages for Claude API
    const formattedMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Create streaming response
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: contextualSystemPrompt,
      messages: formattedMessages,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Javari chat error:', error);
    
    // Check for specific error types
    if (error instanceof Anthropic.APIError) {
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Health check endpoint
export async function GET() {
  return new Response(
    JSON.stringify({ 
      status: 'ok', 
      service: 'Javari AI Chat',
      timestamp: new Date().toISOString() 
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}
