/**
 * CR AudioViz AI - App Registry API
 * ==================================
 * 
 * Central registry for all apps in the ecosystem.
 * Provides app discovery, health monitoring, and status reporting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// App registry data (can be moved to database later)
const APP_REGISTRY = [
  { id: 'javariverse-hub', name: 'CR AudioViz AI Hub', url: 'https://craudiovizai.com', category: 'platform' },
  { id: 'javari-market', name: 'Market Oracle', url: 'https://market.craudiovizai.com', category: 'finance' },
  { id: 'javari-invoice', name: 'Invoice Generator', url: 'https://invoice.craudiovizai.com', category: 'business' },
  { id: 'crochet-platform', name: 'CrochetAI', url: 'https://crochet.craudiovizai.com', category: 'creative' },
  { id: 'knitting-platform', name: 'KnittingAI', url: 'https://knitting.craudiovizai.com', category: 'creative' },
  { id: 'machineknit-platform', name: 'MachineKnitAI', url: 'https://machineknit.craudiovizai.com', category: 'creative' },
  { id: 'javari-travel', name: 'Travel Planner', url: 'https://travel.craudiovizai.com', category: 'travel' },
  { id: 'javari-realty', name: 'AgentOS', url: 'https://realty.craudiovizai.com', category: 'realestate' },
  { id: 'javari-games-hub', name: 'Games Hub', url: 'https://games.craudiovizai.com', category: 'games' },
  { id: 'javari-pdf-tools', name: 'PDF Tools', url: 'https://pdf.craudiovizai.com', category: 'tools' },
  { id: 'javari-ebook', name: 'eBook Creator', url: 'https://ebook.craudiovizai.com', category: 'creative' },
];

// GET /api/registry - Get all apps
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  let apps = APP_REGISTRY;
  
  if (category) {
    apps = apps.filter(app => app.category === category);
  }
  
  return NextResponse.json({
    success: true,
    data: apps,
    count: apps.length
  });
}

// POST /api/registry - Report app status (for health monitoring)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { app_id, status, details, timestamp } = body;
    
    if (!app_id || !status) {
      return NextResponse.json(
        { success: false, error: 'app_id and status are required' },
        { status: 400 }
      );
    }
    
    // Store health report (can be expanded to use database)
    console.log(`[Registry] Health report: ${app_id} - ${status}`, details);
    
    // Could store in database:
    // await supabase.from('app_health').insert({ app_id, status, details, reported_at: timestamp });
    
    return NextResponse.json({
      success: true,
      message: 'Health report received'
    });
  } catch (error) {
    console.error('[Registry] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
