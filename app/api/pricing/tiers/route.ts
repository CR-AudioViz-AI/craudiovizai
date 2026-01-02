/**
 * CR AudioViz AI - Pricing Tiers API
 * ===================================
 * 
 * Manages subscription plans, credit allocations,
 * and feature gates per tier.
 * 
 * @version 1.0.0
 * @date January 2, 2026 - 1:43 AM EST
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Pricing tiers configuration
export const PRICING_TIERS = {
  free: {
    id: 'free',
    name: 'Free Forever',
    description: 'Get started with essential tools',
    price: 0,
    interval: null,
    credits_monthly: 100,
    credits_rollover: false,
    features: {
      ebooks_access: 112, // Free collection
      audiobook_conversions: 3, // Per month
      ai_generations: 10, // Per month
      storage_gb: 1,
      tools_access: ['basic'], // Basic tools only
      support_level: 'community',
      api_access: false,
      white_label: false,
      priority_processing: false,
      custom_avatars: false,
      team_seats: 1
    },
    stripe_price_id: null,
    popular: false
  },
  
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for individuals',
    price: 9.99,
    interval: 'month',
    credits_monthly: 500,
    credits_rollover: true,
    features: {
      ebooks_access: 200, // Full library
      audiobook_conversions: 25,
      ai_generations: 100,
      storage_gb: 10,
      tools_access: ['basic', 'creative'],
      support_level: 'email',
      api_access: false,
      white_label: false,
      priority_processing: false,
      custom_avatars: true,
      team_seats: 1
    },
    stripe_price_id: process.env.STRIPE_STARTER_PRICE_ID,
    popular: false
  },
  
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'For creators and small businesses',
    price: 29.99,
    interval: 'month',
    credits_monthly: 2000,
    credits_rollover: true,
    features: {
      ebooks_access: 'unlimited',
      audiobook_conversions: 100,
      ai_generations: 500,
      storage_gb: 50,
      tools_access: ['basic', 'creative', 'professional'],
      support_level: 'priority',
      api_access: true,
      white_label: false,
      priority_processing: true,
      custom_avatars: true,
      team_seats: 3
    },
    stripe_price_id: process.env.STRIPE_PRO_PRICE_ID,
    popular: true
  },
  
  business: {
    id: 'business',
    name: 'Business',
    description: 'For growing teams',
    price: 79.99,
    interval: 'month',
    credits_monthly: 5000,
    credits_rollover: true,
    features: {
      ebooks_access: 'unlimited',
      audiobook_conversions: 'unlimited',
      ai_generations: 2000,
      storage_gb: 200,
      tools_access: ['basic', 'creative', 'professional', 'business'],
      support_level: 'dedicated',
      api_access: true,
      white_label: true,
      priority_processing: true,
      custom_avatars: true,
      team_seats: 10
    },
    stripe_price_id: process.env.STRIPE_BUSINESS_PRICE_ID,
    popular: false
  },
  
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    price: null, // Custom pricing
    interval: null,
    credits_monthly: 'custom',
    credits_rollover: true,
    features: {
      ebooks_access: 'unlimited',
      audiobook_conversions: 'unlimited',
      ai_generations: 'unlimited',
      storage_gb: 'unlimited',
      tools_access: ['all'],
      support_level: '24/7',
      api_access: true,
      white_label: true,
      priority_processing: true,
      custom_avatars: true,
      team_seats: 'unlimited',
      sso: true,
      sla: true,
      custom_integrations: true,
      dedicated_infrastructure: true
    },
    stripe_price_id: null,
    popular: false
  }
}

// Feature access checker
export function canAccessFeature(tier: string, feature: string): boolean {
  const plan = PRICING_TIERS[tier as keyof typeof PRICING_TIERS]
  if (!plan) return false
  
  const features = plan.features as Record<string, any>
  
  // Check specific feature
  if (feature in features) {
    const value = features[feature]
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value > 0
    if (value === 'unlimited') return true
    if (Array.isArray(value)) return value.length > 0
    return !!value
  }
  
  return false
}

// Credit checker
export function hasCredits(tier: string, required: number): boolean {
  const plan = PRICING_TIERS[tier as keyof typeof PRICING_TIERS]
  if (!plan) return false
  
  if (plan.credits_monthly === 'custom') return true
  if (typeof plan.credits_monthly === 'number') {
    return plan.credits_monthly >= required
  }
  
  return false
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tier = searchParams.get('tier')
  const feature = searchParams.get('feature')
  
  // Check specific feature access
  if (tier && feature) {
    const canAccess = canAccessFeature(tier, feature)
    return NextResponse.json({
      tier,
      feature,
      can_access: canAccess,
      timestamp: new Date().toISOString()
    })
  }
  
  // Return specific tier
  if (tier) {
    const plan = PRICING_TIERS[tier as keyof typeof PRICING_TIERS]
    if (!plan) {
      return NextResponse.json({
        error: 'Invalid tier'
      }, { status: 400 })
    }
    return NextResponse.json(plan)
  }
  
  // Return all tiers (public info)
  const publicTiers = Object.entries(PRICING_TIERS).map(([key, tier]) => ({
    ...tier,
    stripe_price_id: undefined // Don't expose Stripe IDs
  }))
  
  return NextResponse.json({
    tiers: publicTiers,
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, user_id, tier } = body
    
    if (action === 'check_access') {
      // Get user's current tier
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_tier, credits_balance')
        .eq('id', user_id)
        .single()
      
      if (error || !profile) {
        return NextResponse.json({
          error: 'User not found'
        }, { status: 404 })
      }
      
      const currentTier = profile.subscription_tier || 'free'
      const plan = PRICING_TIERS[currentTier as keyof typeof PRICING_TIERS]
      
      return NextResponse.json({
        user_id,
        tier: currentTier,
        credits_balance: profile.credits_balance || 0,
        credits_monthly: plan?.credits_monthly || 0,
        features: plan?.features || {},
        timestamp: new Date().toISOString()
      })
    }
    
    if (action === 'allocate_credits') {
      // Monthly credit allocation (called by cron)
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, subscription_tier, credits_balance')
        .not('subscription_tier', 'eq', 'free')
      
      if (error) throw error
      
      let allocated = 0
      
      for (const user of users || []) {
        const plan = PRICING_TIERS[user.subscription_tier as keyof typeof PRICING_TIERS]
        if (!plan || typeof plan.credits_monthly !== 'number') continue
        
        const newBalance = plan.credits_rollover 
          ? (user.credits_balance || 0) + plan.credits_monthly
          : plan.credits_monthly
        
        await supabase
          .from('profiles')
          .update({ 
            credits_balance: newBalance,
            credits_last_allocated: new Date().toISOString()
          })
          .eq('id', user.id)
        
        allocated++
      }
      
      return NextResponse.json({
        success: true,
        users_allocated: allocated,
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      error: 'Unknown action'
    }, { status: 400 })
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}
