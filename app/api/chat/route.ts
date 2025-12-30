// /app/api/chat/route.ts
// Javari AI Chat API - CR AudioViz AI
// Multi-provider AI chat with credit deduction

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// AI Provider configurations
const AI_PROVIDERS = {
  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-sonnet-20241022',
    apiKey: process.env.ANTHROPIC_API_KEY
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4-turbo-preview',
    apiKey: process.env.OPENAI_API_KEY
  },
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-70b-versatile',
    apiKey: process.env.GROQ_API_KEY
  }
};

// Credit costs per message
const CREDIT_COST = 1;

export async function POST(req: NextRequest) {
  try {
    const { messages, userId, provider = 'claude' } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    // Check user's credit balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, subscription_tier')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (profile.credits < CREDIT_COST) {
      return NextResponse.json({
        error: 'Insufficient credits',
        credits: profile.credits,
        required: CREDIT_COST
      }, { status: 402 });
    }

    // Get AI provider config
    const aiConfig = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS] || AI_PROVIDERS.claude;

    if (!aiConfig.apiKey) {
      // Fallback to Groq (free tier)
      const groqConfig = AI_PROVIDERS.groq;
      if (groqConfig.apiKey) {
        return await callGroq(messages, userId, profile.credits);
      }
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
    }

    // Call the AI provider
    let response;
    if (provider === 'claude') {
      response = await callClaude(messages, aiConfig);
    } else {
      response = await callOpenAI(messages, aiConfig);
    }

    // Deduct credits
    await supabase.rpc('deduct_user_credits', {
      p_user_id: userId,
      p_amount: CREDIT_COST
    });

    // Log the AI request
    await supabase.from('ai_requests').insert({
      user_id: userId,
      provider,
      model: aiConfig.model,
      input_tokens: response.inputTokens || 0,
      output_tokens: response.outputTokens || 0,
      credits_used: CREDIT_COST
    });

    return NextResponse.json({
      message: response.content,
      credits_used: CREDIT_COST,
      credits_remaining: profile.credits - CREDIT_COST
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}

async function callClaude(messages: any[], config: any) {
  const systemPrompt = `You are Javari, a friendly and helpful AI assistant created by CR AudioViz AI. 
You help users with creative tasks, answer questions, and provide assistance.
Be conversational, warm, and helpful. Use emojis occasionally to be friendly.
Keep responses concise but thorough.`;

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return {
    content: data.content[0].text,
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0
  };
}

async function callOpenAI(messages: any[], config: any) {
  const systemPrompt = `You are Javari, a friendly and helpful AI assistant created by CR AudioViz AI. 
You help users with creative tasks, answer questions, and provide assistance.
Be conversational, warm, and helpful. Use emojis occasionally to be friendly.
Keep responses concise but thorough.`;

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return {
    content: data.choices[0].message.content,
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0
  };
}

async function callGroq(messages: any[], userId: string, currentCredits: number) {
  const config = AI_PROVIDERS.groq;
  const systemPrompt = `You are Javari, a friendly and helpful AI assistant created by CR AudioViz AI. 
You help users with creative tasks, answer questions, and provide assistance.
Be conversational, warm, and helpful. Use emojis occasionally to be friendly.
Keep responses concise but thorough.`;

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  // Deduct credits
  await supabase.rpc('deduct_user_credits', {
    p_user_id: userId,
    p_amount: CREDIT_COST
  });

  return NextResponse.json({
    message: data.choices[0].message.content,
    credits_used: CREDIT_COST,
    credits_remaining: currentCredits - CREDIT_COST
  });
}
