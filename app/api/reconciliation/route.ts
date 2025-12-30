// /api/reconciliation/route.ts
// Reconciliation & Financial Integrity API - CR AudioViz AI
// ChatGPT's "must have" for enterprise-grade financial operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// GET: Fetch reconciliation data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const date = searchParams.get('date');
    const type = searchParams.get('type');

    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    switch (action) {
      // Get reconciliation snapshots
      case 'snapshots': {
        let query = supabase
          .from('reconciliation_snapshots')
          .select('*')
          .order('snapshot_date', { ascending: false })
          .limit(30);

        if (date) {
          query = query.eq('snapshot_date', date);
        }
        if (type) {
          query = query.eq('snapshot_type', type);
        }

        const { data, error } = await query;

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ snapshots: data || [] });
      }

      // Get alerts
      case 'alerts': {
        const acknowledged = searchParams.get('acknowledged');
        
        let query = supabase
          .from('reconciliation_alerts')
          .select('*, snapshot:reconciliation_snapshots(*)')
          .order('created_at', { ascending: false })
          .limit(50);

        if (acknowledged === 'false') {
          query = query.eq('acknowledged', false);
        }

        const { data, error } = await query;

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ alerts: data || [] });
      }

      // Get credits ledger
      case 'credits-ledger': {
        const userId = searchParams.get('userId');
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

        let query = supabase
          .from('credits_ledger')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ledger: data || [] });
      }

      // Get dashboard summary
      case 'dashboard': {
        // Get recent snapshots
        const { data: snapshots } = await supabase
          .from('reconciliation_snapshots')
          .select('*')
          .order('snapshot_date', { ascending: false })
          .limit(7);

        // Get unacknowledged alerts
        const { data: alerts, count: alertCount } = await supabase
          .from('reconciliation_alerts')
          .select('*', { count: 'exact' })
          .eq('acknowledged', false)
          .order('created_at', { ascending: false })
          .limit(10);

        // Get today's totals
        const today = new Date().toISOString().split('T')[0];
        
        const { data: todayCredits } = await supabase
          .from('credits_ledger')
          .select('delta')
          .gte('created_at', `${today}T00:00:00Z`);

        const { data: todayOrders } = await supabase
          .from('marketplace_orders')
          .select('total_amount')
          .gte('created_at', `${today}T00:00:00Z`)
          .eq('status', 'completed');

        // Calculate totals
        const creditsAdded = todayCredits?.filter(c => c.delta > 0).reduce((sum, c) => sum + c.delta, 0) || 0;
        const creditsUsed = Math.abs(todayCredits?.filter(c => c.delta < 0).reduce((sum, c) => sum + c.delta, 0) || 0);
        const ordersTotal = todayOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

        // Check overall health
        const hasDiscrepancies = snapshots?.some(s => s.status === 'discrepancy');
        const health = hasDiscrepancies ? 'warning' : 'healthy';

        return NextResponse.json({
          health,
          today: {
            date: today,
            creditsAdded,
            creditsUsed,
            ordersTotal,
            orderCount: todayOrders?.length || 0
          },
          recentSnapshots: snapshots || [],
          alerts: alerts || [],
          alertCount: alertCount || 0
        });
      }

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use: snapshots, alerts, credits-ledger, dashboard' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Reconciliation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Run reconciliation jobs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, date } = body;

    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const targetDate = date || new Date(Date.now() - 86400000).toISOString().split('T')[0]; // Yesterday

    switch (action) {
      // Run credits reconciliation
      case 'reconcile-credits': {
        // Get ledger totals by user
        const { data: ledgerTotals, error: ledgerError } = await supabase
          .from('credits_ledger')
          .select('user_id, delta')
          .lte('created_at', `${targetDate}T23:59:59Z`);

        if (ledgerError) {
          return NextResponse.json({ error: ledgerError.message }, { status: 500 });
        }

        // Aggregate by user
        const userTotals: Record<string, number> = {};
        ledgerTotals?.forEach(entry => {
          userTotals[entry.user_id] = (userTotals[entry.user_id] || 0) + entry.delta;
        });

        const totalFromLedger = Object.values(userTotals).reduce((sum, v) => sum + v, 0);
        const userCount = Object.keys(userTotals).length;

        // Get from user_credits table for comparison
        const { data: balances } = await supabase
          .from('user_credits')
          .select('user_id, balance');

        const totalFromBalances = balances?.reduce((sum, b) => sum + (b.balance || 0), 0) || 0;
        const difference = Math.abs(totalFromLedger - totalFromBalances);
        const status = difference < 1 ? 'matched' : 'discrepancy';

        // Create snapshot
        const { data: snapshot, error: snapError } = await supabase
          .from('reconciliation_snapshots')
          .upsert({
            snapshot_date: targetDate,
            snapshot_type: 'credits',
            expected_total: totalFromLedger,
            actual_total: totalFromBalances,
            difference,
            status,
            details: {
              user_count: userCount,
              ledger_entries: ledgerTotals?.length || 0
            }
          }, {
            onConflict: 'snapshot_date,snapshot_type'
          })
          .select()
          .single();

        if (snapError) {
          return NextResponse.json({ error: snapError.message }, { status: 500 });
        }

        // Create alert if discrepancy
        if (status === 'discrepancy') {
          await supabase.from('reconciliation_alerts').insert({
            snapshot_id: snapshot.id,
            alert_type: 'credits_mismatch',
            severity: difference > 1000 ? 'critical' : 'warning',
            message: `Credits reconciliation found discrepancy of ${difference}`,
            details: { difference, date: targetDate }
          });
        }

        return NextResponse.json({
          success: true,
          snapshot,
          status,
          totalFromLedger,
          totalFromBalances,
          difference
        });
      }

      // Run orders reconciliation
      case 'reconcile-orders': {
        // Get orders for the date
        const { data: orders } = await supabase
          .from('marketplace_orders')
          .select('id, total_amount, status, vendor_id')
          .gte('created_at', `${targetDate}T00:00:00Z`)
          .lte('created_at', `${targetDate}T23:59:59Z`);

        // Get payouts for the date
        const { data: payouts } = await supabase
          .from('marketplace_payouts')
          .select('id, amount, order_ids')
          .gte('created_at', `${targetDate}T00:00:00Z`)
          .lte('created_at', `${targetDate}T23:59:59Z`);

        const ordersTotal = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
        const payoutsTotal = payouts?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        
        // Expected payout = orders * (1 - commission rate)
        const expectedPayout = ordersTotal * 0.85; // 15% commission
        const difference = Math.abs(expectedPayout - payoutsTotal);
        const status = difference < 1 ? 'matched' : 'discrepancy';

        const { data: snapshot } = await supabase
          .from('reconciliation_snapshots')
          .upsert({
            snapshot_date: targetDate,
            snapshot_type: 'orders',
            expected_total: expectedPayout,
            actual_total: payoutsTotal,
            difference,
            status,
            details: {
              orders_count: orders?.length || 0,
              orders_total: ordersTotal,
              payouts_count: payouts?.length || 0,
              payouts_total: payoutsTotal
            }
          }, {
            onConflict: 'snapshot_date,snapshot_type'
          })
          .select()
          .single();

        return NextResponse.json({
          success: true,
          snapshot,
          status,
          ordersTotal,
          expectedPayout,
          payoutsTotal,
          difference
        });
      }

      // Run refunds reconciliation
      case 'reconcile-refunds': {
        // Get refunds for the date
        const { data: refunds } = await supabase
          .from('credits_ledger')
          .select('*')
          .eq('reason', 'refund')
          .gte('created_at', `${targetDate}T00:00:00Z`)
          .lte('created_at', `${targetDate}T23:59:59Z`);

        // Get corresponding error logs
        const { data: errors } = await supabase
          .from('error_logs')
          .select('id')
          .gte('created_at', `${targetDate}T00:00:00Z`)
          .lte('created_at', `${targetDate}T23:59:59Z`);

        const refundsTotal = refunds?.reduce((sum, r) => sum + Math.abs(r.delta), 0) || 0;
        const refundCount = refunds?.length || 0;
        const errorCount = errors?.length || 0;

        const { data: snapshot } = await supabase
          .from('reconciliation_snapshots')
          .upsert({
            snapshot_date: targetDate,
            snapshot_type: 'refunds',
            expected_total: refundCount,
            actual_total: refundsTotal,
            difference: 0,
            status: 'matched',
            details: {
              refund_count: refundCount,
              refunds_total: refundsTotal,
              error_count: errorCount,
              refund_rate: errorCount > 0 ? (refundCount / errorCount * 100).toFixed(2) + '%' : '0%'
            }
          }, {
            onConflict: 'snapshot_date,snapshot_type'
          })
          .select()
          .single();

        return NextResponse.json({
          success: true,
          snapshot,
          refundCount,
          refundsTotal,
          errorCount
        });
      }

      // Run all reconciliations
      case 'reconcile-all': {
        const results = {
          credits: null as any,
          orders: null as any,
          refunds: null as any
        };

        // Run each reconciliation
        for (const type of ['credits', 'orders', 'refunds']) {
          const res = await fetch(request.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: `reconcile-${type}`, date: targetDate })
          });
          results[type as keyof typeof results] = await res.json();
        }

        return NextResponse.json({
          success: true,
          date: targetDate,
          results
        });
      }

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use: reconcile-credits, reconcile-orders, reconcile-refunds, reconcile-all' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Reconciliation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Acknowledge alerts
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, acknowledgedBy, notes } = body;

    if (!alertId) {
      return NextResponse.json({ error: 'alertId required' }, { status: 400 });
    }

    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data, error } = await supabase
      .from('reconciliation_alerts')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: acknowledgedBy
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, alert: data });

  } catch (error) {
    console.error('Reconciliation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
