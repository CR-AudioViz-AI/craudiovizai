// /api/analytics/dashboard/route.ts
// Analytics Dashboard API - CR AudioViz AI
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - this route uses request.url
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const days = parseInt(searchParams.get('days') || '7');
    const metric = searchParams.get('metric') || 'overview';

    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    switch (metric) {
      case 'overview':
        return NextResponse.json(await getOverview(supabase, appId, startDate));
      case 'events':
        return NextResponse.json(await getEventBreakdown(supabase, appId, startDate));
      case 'users':
        return NextResponse.json(await getUserMetrics(supabase, appId, startDate));
      case 'revenue':
        return NextResponse.json(await getRevenueMetrics(supabase, appId, startDate));
      case 'cross-module':
        return NextResponse.json(await getCrossModuleMetrics(supabase, startDate));
      default:
        return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
    }

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Overview metrics
async function getOverview(
  supabase: ReturnType<typeof createClient>,
  appId: string | null,
  startDate: Date
) {
  let query = supabase
    .from('analytics_events')
    .select('event_type, created_at, user_id, session_id')
    .gte('created_at', startDate.toISOString());

  if (appId) {
    query = query.eq('app_id', appId);
  }

  const { data: events, error } = await query;

  if (error) {
    console.error('Overview query error:', error);
    return { error: error.message };
  }

  // Calculate metrics
  const pageViews = events?.filter(e => e.event_type === 'page_view').length || 0;
  const uniqueUsers = new Set(events?.filter(e => e.user_id).map(e => e.user_id)).size;
  const uniqueSessions = new Set(events?.map(e => e.session_id)).size;
  const toolsUsed = events?.filter(e => e.event_type === 'tool_completed').length || 0;
  const errors = events?.filter(e => e.event_type === 'error_occurred').length || 0;

  // Daily breakdown
  const dailyData: Record<string, { views: number; users: Set<string>; tools: number }> = {};
  
  events?.forEach(event => {
    const date = event.created_at.split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = { views: 0, users: new Set(), tools: 0 };
    }
    if (event.event_type === 'page_view') dailyData[date].views++;
    if (event.user_id) dailyData[date].users.add(event.user_id);
    if (event.event_type === 'tool_completed') dailyData[date].tools++;
  });

  const dailyBreakdown = Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      pageViews: data.views,
      uniqueUsers: data.users.size,
      toolsUsed: data.tools
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    summary: {
      pageViews,
      uniqueUsers,
      uniqueSessions,
      toolsUsed,
      errors,
      avgSessionViews: uniqueSessions > 0 ? Math.round(pageViews / uniqueSessions * 10) / 10 : 0
    },
    dailyBreakdown,
    period: {
      start: startDate.toISOString(),
      end: new Date().toISOString()
    }
  };
}

// Event breakdown
async function getEventBreakdown(
  supabase: ReturnType<typeof createClient>,
  appId: string | null,
  startDate: Date
) {
  let query = supabase
    .from('analytics_events')
    .select('event_type, app_id, created_at')
    .gte('created_at', startDate.toISOString());

  if (appId) {
    query = query.eq('app_id', appId);
  }

  const { data: events, error } = await query;

  if (error) {
    return { error: error.message };
  }

  // Count by event type
  const eventCounts: Record<string, number> = {};
  const appCounts: Record<string, number> = {};

  events?.forEach(event => {
    eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
    appCounts[event.app_id] = (appCounts[event.app_id] || 0) + 1;
  });

  return {
    byEventType: Object.entries(eventCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    byApp: Object.entries(appCounts)
      .map(([app, count]) => ({ app, count }))
      .sort((a, b) => b.count - a.count),
    total: events?.length || 0
  };
}

// User metrics
async function getUserMetrics(
  supabase: ReturnType<typeof createClient>,
  appId: string | null,
  startDate: Date
) {
  let query = supabase
    .from('analytics_events')
    .select('event_type, user_id, created_at')
    .gte('created_at', startDate.toISOString())
    .not('user_id', 'is', null);

  if (appId) {
    query = query.eq('app_id', appId);
  }

  const { data: events, error } = await query;

  if (error) {
    return { error: error.message };
  }

  // User activity
  const userActivity: Record<string, { events: number; firstSeen: string; lastSeen: string }> = {};

  events?.forEach(event => {
    if (!event.user_id) return;
    
    if (!userActivity[event.user_id]) {
      userActivity[event.user_id] = {
        events: 0,
        firstSeen: event.created_at,
        lastSeen: event.created_at
      };
    }
    userActivity[event.user_id].events++;
    if (event.created_at > userActivity[event.user_id].lastSeen) {
      userActivity[event.user_id].lastSeen = event.created_at;
    }
  });

  const signups = events?.filter(e => e.event_type === 'signup').length || 0;
  const logins = events?.filter(e => e.event_type === 'login').length || 0;

  return {
    totalUsers: Object.keys(userActivity).length,
    newUsers: signups,
    returningUsers: Object.keys(userActivity).length - signups,
    totalLogins: logins,
    topUsers: Object.entries(userActivity)
      .map(([id, data]) => ({ userId: id, ...data }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10)
  };
}

// Revenue metrics
async function getRevenueMetrics(
  supabase: ReturnType<typeof createClient>,
  appId: string | null,
  startDate: Date
) {
  // Get credit transactions
  const { data: transactions, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .eq('transaction_type', 'purchase');

  if (error) {
    return { error: error.message };
  }

  // Calculate revenue
  let totalRevenue = 0;
  let totalCredits = 0;
  const dailyRevenue: Record<string, number> = {};

  transactions?.forEach(tx => {
    const amount = tx.metadata?.price_cents || 0;
    totalRevenue += amount;
    totalCredits += tx.amount || 0;

    const date = tx.created_at.split('T')[0];
    dailyRevenue[date] = (dailyRevenue[date] || 0) + amount;
  });

  return {
    totalRevenue: totalRevenue / 100, // Convert to dollars
    totalCredits,
    transactions: transactions?.length || 0,
    avgTransactionValue: transactions?.length 
      ? Math.round(totalRevenue / transactions.length) / 100 
      : 0,
    dailyRevenue: Object.entries(dailyRevenue)
      .map(([date, cents]) => ({ date, revenue: cents / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date))
  };
}

// Cross-module metrics
async function getCrossModuleMetrics(
  supabase: ReturnType<typeof createClient>,
  startDate: Date
) {
  const { data: events, error } = await supabase
    .from('analytics_events')
    .select('event_type, app_id, properties, user_id')
    .gte('created_at', startDate.toISOString())
    .eq('event_type', 'cross_module_click');

  if (error) {
    return { error: error.message };
  }

  // Track flows between apps
  const flows: Record<string, number> = {};
  
  events?.forEach(event => {
    const from = event.app_id;
    const to = event.properties?.destination_app || 'unknown';
    const key = `${from} → ${to}`;
    flows[key] = (flows[key] || 0) + 1;
  });

  return {
    totalCrossModuleClicks: events?.length || 0,
    uniqueUsers: new Set(events?.map(e => e.user_id)).size,
    topFlows: Object.entries(flows)
      .map(([flow, count]) => ({ flow, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  };
}
