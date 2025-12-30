// /api/moderation/queue/route.ts
// Moderation Queue API - CR AudioViz AI
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// GET: List moderation queue items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');
    const status = searchParams.get('status') || 'pending';
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const assignedTo = searchParams.get('assignedTo');
    const contentType = searchParams.get('contentType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get single item
    if (itemId) {
      const { data, error } = await supabase
        .from('moderation_queue')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      return NextResponse.json({ item: data });
    }

    // Build query
    let query = supabase
      .from('moderation_queue')
      .select('*', { count: 'exact' });

    // Status filter (can be comma-separated)
    if (status && status !== 'all') {
      const statuses = status.split(',');
      query = query.in('status', statuses);
    }

    if (category) {
      query = query.eq('flag_category', category);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (assignedTo) {
      if (assignedTo === 'unassigned') {
        query = query.is('assigned_to', null);
      } else {
        query = query.eq('assigned_to', assignedTo);
      }
    }

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    // Order by priority (high first) then created date
    query = query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get stats
    const { data: stats } = await supabase
      .from('moderation_queue')
      .select('status, severity')
      .in('status', ['pending', 'in_review', 'escalated']);

    const queueStats = {
      pending: stats?.filter(s => s.status === 'pending').length || 0,
      inReview: stats?.filter(s => s.status === 'in_review').length || 0,
      escalated: stats?.filter(s => s.status === 'escalated').length || 0,
      critical: stats?.filter(s => s.severity === 'critical').length || 0,
      high: stats?.filter(s => s.severity === 'high').length || 0
    };

    return NextResponse.json({
      items: data || [],
      total: count || 0,
      stats: queueStats,
      limit,
      offset
    });

  } catch (error) {
    console.error('Moderation queue API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add item to queue (flag content)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contentType,
      contentId,
      contentTable,
      contentSnapshot,
      userId,
      reportedBy,
      flagSource,
      flagReason,
      flagCategory,
      severity = 'medium',
      confidenceScore
    } = body;

    if (!contentType || !contentId || !flagSource || !flagReason || !flagCategory) {
      return NextResponse.json(
        { error: 'contentType, contentId, flagSource, flagReason, and flagCategory required' },
        { status: 400 }
      );
    }

    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Check if already in queue
    const { data: existing } = await supabase
      .from('moderation_queue')
      .select('id, status')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .in('status', ['pending', 'in_review'])
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Content already in moderation queue',
        queueId: existing.id
      });
    }

    // Calculate priority
    let priority = 50;
    if (severity === 'critical') priority = 100;
    else if (severity === 'high') priority = 80;
    else if (severity === 'low') priority = 30;

    // Boost priority for certain categories
    if (['violence', 'illegal_content', 'hate_speech'].includes(flagCategory)) {
      priority = Math.min(100, priority + 20);
    }

    // Create queue item
    const { data: item, error } = await supabase
      .from('moderation_queue')
      .insert({
        content_type: contentType,
        content_id: contentId,
        content_table: contentTable || contentType,
        content_snapshot: contentSnapshot,
        user_id: userId,
        reported_by: reportedBy,
        flag_source: flagSource,
        flag_reason: flagReason,
        flag_category: flagCategory,
        severity,
        confidence_score: confidenceScore,
        priority,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Queue insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log to audit
    await supabase.from('moderation_audit_log').insert({
      actor_type: flagSource === 'ai' ? 'ai' : (flagSource === 'user_report' ? 'system' : 'system'),
      action: 'content_flagged',
      action_category: 'content_review',
      target_type: contentType,
      target_id: contentId,
      details: { flagReason, flagCategory, severity }
    });

    return NextResponse.json({
      success: true,
      item,
      message: 'Content flagged for review'
    });

  } catch (error) {
    console.error('Moderation queue API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update queue item (review, resolve, assign)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      itemId,
      status,
      assignedTo,
      resolution,
      resolutionNotes,
      actionTaken,
      resolvedBy,
      moderatorId // Who is making this change
    } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'itemId required' }, { status: 400 });
    }

    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get current state for audit
    const { data: currentItem } = await supabase
      .from('moderation_queue')
      .select('*')
      .eq('id', itemId)
      .single();

    if (!currentItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updates.status = status;
    }

    if (assignedTo !== undefined) {
      updates.assigned_to = assignedTo;
      updates.assigned_at = assignedTo ? new Date().toISOString() : null;
    }

    if (resolution) {
      updates.resolution = resolution;
    }

    if (resolutionNotes) {
      updates.resolution_notes = resolutionNotes;
    }

    if (actionTaken) {
      updates.action_taken = actionTaken;
    }

    // Mark as resolved
    if (['approved', 'rejected'].includes(status)) {
      updates.resolved_by = resolvedBy || moderatorId;
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('moderation_queue')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log to audit
    await supabase.from('moderation_audit_log').insert({
      actor_id: moderatorId,
      actor_type: 'moderator',
      action: status ? `status_changed_to_${status}` : 'item_updated',
      action_category: 'content_review',
      target_type: 'moderation_queue',
      target_id: itemId,
      previous_state: { status: currentItem.status },
      new_state: updates,
      reason: resolutionNotes
    });

    // If action taken against user, update their trust score
    if (actionTaken && ['content_removed', 'user_warned', 'user_suspended', 'user_banned'].includes(actionTaken)) {
      if (currentItem.user_id) {
        // Increment violation count
        await supabase
          .from('user_trust_scores')
          .update({
            total_content_removed: supabase.rpc('increment', { x: 1 }),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', currentItem.user_id);

        // Create warning if applicable
        if (['user_warned', 'content_removed'].includes(actionTaken)) {
          await supabase.from('user_warnings').insert({
            user_id: currentItem.user_id,
            warning_type: 'content_violation',
            severity: currentItem.severity === 'critical' ? 'severe' : 
                     currentItem.severity === 'high' ? 'moderate' : 'mild',
            reason: currentItem.flag_reason,
            related_content_type: currentItem.content_type,
            related_content_id: currentItem.content_id,
            moderation_queue_id: itemId,
            issued_by: moderatorId,
            expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      item: data
    });

  } catch (error) {
    console.error('Moderation queue API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
