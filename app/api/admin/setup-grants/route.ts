// app/api/admin/setup-grants/route.ts
// Grant Management System Setup - Creates tables and seeds data
// Timestamp: Sunday, December 15, 2025

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        db: { schema: 'public' }
      }
    );

    const results: string[] = [];

    // Check if grants exist
    const { data: existing, error: checkError } = await supabase
      .from('grant_opportunities')
      .select('id, title')
      .limit(5);

    if (checkError) {
      results.push(`Check error: ${checkError.message}`);
    } else {
      results.push(`Existing grants: ${existing?.length || 0}`);
    }

    // If no grants, seed the database
    if (!existing || existing.length === 0) {
      const grants = [
        {
          title: 'Veterans Transition Hub',
          funder_name: 'Bob Woodruff Foundation',
          funder_type: 'foundation',
          amount_min: 50000, amount_max: 500000, amount_requested: 150000,
          status: 'preparing', priority: 'critical',
          deadline: '2026-01-06',
          description: 'AI-powered digital platform providing comprehensive transition support for veterans.',
          target_modules: ['veterans-transition'],
          match_score: 95, win_probability: 75,
          url: 'https://bobwoodrufffoundation.org/apply',
          notes: 'Application drafted. Ready for submission. Jan 6 deadline.'
        },
        {
          title: 'First Responders Haven - FR-CARA',
          funder_name: 'SAMHSA',
          funder_type: 'federal',
          amount_min: 300000, amount_max: 500000, amount_requested: 400000,
          status: 'researching', priority: 'critical',
          description: 'Comprehensive digital mental health platform for first responders.',
          target_modules: ['first-responders'],
          match_score: 92, win_probability: 60,
          url: 'https://grants.gov',
          notes: 'Waiting for FY2026 NOFO release. Requires SAM.gov registration.'
        },
        {
          title: 'Youth Mental Health Navigator',
          funder_name: 'The Kresge Foundation',
          funder_type: 'foundation',
          amount_min: 100000, amount_max: 500000, amount_requested: 250000,
          status: 'preparing', priority: 'high',
          description: 'AI-powered early intervention platform for youth ages 12-24.',
          target_modules: ['mental-health-youth'],
          match_score: 80, win_probability: 40,
          url: 'https://kresge.org/grants',
          notes: 'LOI drafted. Health equity focus aligns well.'
        },
        {
          title: 'Rural Health Navigator',
          funder_name: 'Blue Cross Blue Shield of Florida Foundation',
          funder_type: 'foundation',
          amount_min: 25000, amount_max: 150000, amount_requested: 75000,
          status: 'preparing', priority: 'high',
          description: 'AI-powered telehealth access platform for rural Florida.',
          target_modules: ['rural-health'],
          match_score: 78, win_probability: 50,
          url: 'https://bcbsfl.com/foundation',
          notes: 'Application drafted. Check Florida deadlines.'
        },
        {
          title: 'Veterans Employment Initiative',
          funder_name: 'Department of Labor',
          funder_type: 'federal',
          amount_min: 500000, amount_max: 2000000, amount_requested: 750000,
          status: 'researching', priority: 'high',
          description: 'Comprehensive employment support for transitioning veterans.',
          target_modules: ['veterans-transition'],
          match_score: 90, win_probability: 55,
          url: 'https://grants.gov',
          notes: 'Monitor Grants.gov for FY2026 NOFO.'
        },
        {
          title: 'BRIC - Building Resilient Infrastructure',
          funder_name: 'FEMA',
          funder_type: 'federal',
          amount_min: 50000, amount_max: 1000000, amount_requested: 500000,
          status: 'researching', priority: 'medium',
          description: 'Technology platform for disaster resilience.',
          target_modules: ['disaster-relief'],
          match_score: 75, win_probability: 50,
          url: 'https://fema.gov/grants',
          notes: 'Annual program, opens January.'
        },
        {
          title: 'Craig Newmark Veterans Tech',
          funder_name: 'Craig Newmark Philanthropies',
          funder_type: 'foundation',
          amount_min: 50000, amount_max: 200000, amount_requested: 100000,
          status: 'researching', priority: 'high',
          description: 'Technology solutions for veteran transition support.',
          target_modules: ['veterans-transition'],
          match_score: 85, win_probability: 70,
          url: 'https://craignewmarkphilanthropies.org',
          notes: 'Strong tech focus. Rolling applications.'
        },
        {
          title: 'NEA Our Town - Creative Placemaking',
          funder_name: 'National Endowment for the Arts',
          funder_type: 'federal',
          amount_min: 25000, amount_max: 150000, amount_requested: 100000,
          status: 'discovered', priority: 'medium',
          description: 'Arts-based community development.',
          target_modules: ['community-arts'],
          match_score: 65, win_probability: 45,
          url: 'https://arts.gov/grants',
          notes: 'Creative economy angle.'
        }
      ];

      const { data: inserted, error: insertError } = await supabase
        .from('grant_opportunities')
        .insert(grants)
        .select();

      if (insertError) {
        results.push(`Insert error: ${insertError.message}`);
      } else {
        results.push(`Inserted ${inserted?.length || 0} grants`);
      }
    }

    // Get final count
    const { count } = await supabase
      .from('grant_opportunities')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalGrants: count,
      results
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/setup-grants',
    method: 'POST',
    description: 'Initialize grant management system with seed data'
  });
}
