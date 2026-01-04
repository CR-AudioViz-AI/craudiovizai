// ================================================================================
// CR AUDIOVIZ AI - APPS API ENDPOINT
// Browse, search, filter, and launch apps
// With fallback for robustness
// ================================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Fallback apps registry (always available)
const FALLBACK_APPS = [
  { id: '1', name: 'Javari AI', slug: 'javari-ai', description: 'Your autonomous AI assistant', route_path: '/javari', is_featured: true, is_active: true, credits_per_use: 1 },
  { id: '2', name: 'Logo Studio', slug: 'logo-studio', description: 'AI-powered logo creation', route_path: '/apps/logo-studio', is_featured: true, is_active: true, credits_per_use: 5 },
  { id: '3', name: 'Invoice Generator', slug: 'invoice-generator', description: 'Professional invoices', route_path: '/apps/invoice-generator', is_featured: true, is_active: true, credits_per_use: 2 },
  { id: '4', name: 'Social Graphics', slug: 'social-graphics', description: 'Stunning social media graphics', route_path: '/apps/social-graphics', is_featured: true, is_active: true, credits_per_use: 3 },
  { id: '5', name: 'CravBarrels', slug: 'cravbarrels', description: 'Bourbon and spirits collection', route_path: '/javari-spirits', is_featured: true, is_active: true, credits_per_use: 1 },
  { id: '6', name: 'CravCards', slug: 'cravcards', description: 'Trading card collection', route_path: '/javari-tcg', is_featured: true, is_active: true, credits_per_use: 1 },
  { id: '7', name: 'Market Oracle', slug: 'market-oracle', description: 'AI stock predictions', route_path: '/apps/market-oracle', is_featured: true, is_active: true, credits_per_use: 5 },
  { id: '8', name: 'Travel Planner', slug: 'travel-planner', description: 'AI trip planning', route_path: '/javari-travel', is_featured: true, is_active: true, credits_per_use: 2 },
];

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = getSupabase();
    
    if (supabase) {
      // Try database first
      try {
        const { data: apps, error, count } = await supabase
          .from('apps')
          .select('*', { count: 'exact' })
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .range(offset, offset + limit - 1);

        if (!error && apps && apps.length > 0) {
          let filtered = apps;
          if (search) {
            filtered = apps.filter(a => 
              a.name.toLowerCase().includes(search) || 
              a.description?.toLowerCase().includes(search)
            );
          }
          return NextResponse.json({ apps: filtered, total: count || filtered.length, limit, offset, source: 'database' });
        }
      } catch (dbError) {
        console.error('Database error, using fallback:', dbError);
      }
    }

    // Fallback to static list
    let apps = FALLBACK_APPS;
    if (search) {
      apps = apps.filter(a => 
        a.name.toLowerCase().includes(search) || 
        a.description.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      apps: apps.slice(offset, offset + limit),
      total: apps.length,
      limit,
      offset,
      source: 'fallback'
    });

  } catch (error: any) {
    console.error('Apps API error:', error);
    // Even on error, return fallback
    return NextResponse.json({
      apps: FALLBACK_APPS,
      total: FALLBACK_APPS.length,
      limit: 100,
      offset: 0,
      source: 'fallback-error'
    });
  }
}
