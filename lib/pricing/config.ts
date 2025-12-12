// lib/pricing/config.ts
// Pricing Configuration with Actual Stripe IDs
// Timestamp: Dec 12, 2025 12:25 AM EST

// ============================================
// API COSTS (What We Pay)
// ============================================
export const API_COSTS = {
  image: {
    standard: 0.003,    // ~512x512
    hd: 0.008,          // ~1024x1024
    premium: 0.02,      // ~2048x2048 (Flux/SDXL)
  },
  video: {
    short: 0.05,        // 5 seconds
    medium: 0.15,       // 15 seconds
    long: 0.35,         // 30 seconds
  },
  voice: {
    tts_per_1k_chars: 0.015,
    clone_setup: 0.50,
    clone_per_1k_chars: 0.03,
  },
  music: {
    short: 0.05,        // 30 seconds
    full: 0.20,         // 3 minutes
  },
  llm: {
    input_per_1k: 0.002,
    output_per_1k: 0.006,
    premium_input: 0.015,
    premium_output: 0.03,
  },
  transcription: {
    per_minute: 0.006,
  },
};

// ============================================
// CREDIT COSTS (What Users Pay)
// Target: 5-10x markup, 1 credit = ~$0.10 value
// ============================================
export const CREDIT_COSTS = {
  image: {
    standard: 5,        // Cost: $0.003, Revenue: $0.50, Margin: 16.6x
    hd: 10,             // Cost: $0.008, Revenue: $1.00, Margin: 12.5x
    premium: 25,        // Cost: $0.02, Revenue: $2.50, Margin: 12.5x
  },
  video: {
    short: 25,          // Cost: $0.05, Revenue: $2.50, Margin: 5x
    medium: 50,         // Cost: $0.15, Revenue: $5.00, Margin: 3.3x
    long: 100,          // Cost: $0.35, Revenue: $10.00, Margin: 2.8x
  },
  voice: {
    tts: 5,             // Per 1000 chars, Cost: $0.015, Revenue: $0.50
    clone: 100,         // Setup fee
  },
  music: {
    short: 15,          // Cost: $0.05, Revenue: $1.50
    full: 50,           // Cost: $0.20, Revenue: $5.00
  },
  chat: {
    standard: 1,        // Per message
    premium: 3,         // With tools
  },
  transcription: {
    per_minute: 2,      // Cost: $0.006, Revenue: $0.20
  },
  utility: {
    qr_code: 1,
    meme: 2,
  },
};

// ============================================
// STRIPE PRODUCTS & PRICES (LIVE)
// ============================================
export const STRIPE_PRODUCTS = {
  subscriptions: {
    starter: {
      productId: 'prod_TalsrMBNbwFVke',
      priceId: 'price_1SdaKx7YeQ1dZTUvCeaYqKXh',
      name: 'Starter',
      price: 9.99,
      credits: 150,
      features: ['150 credits/month', 'Credits never expire', '60+ AI tools', 'Email support'],
    },
    pro: {
      productId: 'prod_Tals9vp5UrtSCr',
      priceId: 'price_1SdaL67YeQ1dZTUv43H6YxGq',
      name: 'Pro',
      price: 29.99,
      credits: 500,
      features: ['500 credits/month', 'Credits never expire', '60+ AI tools', 'Priority support', 'Early access'],
    },
    premium: {
      productId: 'prod_TalsiAi3IOLOaT',
      priceId: 'price_1SdaLG7YeQ1dZTUvCzgdjaTp',
      name: 'Premium',
      price: 99.99,
      credits: 2000,
      features: ['2,000 credits/month', 'Credits never expire', '60+ AI tools', 'VIP support', 'Early access', 'White-label options'],
    },
  },
  creditPacks: {
    small: {
      productId: 'prod_Talt46pfyza9t1',
      priceId: 'price_1SdaLR7YeQ1dZTUvX4qPsy3c',
      name: 'Starter Pack',
      price: 4.99,
      credits: 50,
      bonus: 0,
      pricePerCredit: 0.0998,
    },
    medium: {
      productId: 'prod_TaltQaj3o2lrkD',
      priceId: 'price_1SdaLa7YeQ1dZTUvsjFZWqjB',
      name: 'Creator Pack',
      price: 12.99,
      credits: 150,
      bonus: 0,
      pricePerCredit: 0.0866,
      popular: true,
    },
    large: {
      productId: 'prod_Talt0D5fyWm5LG',
      priceId: 'price_1SdaLk7YeQ1dZTUvdcDKtnTI',
      name: 'Pro Pack',
      price: 39.99,
      credits: 500,
      bonus: 25,
      pricePerCredit: 0.0762,
    },
    xl: {
      productId: 'prod_TaltVgylYh5opq',
      priceId: 'price_1SdaLt7YeQ1dZTUvGhjqaNyk',
      name: 'Studio Pack',
      price: 89.99,
      credits: 1200,
      bonus: 100,
      pricePerCredit: 0.0692,
    },
  },
};

// ============================================
// PAYPAL PLANS (To be created in PayPal Dashboard)
// ============================================
export const PAYPAL_PLANS = {
  starter: {
    planId: process.env.PAYPAL_PLAN_STARTER || 'P-STARTER',
    name: 'Starter',
    price: 9.99,
    credits: 150,
  },
  pro: {
    planId: process.env.PAYPAL_PLAN_PRO || 'P-PRO',
    name: 'Pro',
    price: 29.99,
    credits: 500,
  },
  premium: {
    planId: process.env.PAYPAL_PLAN_PREMIUM || 'P-PREMIUM',
    name: 'Premium',
    price: 99.99,
    credits: 2000,
  },
};

// ============================================
// FREE TIER
// ============================================
export const FREE_TIER = {
  credits: 25,
  expires: true, // Monthly reset
  watermark: true,
  features: ['25 credits/month', 'Basic tools only', 'Watermarked outputs'],
};

// ============================================
// REFERRAL REWARDS
// ============================================
export const REFERRAL_REWARDS = {
  referrer: {
    signup: 50,         // Credits when friend signs up
    upgrade: 100,       // Additional credits when friend upgrades
  },
  referee: {
    signup: 25,         // Credits for new user
  },
};

// ============================================
// TOOLS REGISTRY (60+ tools)
// ============================================
export const TOOLS_REGISTRY = {
  // Image Tools
  'image-generator': {
    name: 'AI Image Generator',
    category: 'image',
    baseCredits: 5,
    tiers: {
      standard: { credits: 5, resolution: '512x512' },
      hd: { credits: 10, resolution: '1024x1024' },
      premium: { credits: 25, resolution: '2048x2048' },
    },
    apiProvider: 'replicate',
    capabilities: ['text-to-image', 'styles', 'aspect-ratios'],
  },
  'background-remover': {
    name: 'Background Remover',
    category: 'image',
    baseCredits: 3,
    apiProvider: 'replicate',
    capabilities: ['remove-background'],
  },
  'image-upscaler': {
    name: 'Image Upscaler',
    category: 'image',
    baseCredits: 5,
    tiers: {
      '2x': { credits: 5 },
      '4x': { credits: 10 },
    },
    apiProvider: 'replicate',
    capabilities: ['upscale'],
  },
  
  // Video Tools
  'video-generator': {
    name: 'AI Video Generator',
    category: 'video',
    baseCredits: 25,
    tiers: {
      short: { credits: 25, duration: '5s' },
      medium: { credits: 50, duration: '15s' },
      long: { credits: 100, duration: '30s' },
    },
    apiProvider: 'replicate',
    capabilities: ['text-to-video', 'image-to-video'],
  },
  
  // Audio Tools
  'text-to-speech': {
    name: 'Text to Speech',
    category: 'audio',
    baseCredits: 5,
    apiProvider: 'elevenlabs',
    capabilities: ['tts', 'voice-selection'],
  },
  'voice-clone': {
    name: 'Voice Clone',
    category: 'audio',
    baseCredits: 100,
    apiProvider: 'elevenlabs',
    capabilities: ['clone-voice'],
  },
  'transcription': {
    name: 'Audio Transcription',
    category: 'audio',
    baseCredits: 2,
    apiProvider: 'deepgram',
    capabilities: ['speech-to-text'],
  },
  
  // Music Tools
  'music-generator': {
    name: 'AI Music Generator',
    category: 'music',
    baseCredits: 15,
    tiers: {
      short: { credits: 15, duration: '30s' },
      full: { credits: 50, duration: '3min' },
    },
    apiProvider: 'replicate',
    capabilities: ['text-to-music'],
  },
  
  // Text Tools
  'ai-writer': {
    name: 'AI Writer',
    category: 'text',
    baseCredits: 3,
    apiProvider: 'anthropic',
    capabilities: ['generate-text', 'rewrite'],
  },
  'code-generator': {
    name: 'Code Generator',
    category: 'code',
    baseCredits: 5,
    apiProvider: 'anthropic',
    capabilities: ['generate-code', 'explain-code'],
  },
  
  // Utility Tools
  'qr-generator': {
    name: 'QR Code Generator',
    category: 'utility',
    baseCredits: 1,
    apiProvider: 'custom',
    capabilities: ['generate-qr'],
  },
  'meme-generator': {
    name: 'Meme Generator',
    category: 'utility',
    baseCredits: 2,
    apiProvider: 'custom',
    capabilities: ['generate-meme'],
  },
};

// Helper functions
export function getToolCredits(toolId: string, tier?: string): number {
  const tool = TOOLS_REGISTRY[toolId as keyof typeof TOOLS_REGISTRY];
  if (!tool) return 10; // Default
  
  if (tier && 'tiers' in tool && tool.tiers) {
    const tierConfig = tool.tiers[tier as keyof typeof tool.tiers];
    return tierConfig?.credits || tool.baseCredits;
  }
  
  return tool.baseCredits;
}

export function calculateProfit(credits: number, costPerCredit: number = 0.01): {
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
} {
  const revenue = credits * 0.10; // 1 credit = $0.10
  const cost = credits * costPerCredit;
  const profit = revenue - cost;
  const margin = (profit / revenue) * 100;
  
  return { revenue, cost, profit, margin };
}
