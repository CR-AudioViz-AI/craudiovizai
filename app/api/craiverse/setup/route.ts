import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// CRAIverse Setup Endpoint
// GET /api/craiverse/setup - Check status
// POST /api/craiverse/setup - Initialize tables with seed data

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

// Seed data for apps
const SEED_APPS = [
  { name: 'CRAIverse Hub', slug: 'craiverse', description: 'Central platform hub', url: 'https://craudiovizai.com', status: 'active', uses_credits: false, sort_order: 0 },
  { name: 'Javari AI', slug: 'javari', description: 'Your personal AI assistant', url: 'https://javariai.com', status: 'active', uses_credits: true, sort_order: 1 },
  { name: 'BarrelVerse', slug: 'barrelverse', description: 'The ultimate spirits discovery platform', url: 'https://cravbarrels.vercel.app', status: 'active', uses_credits: true, sort_order: 2 },
  { name: 'CardVerse', slug: 'cardverse', description: 'Trading card collection and community', url: 'https://crav-cardverse.vercel.app', status: 'active', uses_credits: true, sort_order: 3 },
  { name: 'Market Oracle', slug: 'market-oracle', description: 'AI-powered stock predictions', url: 'https://crav-market-oracle.vercel.app', status: 'active', uses_credits: true, sort_order: 4 },
  { name: 'Games', slug: 'games', description: 'Play hundreds of games', url: 'https://crav-games.vercel.app', status: 'coming_soon', uses_credits: true, sort_order: 5 },
];

const SEED_CREDIT_PACKAGES = [
  { name: 'Starter', description: 'Perfect for trying things out', credits: 100, bonus_credits: 0, price_cents: 500, is_popular: false, sort_order: 1 },
  { name: 'Popular', description: 'Most popular choice', credits: 500, bonus_credits: 50, price_cents: 2000, is_popular: true, sort_order: 2 },
  { name: 'Pro', description: 'For power users', credits: 1000, bonus_credits: 150, price_cents: 3500, is_popular: false, sort_order: 3 },
  { name: 'Enterprise', description: 'Best value', credits: 5000, bonus_credits: 1000, price_cents: 15000, is_popular: false, sort_order: 4 },
];

const SEED_KNOWLEDGE_CATEGORIES = [
  { name: 'Getting Started', slug: 'getting-started', description: 'New to CRAIverse? Start here!', icon: '🚀', sort_order: 1 },
  { name: 'Account & Billing', slug: 'account-billing', description: 'Manage your account and payments', icon: '💳', sort_order: 2 },
  { name: 'Credits', slug: 'credits', description: 'Understanding and using credits', icon: '🪙', sort_order: 3 },
  { name: 'Apps & Tools', slug: 'apps-tools', description: 'Learn about our apps', icon: '🛠️', sort_order: 4 },
  { name: 'Troubleshooting', slug: 'troubleshooting', description: 'Common issues and solutions', icon: '🔧', sort_order: 5 },
];

const SEED_FORUM_CATEGORIES = [
  { name: 'Announcements', slug: 'announcements', description: 'Official news and updates', icon: '📢', color: '#3B82F6', sort_order: 1 },
  { name: 'General Discussion', slug: 'general', description: 'Talk about anything', icon: '💬', color: '#10B981', sort_order: 2 },
  { name: 'Feature Requests', slug: 'features', description: 'Share your ideas', icon: '💡', color: '#F59E0B', sort_order: 3 },
  { name: 'Help & Support', slug: 'help', description: 'Get help from the community', icon: '🤝', color: '#8B5CF6', sort_order: 4 },
  { name: 'Show & Tell', slug: 'showcase', description: 'Share what you created', icon: '🎨', color: '#EC4899', sort_order: 5 },
];

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function seedTable(tableName: string, data: any[]): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // First check if table has data
    const { count } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
    
    if (count && count > 0) {
      return { success: true, count: count, error: 'Already has data' };
    }

    // Insert seed data
    const { error } = await supabase.from(tableName).insert(data);
    
    if (error) {
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: data.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message };
  }
}

export async function GET() {
  const tables = [
    'craiverse_apps',
    'craiverse_credit_packages', 
    'craiverse_knowledge_categories',
    'craiverse_forum_categories',
    'craiverse_profiles',
    'craiverse_credits',
    'craiverse_subscriptions',
    'craiverse_tickets',
    'craiverse_enhancements',
    'craiverse_forum_threads',
  ];

  const status: Record<string, boolean> = {};
  
  for (const table of tables) {
    status[table] = await checkTableExists(table);
  }

  const existingCount = Object.values(status).filter(Boolean).length;
  const allExist = existingCount === tables.length;

  return NextResponse.json({
    status: allExist ? 'ready' : 'needs_setup',
    message: allExist 
      ? 'CRAIverse is fully configured!' 
      : `${existingCount}/${tables.length} tables exist. Run POST to seed data.`,
    tables: status,
    timestamp: new Date().toISOString(),
    next_step: allExist ? null : 'POST /api/craiverse/setup to seed initial data',
  });
}

export async function POST(request: NextRequest) {
  // Optional auth check
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.CRAIVERSE_ADMIN_TOKEN;
  
  if (adminToken && authHeader !== `Bearer ${adminToken}`) {
    // Allow without token if no token is set
    if (adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const results: Record<string, any> = {};

  // Seed apps
  results.craiverse_apps = await seedTable('craiverse_apps', SEED_APPS);

  // Seed credit packages
  results.craiverse_credit_packages = await seedTable('craiverse_credit_packages', SEED_CREDIT_PACKAGES);

  // Seed knowledge categories
  results.craiverse_knowledge_categories = await seedTable('craiverse_knowledge_categories', SEED_KNOWLEDGE_CATEGORIES);

  // Seed forum categories
  results.craiverse_forum_categories = await seedTable('craiverse_forum_categories', SEED_FORUM_CATEGORIES);

  const successCount = Object.values(results).filter((r: any) => r.success).length;
  const totalCount = Object.keys(results).length;

  return NextResponse.json({
    status: successCount === totalCount ? 'success' : 'partial',
    message: `Seeded ${successCount}/${totalCount} tables`,
    results,
    timestamp: new Date().toISOString(),
    note: 'If tables do not exist, run the SQL schema in Supabase SQL Editor first.',
  });
}
