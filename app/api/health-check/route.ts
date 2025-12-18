// ============================================================
// CR AUDIOVIZ AI - API HEALTH CHECK SYSTEM
// /api/health-check/route.ts
// Monitors all 30+ APIs, logs to Supabase, alerts via Discord
// Created: December 17, 2025
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// TYPES
// ============================================================

interface APIConfig {
  name: string;
  displayName: string;
  category: string;
  baseUrl: string;
  healthEndpoint?: string;
  authType: 'api_key' | 'bearer' | 'basic' | 'none';
  authHeader?: string;
  envKey: string;
  timeout?: number;
  criticalForBusiness?: boolean;
  freeAnnualValue?: number;
  failoverGroup?: string;
}

interface HealthCheckResult {
  name: string;
  displayName: string;
  category: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  statusCode?: number;
  latencyMs: number;
  message: string;
  lastChecked: string;
  isCritical: boolean;
  isFree: boolean;
  freeAnnualValue: number;
  failoverGroup?: string;
  quotaRemaining?: number;
  quotaLimit?: number;
}

interface HealthCheckSummary {
  timestamp: string;
  overall: 'operational' | 'degraded' | 'major_outage';
  totalApis: number;
  healthy: number;
  degraded: number;
  down: number;
  unknown: number;
  avgLatencyMs: number;
  freeApisValue: number;
  criticalStatus: string;
  results: HealthCheckResult[];
}

// ============================================================
// API CONFIGURATION
// Uses environment variables from Master Credentials Document
// ============================================================

const API_CONFIGS: APIConfig[] = [
  // ========== AI PROVIDERS ==========
  {
    name: 'groq',
    displayName: 'Groq AI (Ultra-Fast)',
    category: 'AI',
    baseUrl: 'https://api.groq.com',
    healthEndpoint: '/openai/v1/models',
    authType: 'bearer',
    envKey: 'GROQ_API_KEY',
    criticalForBusiness: true,
    freeAnnualValue: 1728,
    failoverGroup: 'ai_chat'
  },
  {
    name: 'huggingface',
    displayName: 'Hugging Face',
    category: 'AI',
    baseUrl: 'https://huggingface.co',
    healthEndpoint: '/api/whoami',
    authType: 'bearer',
    envKey: 'HUGGINGFACE_API_KEY',
    freeAnnualValue: 600,
    failoverGroup: 'ai_chat'
  },
  {
    name: 'anthropic',
    displayName: 'Anthropic Claude',
    category: 'AI',
    baseUrl: 'https://api.anthropic.com',
    healthEndpoint: '/v1/messages',
    authType: 'api_key',
    authHeader: 'x-api-key',
    envKey: 'ANTHROPIC_API_KEY',
    criticalForBusiness: true,
    freeAnnualValue: 0,
    failoverGroup: 'ai_chat'
  },
  {
    name: 'openai',
    displayName: 'OpenAI GPT',
    category: 'AI',
    baseUrl: 'https://api.openai.com',
    healthEndpoint: '/v1/models',
    authType: 'bearer',
    envKey: 'OPENAI_API_KEY',
    criticalForBusiness: true,
    freeAnnualValue: 0,
    failoverGroup: 'ai_chat'
  },
  {
    name: 'google_gemini',
    displayName: 'Google Gemini',
    category: 'AI',
    baseUrl: 'https://generativelanguage.googleapis.com',
    healthEndpoint: '/v1/models',
    authType: 'api_key',
    envKey: 'GOOGLE_GEMINI_API_KEY',
    freeAnnualValue: 0,
    failoverGroup: 'ai_chat'
  },
  {
    name: 'perplexity',
    displayName: 'Perplexity AI',
    category: 'AI',
    baseUrl: 'https://api.perplexity.ai',
    healthEndpoint: '/chat/completions',
    authType: 'bearer',
    envKey: 'PERPLEXITY_API_KEY',
    freeAnnualValue: 0,
    failoverGroup: 'ai_search'
  },

  // ========== FINANCIAL DATA ==========
  {
    name: 'alpha_vantage',
    displayName: 'Alpha Vantage',
    category: 'Financial',
    baseUrl: 'https://www.alphavantage.co',
    healthEndpoint: '/query?function=GLOBAL_QUOTE&symbol=IBM',
    authType: 'api_key',
    envKey: 'ALPHA_VANTAGE_API_KEY',
    criticalForBusiness: true,
    freeAnnualValue: 600,
    failoverGroup: 'stock_data'
  },
  {
    name: 'finnhub',
    displayName: 'Finnhub',
    category: 'Financial',
    baseUrl: 'https://finnhub.io',
    healthEndpoint: '/api/v1/quote?symbol=AAPL',
    authType: 'api_key',
    authHeader: 'X-Finnhub-Token',
    envKey: 'FINNHUB_API_KEY',
    freeAnnualValue: 1200,
    failoverGroup: 'stock_data'
  },
  {
    name: 'coingecko',
    displayName: 'CoinGecko',
    category: 'Financial',
    baseUrl: 'https://api.coingecko.com',
    healthEndpoint: '/api/v3/ping',
    authType: 'none',
    envKey: '',
    freeAnnualValue: 240,
    failoverGroup: 'crypto_data'
  },
  {
    name: 'fmp',
    displayName: 'Financial Modeling Prep',
    category: 'Financial',
    baseUrl: 'https://financialmodelingprep.com',
    healthEndpoint: '/stable/quote?symbol=AAPL',
    authType: 'api_key',
    envKey: 'FMP_API_KEY',
    freeAnnualValue: 400,
    failoverGroup: 'stock_data'
  },
  {
    name: 'fred',
    displayName: 'FRED Economic Data',
    category: 'Financial',
    baseUrl: 'https://api.stlouisfed.org',
    healthEndpoint: '/fred/series?series_id=GDP&file_type=json',
    authType: 'api_key',
    envKey: 'FRED_API_KEY',
    freeAnnualValue: 0,
    failoverGroup: 'economic_data'
  },

  // ========== NEWS & SEARCH ==========
  {
    name: 'newsapi',
    displayName: 'NewsAPI',
    category: 'News',
    baseUrl: 'https://newsapi.org',
    healthEndpoint: '/v2/top-headlines?country=us&pageSize=1',
    authType: 'api_key',
    authHeader: 'X-Api-Key',
    envKey: 'NEWSAPI_KEY',
    freeAnnualValue: 180,
    failoverGroup: 'news'
  },
  {
    name: 'gnews',
    displayName: 'GNews',
    category: 'News',
    baseUrl: 'https://gnews.io',
    healthEndpoint: '/api/v4/top-headlines?category=general&lang=en&max=1',
    authType: 'api_key',
    envKey: 'GNEWS_API_KEY',
    freeAnnualValue: 120,
    failoverGroup: 'news'
  },
  {
    name: 'tavily',
    displayName: 'Tavily Search',
    category: 'Search',
    baseUrl: 'https://api.tavily.com',
    healthEndpoint: '/search',
    authType: 'api_key',
    envKey: 'TAVILY_API_KEY',
    criticalForBusiness: true,
    freeAnnualValue: 0,
    failoverGroup: 'web_search'
  },

  // ========== MEDIA & CREATIVE ==========
  {
    name: 'unsplash',
    displayName: 'Unsplash',
    category: 'Media',
    baseUrl: 'https://api.unsplash.com',
    healthEndpoint: '/photos/random',
    authType: 'bearer',
    authHeader: 'Authorization',
    envKey: 'UNSPLASH_ACCESS_KEY',
    freeAnnualValue: 600,
    failoverGroup: 'stock_photos'
  },
  {
    name: 'pexels',
    displayName: 'Pexels',
    category: 'Media',
    baseUrl: 'https://api.pexels.com',
    healthEndpoint: '/v1/curated?per_page=1',
    authType: 'bearer',
    authHeader: 'Authorization',
    envKey: 'PEXELS_API_KEY',
    freeAnnualValue: 480,
    failoverGroup: 'stock_photos'
  },
  {
    name: 'freesound',
    displayName: 'Freesound',
    category: 'Media',
    baseUrl: 'https://freesound.org',
    healthEndpoint: '/apiv2/search/text/?query=test&page_size=1',
    authType: 'bearer',
    authHeader: 'Authorization',
    envKey: 'FREESOUND_API_KEY',
    freeAnnualValue: 200,
    failoverGroup: 'audio'
  },
  {
    name: 'cloudinary',
    displayName: 'Cloudinary',
    category: 'Storage',
    baseUrl: 'https://api.cloudinary.com',
    healthEndpoint: '/v1_1/dpozbn7tm/resources/image?max_results=1',
    authType: 'basic',
    envKey: 'CLOUDINARY_API_KEY',
    criticalForBusiness: true,
    freeAnnualValue: 1800,
    failoverGroup: 'media_storage'
  },
  {
    name: 'removebg',
    displayName: 'Remove.bg',
    category: 'Creative',
    baseUrl: 'https://api.remove.bg',
    healthEndpoint: '/v1.0/account',
    authType: 'api_key',
    authHeader: 'X-Api-Key',
    envKey: 'REMOVEBG_API_KEY',
    freeAnnualValue: 240,
    failoverGroup: 'image_processing'
  },
  {
    name: 'tinypng',
    displayName: 'TinyPNG',
    category: 'Creative',
    baseUrl: 'https://api.tinify.com',
    healthEndpoint: '/shrink',
    authType: 'basic',
    envKey: 'TINYPNG_API_KEY',
    freeAnnualValue: 300,
    failoverGroup: 'image_compression'
  },

  // ========== GAMES & ENTERTAINMENT ==========
  {
    name: 'rawg',
    displayName: 'RAWG Games',
    category: 'Entertainment',
    baseUrl: 'https://api.rawg.io',
    healthEndpoint: '/api/games?page_size=1',
    authType: 'api_key',
    envKey: 'RAWG_API_KEY',
    freeAnnualValue: 240,
    failoverGroup: 'games'
  },
  {
    name: 'tmdb',
    displayName: 'TMDb',
    category: 'Entertainment',
    baseUrl: 'https://api.themoviedb.org',
    healthEndpoint: '/3/movie/popular?page=1',
    authType: 'bearer',
    envKey: 'TMDB_API_KEY',
    freeAnnualValue: 0,
    failoverGroup: 'movies'
  },

  // ========== NOTIFICATIONS ==========
  {
    name: 'resend',
    displayName: 'Resend Email',
    category: 'Notification',
    baseUrl: 'https://api.resend.com',
    healthEndpoint: '/domains',
    authType: 'bearer',
    envKey: 'RESEND_API_KEY',
    criticalForBusiness: true,
    freeAnnualValue: 348,
    failoverGroup: 'email'
  },
  {
    name: 'pusher',
    displayName: 'Pusher',
    category: 'Notification',
    baseUrl: 'https://api-us2.pusher.com',
    healthEndpoint: '/apps/2091991/channels',
    authType: 'bearer',
    envKey: 'PUSHER_SECRET',
    freeAnnualValue: 2400,
    failoverGroup: 'realtime'
  },

  // ========== ANALYTICS & MONITORING ==========
  {
    name: 'posthog',
    displayName: 'PostHog',
    category: 'Analytics',
    baseUrl: 'https://app.posthog.com',
    healthEndpoint: '/api/projects/',
    authType: 'bearer',
    envKey: 'POSTHOG_API_KEY',
    freeAnnualValue: 3600,
    failoverGroup: 'analytics'
  },
  {
    name: 'sentry',
    displayName: 'Sentry',
    category: 'Monitoring',
    baseUrl: 'https://sentry.io',
    healthEndpoint: '/api/0/',
    authType: 'bearer',
    envKey: 'SENTRY_AUTH_TOKEN',
    criticalForBusiness: true,
    freeAnnualValue: 1200,
    failoverGroup: 'error_tracking'
  },
  {
    name: 'uptimerobot',
    displayName: 'UptimeRobot',
    category: 'Monitoring',
    baseUrl: 'https://api.uptimerobot.com',
    healthEndpoint: '/v2/getAccountDetails',
    authType: 'api_key',
    envKey: 'UPTIMEROBOT_API_KEY',
    freeAnnualValue: 840,
    failoverGroup: 'uptime'
  },

  // ========== GEOLOCATION & WEATHER ==========
  {
    name: 'ipinfo',
    displayName: 'IPinfo',
    category: 'Geolocation',
    baseUrl: 'https://ipinfo.io',
    healthEndpoint: '/json',
    authType: 'bearer',
    envKey: 'IPINFO_TOKEN',
    freeAnnualValue: 600,
    failoverGroup: 'geolocation'
  },
  {
    name: 'openweathermap',
    displayName: 'OpenWeatherMap',
    category: 'Weather',
    baseUrl: 'https://api.openweathermap.org',
    healthEndpoint: '/data/2.5/weather?q=London',
    authType: 'api_key',
    envKey: 'OPENWEATHER_API_KEY',
    freeAnnualValue: 480,
    failoverGroup: 'weather'
  },

  // ========== VIDEO ANALYSIS ==========
  {
    name: 'twelve_labs',
    displayName: 'Twelve Labs',
    category: 'Video',
    baseUrl: 'https://api.twelvelabs.io',
    healthEndpoint: '/v1.2/indexes',
    authType: 'bearer',
    envKey: 'TWELVE_LABS_API_KEY',
    freeAnnualValue: 180,
    failoverGroup: 'video_analysis'
  },

  // ========== LEAD GENERATION ==========
  {
    name: 'hunter',
    displayName: 'Hunter.io',
    category: 'Lead Gen',
    baseUrl: 'https://api.hunter.io',
    healthEndpoint: '/v2/account',
    authType: 'api_key',
    envKey: 'HUNTER_API_KEY',
    freeAnnualValue: 60,
    failoverGroup: 'email_finder'
  },

  // ========== VECTOR DATABASE ==========
  {
    name: 'qdrant',
    displayName: 'Qdrant Vector DB',
    category: 'Database',
    baseUrl: 'https://7215a16f-0a47-4bd5-9e61-8eab98eb9c17.europe-west3-0.gcp.cloud.qdrant.io',
    healthEndpoint: '/collections',
    authType: 'api_key',
    authHeader: 'api-key',
    envKey: 'QDRANT_API_KEY',
    criticalForBusiness: true,
    freeAnnualValue: 0,
    failoverGroup: 'vector_db'
  }
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get environment variable value
 */
function getEnvValue(key: string): string | undefined {
  if (!key) return undefined;
  return process.env[key];
}

/**
 * Build authorization header based on auth type
 */
function buildAuthHeader(config: APIConfig): Record<string, string> {
  const apiKey = getEnvValue(config.envKey);
  if (!apiKey && config.authType !== 'none') {
    return {};
  }

  switch (config.authType) {
    case 'bearer':
      return { [config.authHeader || 'Authorization']: `Bearer ${apiKey}` };
    case 'api_key':
      if (config.authHeader) {
        return { [config.authHeader]: apiKey! };
      }
      return {}; // Will be added as query param
    case 'basic':
      const basicAuth = Buffer.from(`api:${apiKey}`).toString('base64');
      return { Authorization: `Basic ${basicAuth}` };
    case 'none':
    default:
      return {};
  }
}

/**
 * Build URL with API key as query param if needed
 */
function buildUrl(config: APIConfig): string {
  let url = `${config.baseUrl}${config.healthEndpoint || ''}`;
  
  if (config.authType === 'api_key' && !config.authHeader) {
    const apiKey = getEnvValue(config.envKey);
    if (apiKey) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}apikey=${apiKey}`;
    }
  }
  
  return url;
}

/**
 * Check a single API's health
 */
async function checkApiHealth(config: APIConfig): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const apiKey = getEnvValue(config.envKey);
  
  // Check if API key is configured (unless auth is 'none')
  if (config.authType !== 'none' && !apiKey) {
    return {
      name: config.name,
      displayName: config.displayName,
      category: config.category,
      status: 'unknown',
      latencyMs: 0,
      message: `API key not configured (${config.envKey})`,
      lastChecked: new Date().toISOString(),
      isCritical: config.criticalForBusiness || false,
      isFree: (config.freeAnnualValue || 0) > 0,
      freeAnnualValue: config.freeAnnualValue || 0,
      failoverGroup: config.failoverGroup
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 10000);

    const url = buildUrl(config);
    const headers = buildAuthHeader(config);

    // Special handling for POST-only endpoints
    const method = config.name === 'tavily' ? 'POST' : 'GET';
    const body = config.name === 'tavily' 
      ? JSON.stringify({ api_key: apiKey, query: 'test', max_results: 1 })
      : undefined;

    const response = await fetch(url, {
      method,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'User-Agent': 'CR-AudioViz-AI-HealthCheck/1.0'
      },
      body,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    // Determine status based on response
    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    let message = 'OK';

    if (!response.ok) {
      if (response.status >= 500) {
        status = 'down';
        message = `Server error: ${response.status}`;
      } else if (response.status === 429) {
        status = 'degraded';
        message = 'Rate limited';
      } else if (response.status === 401 || response.status === 403) {
        status = 'down';
        message = 'Authentication failed';
      } else {
        status = 'degraded';
        message = `HTTP ${response.status}`;
      }
    } else if (latencyMs > 5000) {
      status = 'degraded';
      message = `Slow response: ${latencyMs}ms`;
    }

    // Extract quota info from headers if available
    const quotaRemaining = parseInt(response.headers.get('x-ratelimit-remaining') || 
                                     response.headers.get('x-rate-limit-remaining') || '', 10);
    const quotaLimit = parseInt(response.headers.get('x-ratelimit-limit') || 
                                 response.headers.get('x-rate-limit-limit') || '', 10);

    return {
      name: config.name,
      displayName: config.displayName,
      category: config.category,
      status,
      statusCode: response.status,
      latencyMs,
      message,
      lastChecked: new Date().toISOString(),
      isCritical: config.criticalForBusiness || false,
      isFree: (config.freeAnnualValue || 0) > 0,
      freeAnnualValue: config.freeAnnualValue || 0,
      failoverGroup: config.failoverGroup,
      quotaRemaining: isNaN(quotaRemaining) ? undefined : quotaRemaining,
      quotaLimit: isNaN(quotaLimit) ? undefined : quotaLimit
    };

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      name: config.name,
      displayName: config.displayName,
      category: config.category,
      status: 'down',
      latencyMs,
      message: errorMessage.includes('abort') ? 'Timeout' : errorMessage,
      lastChecked: new Date().toISOString(),
      isCritical: config.criticalForBusiness || false,
      isFree: (config.freeAnnualValue || 0) > 0,
      freeAnnualValue: config.freeAnnualValue || 0,
      failoverGroup: config.failoverGroup
    };
  }
}

/**
 * Send Discord alert for API issues
 */
async function sendDiscordAlert(results: HealthCheckResult[], summary: HealthCheckSummary): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const downApis = results.filter(r => r.status === 'down');
  const degradedApis = results.filter(r => r.status === 'degraded');

  if (downApis.length === 0 && degradedApis.length === 0) return;

  const criticalDown = downApis.filter(r => r.isCritical);
  
  // Build embed
  const embed: Record<string, unknown> = {
    title: criticalDown.length > 0 
      ? '🚨 CRITICAL: API Health Alert' 
      : '⚠️ API Health Warning',
    color: criticalDown.length > 0 ? 0xFF0000 : 0xFFA500,
    timestamp: new Date().toISOString(),
    fields: [
      {
        name: '📊 Overall Status',
        value: `${summary.healthy}/${summary.totalApis} APIs Healthy`,
        inline: true
      },
      {
        name: '⏱️ Avg Latency',
        value: `${Math.round(summary.avgLatencyMs)}ms`,
        inline: true
      },
      {
        name: '💰 Free APIs Value',
        value: `$${summary.freeApisValue.toLocaleString()}/year`,
        inline: true
      }
    ],
    footer: {
      text: 'CR AudioViz AI Health Monitor'
    }
  };

  if (downApis.length > 0) {
    embed.fields = [
      ...(embed.fields as unknown[]),
      {
        name: '🔴 DOWN APIs',
        value: downApis.map(r => `• **${r.displayName}** - ${r.message}`).join('\n').slice(0, 1024),
        inline: false
      }
    ];
  }

  if (degradedApis.length > 0) {
    embed.fields = [
      ...(embed.fields as unknown[]),
      {
        name: '🟡 Degraded APIs',
        value: degradedApis.map(r => `• **${r.displayName}** - ${r.message}`).join('\n').slice(0, 1024),
        inline: false
      }
    ];
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    console.error('Failed to send Discord alert:', error);
  }
}

/**
 * Log health check results to Supabase
 */
async function logToSupabase(results: HealthCheckResult[]): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not configured, skipping logging');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const logs = results.map(r => ({
      api_name: r.name,
      is_healthy: r.status === 'healthy',
      status_code: r.statusCode,
      latency_ms: r.latencyMs,
      error_message: r.status !== 'healthy' ? r.message : null,
      remaining_quota: r.quotaRemaining,
      quota_limit: r.quotaLimit,
      severity: r.status === 'down' ? 'critical' : r.status === 'degraded' ? 'warning' : 'info',
      check_type: 'scheduled',
      checked_at: r.lastChecked
    }));

    const { error } = await supabase
      .from('api_health_logs')
      .insert(logs);

    if (error) {
      console.error('Failed to log to Supabase:', error);
    }
  } catch (error) {
    console.error('Supabase logging error:', error);
  }
}

// ============================================================
// API ROUTE HANDLER
// ============================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  
  // Optional filters
  const category = searchParams.get('category');
  const criticalOnly = searchParams.get('critical') === 'true';
  const freeOnly = searchParams.get('free') === 'true';
  const failoverGroup = searchParams.get('failover_group');

  // Filter APIs based on query params
  let apisToCheck = API_CONFIGS;
  
  if (category) {
    apisToCheck = apisToCheck.filter(a => a.category.toLowerCase() === category.toLowerCase());
  }
  if (criticalOnly) {
    apisToCheck = apisToCheck.filter(a => a.criticalForBusiness);
  }
  if (freeOnly) {
    apisToCheck = apisToCheck.filter(a => (a.freeAnnualValue || 0) > 0);
  }
  if (failoverGroup) {
    apisToCheck = apisToCheck.filter(a => a.failoverGroup === failoverGroup);
  }

  // Run health checks in parallel
  const results = await Promise.all(
    apisToCheck.map(config => checkApiHealth(config))
  );

  // Calculate summary statistics
  const healthy = results.filter(r => r.status === 'healthy').length;
  const degraded = results.filter(r => r.status === 'degraded').length;
  const down = results.filter(r => r.status === 'down').length;
  const unknown = results.filter(r => r.status === 'unknown').length;
  
  const avgLatency = results.length > 0
    ? results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length
    : 0;
  
  const freeApisValue = results
    .filter(r => r.status === 'healthy' && r.isFree)
    .reduce((sum, r) => sum + r.freeAnnualValue, 0);

  const criticalDown = results.filter(r => r.status === 'down' && r.isCritical);

  // Determine overall status
  let overall: 'operational' | 'degraded' | 'major_outage' = 'operational';
  if (criticalDown.length > 0 || down > results.length * 0.3) {
    overall = 'major_outage';
  } else if (down > 0 || degraded > results.length * 0.2) {
    overall = 'degraded';
  }

  const summary: HealthCheckSummary = {
    timestamp: new Date().toISOString(),
    overall,
    totalApis: results.length,
    healthy,
    degraded,
    down,
    unknown,
    avgLatencyMs: Math.round(avgLatency),
    freeApisValue,
    criticalStatus: criticalDown.length > 0 
      ? `🚨 ${criticalDown.length} critical API(s) down: ${criticalDown.map(r => r.displayName).join(', ')}`
      : '✅ All critical APIs operational',
    results: results.sort((a, b) => {
      // Sort by status (down first, then degraded, then unknown, then healthy)
      const statusOrder = { down: 0, degraded: 1, unknown: 2, healthy: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    })
  };

  // Log to Supabase (async, don't block response)
  logToSupabase(results).catch(console.error);

  // Send Discord alert if issues detected
  if (down > 0 || degraded > 0) {
    sendDiscordAlert(results, summary).catch(console.error);
  }

  // Set appropriate status code
  const statusCode = overall === 'major_outage' ? 503 : overall === 'degraded' ? 207 : 200;

  return NextResponse.json(summary, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Health-Check-Duration': `${Date.now() - startTime}ms`,
      'X-APIs-Checked': String(results.length),
      'X-Overall-Status': overall
    }
  });
}

// POST endpoint for manual/triggered health checks
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { apis } = body;

    // If specific APIs requested, filter to just those
    if (apis && Array.isArray(apis)) {
      const apisToCheck = API_CONFIGS.filter(a => apis.includes(a.name));
      
      if (apisToCheck.length === 0) {
        return NextResponse.json(
          { error: 'No matching APIs found', available: API_CONFIGS.map(a => a.name) },
          { status: 400 }
        );
      }

      const results = await Promise.all(
        apisToCheck.map(config => checkApiHealth(config))
      );

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        checked: results.length,
        results
      });
    }

    // Default: run full health check
    return GET(request);
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
