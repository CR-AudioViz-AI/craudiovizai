// ================================================================================
// JAVARI LLM PROVIDER ROUTER
// Supports OpenAI, Anthropic, and future providers
// ================================================================================

export type LLMProvider = 'openai' | 'anthropic' | 'azure' | 'local';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: LLMProvider;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  latency_ms: number;
  finish_reason: string;
}

// Get config from environment
export function getLLMConfig(): LLMConfig {
  const provider = (process.env.JAVARI_LLM_PROVIDER || 'openai') as LLMProvider;
  const model = process.env.JAVARI_LLM_MODEL || 'gpt-4o-mini';
  const apiKey = process.env.JAVARI_LLM_API_KEY || process.env.OPENAI_API_KEY || '';
  
  return {
    provider,
    model,
    apiKey,
    maxTokens: parseInt(process.env.JAVARI_LLM_MAX_TOKENS || '4096'),
    temperature: parseFloat(process.env.JAVARI_LLM_TEMPERATURE || '0.7'),
  };
}

// OpenAI completion
async function openaiCompletion(
  messages: LLMMessage[],
  config: LLMConfig
): Promise<LLMResponse> {
  const startTime = Date.now();
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    content: data.choices[0].message.content,
    model: data.model,
    provider: 'openai',
    tokens: {
      input: data.usage.prompt_tokens,
      output: data.usage.completion_tokens,
      total: data.usage.total_tokens,
    },
    latency_ms: Date.now() - startTime,
    finish_reason: data.choices[0].finish_reason,
  };
}

// Anthropic completion
async function anthropicCompletion(
  messages: LLMMessage[],
  config: LLMConfig
): Promise<LLMResponse> {
  const startTime = Date.now();
  
  // Convert messages to Anthropic format
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const chatMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      system: systemMessage,
      messages: chatMessages,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    content: data.content[0].text,
    model: data.model,
    provider: 'anthropic',
    tokens: {
      input: data.usage.input_tokens,
      output: data.usage.output_tokens,
      total: data.usage.input_tokens + data.usage.output_tokens,
    },
    latency_ms: Date.now() - startTime,
    finish_reason: data.stop_reason,
  };
}

// Main router function
export async function callLLM(
  messages: LLMMessage[],
  configOverride?: Partial<LLMConfig>
): Promise<LLMResponse> {
  const config = { ...getLLMConfig(), ...configOverride };
  
  switch (config.provider) {
    case 'openai':
      return openaiCompletion(messages, config);
    case 'anthropic':
      return anthropicCompletion(messages, config);
    case 'azure':
      // Azure OpenAI - similar to OpenAI but different endpoint
      throw new Error('Azure provider not yet implemented');
    case 'local':
      // Local model (e.g., Ollama)
      throw new Error('Local provider not yet implemented');
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

// Helper to estimate tokens (rough approximation)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Helper to check if response should trigger memory extraction
export function shouldExtractMemory(response: string): boolean {
  const memoryTriggers = [
    /remember that/i,
    /note that/i,
    /important:/i,
    /always/i,
    /preference/i,
    /i like/i,
    /i prefer/i,
    /my .* is/i,
  ];
  
  return memoryTriggers.some(pattern => pattern.test(response));
}
