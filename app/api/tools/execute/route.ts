// app/api/tools/execute/route.ts
// Unified Tools Execution API - Javari's Gateway
// All AI operations go through this single endpoint
// Timestamp: Dec 11, 2025 10:50 PM EST

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TOOLS_REGISTRY, CREDIT_COSTS } from '@/lib/pricing/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// API Provider handlers
const providers = {
  replicate: async (model: string, input: any) => {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input,
      }),
    });
    return response.json();
  },
  
  elevenlabs: async (endpoint: string, input: any) => {
    const response = await fetch(`https://api.elevenlabs.io/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    return response.json();
  },
  
  anthropic: async (messages: any[], system?: string) => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'Content-Type': 'application/json',
        'anthropic-version': '2024-01-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system,
        messages,
      }),
    });
    return response.json();
  },
  
  openai: async (messages: any[], model = 'gpt-4-turbo-preview') => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages }),
    });
    return response.json();
  },
  
  deepgram: async (audioUrl: string) => {
    const response = await fetch(
      `https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: audioUrl }),
      }
    );
    return response.json();
  },
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { tool_id, tier, input, user_id, session_id } = body;

    // 1. Validate tool exists
    const tool = TOOLS_REGISTRY.find(t => t.id === tool_id);
    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found', code: 'INVALID_TOOL' },
        { status: 400 }
      );
    }

    // 2. Calculate credits required
    let creditsRequired = tool.base_credits;
    if (tier && tool.tiers && tool.tiers[tier]) {
      creditsRequired = tool.tiers[tier].credits;
    }

    // 3. Check user has sufficient credits
    const { data: creditData } = await supabase
      .rpc('check_user_credits', { p_user_id: user_id });
    
    if (!creditData || creditData < creditsRequired) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          code: 'INSUFFICIENT_CREDITS',
          required: creditsRequired,
          available: creditData || 0,
        },
        { status: 402 }
      );
    }

    // 4. Create task record
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id,
        tool_id,
        status: 'processing',
        input,
        credits_charged: creditsRequired,
        started_at: new Date().toISOString(),
        javari_session_id: session_id,
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // 5. Deduct credits (pre-charge)
    const { data: deducted } = await supabase.rpc('deduct_user_credits', {
      p_user_id: user_id,
      p_credits: creditsRequired,
      p_app_id: tool_id,
      p_app_name: tool.name,
      p_task_id: task.id,
    });

    if (!deducted) {
      // Update task as failed
      await supabase.from('tasks')
        .update({ status: 'failed', error: 'Credit deduction failed' })
        .eq('id', task.id);
      
      return NextResponse.json(
        { error: 'Failed to deduct credits', code: 'CREDIT_ERROR' },
        { status: 500 }
      );
    }

    // 6. Execute the tool via appropriate provider
    let result: any;
    let apiCost = 0;

    try {
      switch (tool.api_provider) {
        case 'replicate':
          const model = tier && tool.tiers?.[tier]?.model 
            ? tool.tiers[tier].model 
            : input.model || 'stability-ai/sdxl:latest';
          result = await providers.replicate(model, input);
          apiCost = 0.01; // Estimate, actual from webhook
          break;
          
        case 'elevenlabs':
          result = await providers.elevenlabs(input.endpoint || 'text-to-speech', input);
          apiCost = 0.015;
          break;
          
        case 'anthropic':
          result = await providers.anthropic(input.messages, input.system);
          apiCost = (result.usage?.input_tokens + result.usage?.output_tokens) * 0.000015;
          break;
          
        case 'openai':
          result = await providers.openai(input.messages, input.model);
          apiCost = 0.01;
          break;
          
        case 'deepgram':
          result = await providers.deepgram(input.audio_url);
          apiCost = 0.006 * (input.duration_minutes || 1);
          break;
          
        case 'custom':
          // Handle custom/internal tools
          result = await handleCustomTool(tool_id, input);
          apiCost = 0.001;
          break;
          
        default:
          throw new Error(`Unknown provider: ${tool.api_provider}`);
      }
    } catch (apiError) {
      // API call failed - refund credits
      await supabase.rpc('refund_user_credits', {
        p_user_id: user_id,
        p_credits: creditsRequired,
        p_reason: `API error: ${apiError instanceof Error ? apiError.message : 'Unknown'}`,
        p_task_id: task.id,
      });

      await supabase.from('tasks')
        .update({ 
          status: 'refunded', 
          error: apiError instanceof Error ? apiError.message : 'API call failed',
          completed_at: new Date().toISOString(),
          credits_refunded: creditsRequired,
        })
        .eq('id', task.id);

      return NextResponse.json(
        { 
          error: 'Tool execution failed, credits refunded',
          code: 'EXECUTION_ERROR',
          task_id: task.id,
        },
        { status: 500 }
      );
    }

    // 7. Handle async results (some APIs return immediately, some need polling)
    const isAsync = result.status === 'starting' || result.status === 'processing';
    
    // 8. Update task with result
    const processingTime = Date.now() - startTime;
    await supabase.from('tasks')
      .update({
        status: isAsync ? 'processing' : 'completed',
        output: result,
        api_provider: tool.api_provider,
        api_request_id: result.id,
        api_cost_usd: apiCost,
        completed_at: isAsync ? null : new Date().toISOString(),
        processing_time_ms: processingTime,
      })
      .eq('id', task.id);

    // 9. Update tool usage stats
    await supabase.from('tools')
      .update({
        total_uses: supabase.sql`total_uses + 1`,
        total_credits_consumed: supabase.sql`total_credits_consumed + ${creditsRequired}`,
      })
      .eq('id', tool_id);

    // 10. If completed, create asset
    if (!isAsync && result.output) {
      const assetType = tool.category === 'image' ? 'image' 
        : tool.category === 'video' ? 'video'
        : tool.category === 'audio' ? 'audio'
        : 'other';
      
      await supabase.from('user_assets').insert({
        user_id,
        task_id: task.id,
        type: assetType,
        name: `${tool.name} - ${new Date().toLocaleDateString()}`,
        public_url: result.output,
        generation_params: input,
      });
    }

    return NextResponse.json({
      success: true,
      task_id: task.id,
      status: isAsync ? 'processing' : 'completed',
      result: isAsync ? { prediction_id: result.id } : result,
      credits_used: creditsRequired,
      processing_time_ms: processingTime,
    });

  } catch (error) {
    console.error('Tools API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// Handle custom/internal tools
async function handleCustomTool(toolId: string, input: any) {
  switch (toolId) {
    case 'qr-generator':
      // Use a simple QR library
      return { output: `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(input.data)}&size=300x300` };
    
    case 'meme-generator':
      // Custom meme logic
      return { output: input.image_url, text: input.text };
    
    default:
      throw new Error(`Custom tool ${toolId} not implemented`);
  }
}

// GET endpoint to check task status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('task_id');

  if (!taskId) {
    return NextResponse.json({ error: 'task_id required' }, { status: 400 });
  }

  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // If processing with Replicate, check status
  if (task.status === 'processing' && task.api_provider === 'replicate' && task.api_request_id) {
    const response = await fetch(
      `https://api.replicate.com/v1/predictions/${task.api_request_id}`,
      {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      }
    );
    const prediction = await response.json();

    if (prediction.status === 'succeeded') {
      // Update task
      await supabase.from('tasks')
        .update({
          status: 'completed',
          output: prediction,
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      // Create asset
      await supabase.from('user_assets').insert({
        user_id: task.user_id,
        task_id: taskId,
        type: 'image',
        public_url: prediction.output?.[0] || prediction.output,
        generation_params: task.input,
      });

      return NextResponse.json({
        status: 'completed',
        output: prediction.output,
      });
    }

    if (prediction.status === 'failed') {
      // Refund credits
      await supabase.rpc('refund_user_credits', {
        p_user_id: task.user_id,
        p_credits: task.credits_charged,
        p_reason: `API failed: ${prediction.error}`,
        p_task_id: taskId,
      });

      await supabase.from('tasks')
        .update({
          status: 'refunded',
          error: prediction.error,
          credits_refunded: task.credits_charged,
        })
        .eq('id', taskId);

      return NextResponse.json({
        status: 'failed',
        error: prediction.error,
        credits_refunded: true,
      });
    }

    return NextResponse.json({
      status: 'processing',
      progress: prediction.logs,
    });
  }

  return NextResponse.json({
    status: task.status,
    output: task.output,
    error: task.error,
  });
}
