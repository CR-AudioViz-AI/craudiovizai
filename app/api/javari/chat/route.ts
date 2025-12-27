import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SYSTEM_PROMPT = `You are Javari, the AI assistant for CR AudioViz AI (CRAIverse). You help users with:
1. Product Questions - features, pricing, capabilities of 60+ AI-powered tools
2. Technical Support - troubleshoot issues, guide through features
3. Account Help - billing, subscriptions, credits
4. App Guidance - help users find the right tools

Key Info:
- Free: 100 credits/month, Pro: $19/mo 1000 credits, Business: $49/mo unlimited
- Support available at /dashboard/tickets
- Be helpful, friendly, and concise
- Never make up information`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, conversation_id, user_id, session_id, context } = body;

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Get or create conversation
    let convId = conversation_id || session_id;
    if (!convId) {
      const { data: conv } = await supabase
        .from("craiverse_javari_conversations")
        .insert({
          user_id: user_id || null,
          source_app: context?.source_app || "chat"
        })
        .select("id")
        .single();
      convId = conv?.id;
    }

    // Get history
    let messages: any[] = [];
    if (convId) {
      const { data: history } = await supabase
        .from("craiverse_javari_messages")
        .select("role, content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
        .limit(10);
      
      if (history) {
        messages = history.map(m => ({ role: m.role, content: m.content }));
      }
    }

    messages.push({ role: "user", content: message });

    // Call Anthropic
    let response = "";
    let provider = "anthropic";

    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const completion = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: messages.map(m => ({ 
          role: m.role as "user" | "assistant", 
          content: m.content 
        }))
      });
      response = completion.content[0].type === "text" ? completion.content[0].text : "";
    } catch (e: any) {
      console.error("Anthropic error:", e.message);
      return NextResponse.json({ 
        error: "AI service temporarily unavailable",
        fallback_response: "I apologize, I am having trouble responding. Please try again."
      }, { status: 503 });
    }

    // Save messages
    if (convId) {
      await supabase.from("craiverse_javari_messages").insert([
        { conversation_id: convId, role: "user", content: message },
        { conversation_id: convId, role: "assistant", content: response, provider }
      ]);
    }

    return NextResponse.json({
      response,
      conversation_id: convId,
      provider
    });

  } catch (error: any) {
    console.error("Javari chat error:", error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
