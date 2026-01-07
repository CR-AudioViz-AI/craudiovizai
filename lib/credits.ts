import { supabase } from './supabase/client'

/**
 * CR AudioViz AI - Credits Management
 * 
 * @timestamp January 7, 2026 - 6:08 PM EST
 * @fix Admins (is_admin OR admin emails) have unlimited credits - never deducted
 */

// Admin emails that always have unlimited access
const ADMIN_EMAILS = [
  'royhenderson@craudiovizai.com',
  'cindyhenderson@craudiovizai.com',
]

export const CREDIT_PRICES = {
  tier1: { credits: 100, price: 10, bonus: 0 },
  tier2: { credits: 500, price: 45, bonus: 50 },
  tier3: { credits: 1000, price: 80, bonus: 150 },
  tier4: { credits: 5000, price: 350, bonus: 1000 },
}

export const SUBSCRIPTION_TIERS = {
  starter: { price: 19, credits: 200, name: 'Starter' },
  pro: { price: 49, credits: 750, name: 'Pro' },
  enterprise: { price: 149, credits: 3000, name: 'Enterprise' },
}

/**
 * Check if a user is an admin (either by is_admin flag or admin email)
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, email')
    .eq('id', userId)
    .single()

  if (!profile) return false

  // Check is_admin flag
  if (profile.is_admin) return true

  // Check if email is in admin list
  if (profile.email && ADMIN_EMAILS.includes(profile.email.toLowerCase())) {
    return true
  }

  // Also check auth.users for email
  const { data: authUser } = await supabase.auth.admin.getUserById(userId)
  if (authUser?.user?.email && ADMIN_EMAILS.includes(authUser.user.email.toLowerCase())) {
    return true
  }

  return false
}

/**
 * Deduct credits from a user's balance
 * ADMINS ARE NEVER CHARGED - they have unlimited credits
 */
export async function deductCredits(userId: string, amount: number, description: string) {
  // Check if user is admin - admins have unlimited credits
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits_balance, is_admin, email')
    .eq('id', userId)
    .single()

  if (!profile) {
    throw new Error('User profile not found')
  }

  // ADMIN CHECK: is_admin flag OR admin email = unlimited credits
  const isAdmin = profile.is_admin || 
    (profile.email && ADMIN_EMAILS.includes(profile.email.toLowerCase()))

  if (isAdmin) {
    // Admins have unlimited credits - log but don't deduct
    console.log(`[ADMIN] Skipping credit deduction for admin user: ${userId}, amount: ${amount}, reason: ${description}`)
    
    // Still log the transaction for audit purposes but with 0 deduction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: 0, // No actual deduction
      transaction_type: 'admin_usage',
      description: `[ADMIN UNLIMITED] ${description}`,
    })
    
    return true
  }

  // Regular user - check balance
  if (profile.credits_balance < amount) {
    throw new Error('Insufficient credits')
  }

  // Deduct credits for regular users
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: -amount,
    transaction_type: 'spend',
    description,
  })

  return true
}

/**
 * Add credits to a user's balance
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: string,
  description: string
) {
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount,
    transaction_type: type,
    description,
  })

  return true
}

/**
 * Get user's credit balance (returns Infinity for admins)
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits_balance, credits, is_admin, email')
    .eq('id', userId)
    .single()

  if (!profile) return 0

  // ADMIN CHECK: is_admin flag OR admin email = unlimited credits
  const isAdmin = profile.is_admin || 
    (profile.email && ADMIN_EMAILS.includes(profile.email.toLowerCase()))

  if (isAdmin) {
    return Infinity // Unlimited
  }

  return profile.credits_balance || profile.credits || 0
}

/**
 * Check if user has enough credits (admins always return true)
 */
export async function hasEnoughCredits(userId: string, amount: number): Promise<boolean> {
  const balance = await getCreditBalance(userId)
  return balance >= amount
}
