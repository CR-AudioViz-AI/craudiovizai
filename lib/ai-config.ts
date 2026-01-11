// lib/ai-config.ts
// EMERGENCY COST FIX - Force Haiku for all background tasks
// Created: 2026-01-11 15:27 UTC

export const AI_CONFIG = {
  CRON_MODEL: 'claude-haiku-4-20250120',
  CRON_MAX_TOKENS: 1000,
  CHAT_MODEL: 'claude-haiku-4-20250120',
  CHAT_MAX_TOKENS: 2000,
  PREMIUM_MODEL: 'claude-sonnet-4-5-20250929',
  PREMIUM_MAX_TOKENS: 4000,
  MAX_DAILY_SPEND: 5.00,
  ALERT_THRESHOLD: 3.00,
} as const;

export function getModelForTask(taskType: 'cron' | 'chat' | 'premium' = 'cron') {
  switch(taskType) {
    case 'cron': return { model: AI_CONFIG.CRON_MODEL, max_tokens: AI_CONFIG.CRON_MAX_TOKENS };
    case 'chat': return { model: AI_CONFIG.CHAT_MODEL, max_tokens: AI_CONFIG.CHAT_MAX_TOKENS };
    case 'premium': return { model: AI_CONFIG.PREMIUM_MODEL, max_tokens: AI_CONFIG.PREMIUM_MAX_TOKENS };
    default: return { model: AI_CONFIG.CRON_MODEL, max_tokens: AI_CONFIG.CRON_MAX_TOKENS };
  }
}
