// =============================================================================
// CR AUDIOVIZ AI - CENTRALIZED ENHANCEMENTS API (SIMPLIFIED)
// =============================================================================
// Production Ready - December 15, 2025
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kteobfyferrukqeolofj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Simple fetch wrapper for Supabase
async function supabaseQuery(table: string, options: {
  method?: string;
  select?: string;
  filters?: Record<string, string>;
  body?: any;
  single?: boolean;
} = {}) {
  const { method = 'GET', select = '*', filters = {}, body, single } = options;
  
  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  const params = new URLSearchParams();
  
  if (select) params.set('select', select);
  Object.entries(filters).forEach(([key, value]) => {
    params.set(key, value);
  });
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };
  
  if (method === 'POST' || method === 'PATCH') {
    headers['Prefer'] = 'return=representation';
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `Supabase error: ${response.status}`);
  }
  
  return single && Array.isArray(data) ? data[0] : data;
}

// ============ GET - List/Get Enhancements ============
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');
    const status = searchParams.get('status');
    const source_app = searchParams.get('source_app');
    const approval_status = searchParams.get('approval_status');
    const limit = searchParams.get('limit') || '50';
    const sort_by = searchParams.get('sort_by') || 'created_at';
    
    // Build filters
    const filters: Record<string, string> = {};
    if (id) filters['id'] = `eq.${id}`;
    if (user_id) filters['user_id'] = `eq.${user_id}`;
    if (status) filters['status'] = `eq.${status}`;
    if (source_app) filters['source_app'] = `eq.${source_app}`;
    if (approval_status) filters['approval_status'] = `eq.${approval_status}`;
    filters['limit'] = limit;
    
    if (sort_by === 'upvotes') {
      filters['order'] = 'upvotes.desc';
    } else if (sort_by === 'views') {
      filters['order'] = 'view_count.desc';
    } else {
      filters['order'] = 'created_at.desc';
    }
    
    const enhancements = await supabaseQuery('enhancement_requests', { filters });
    
    // Get stats
    const allEnhancements = await supabaseQuery('enhancement_requests', { 
      select: 'status,source_app,approval_status,upvotes' 
    });
    
    const stats = {
      total: allEnhancements?.length || 0,
      byStatus: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      byApproval: {} as Record<string, number>,
      totalUpvotes: 0
    };
    
    (allEnhancements || []).forEach((e: any) => {
      stats.byStatus[e.status] = (stats.byStatus[e.status] || 0) + 1;
      stats.bySource[e.source_app || 'platform'] = (stats.bySource[e.source_app || 'platform'] || 0) + 1;
      if (e.approval_status) {
        stats.byApproval[e.approval_status] = (stats.byApproval[e.approval_status] || 0) + 1;
      }
      stats.totalUpvotes += e.upvotes || 0;
    });
    
    return NextResponse.json({
      success: true,
      enhancements: enhancements || [],
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('GET enhancements error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get enhancements',
      debug: {
        supabase_url: SUPABASE_URL,
        has_key: !!SUPABASE_KEY
      }
    }, { status: 500 });
  }
}

// ============ POST - Create Enhancement ============
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.category) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: title, description, category'
      }, { status: 400 });
    }
    
    // Generate request number
    const requestNumber = `ENH-${Date.now().toString(36).toUpperCase()}`;
    
    // Create enhancement
    const enhancement = await supabaseQuery('enhancement_requests', {
      method: 'POST',
      body: {
        request_number: requestNumber,
        title: body.title,
        description: body.description,
        use_case: body.use_case || null,
        expected_benefit: body.expected_benefit || null,
        category: body.category,
        priority: body.priority || 'medium',
        status: 'submitted',
        user_id: body.user_id || null,
        user_email: body.user_email || null,
        user_name: body.user_name || null,
        source_app: body.source_app || 'platform',
        approval_status: 'pending'
      },
      single: true
    });
    
    // Add system comment
    await supabaseQuery('enhancement_comments', {
      method: 'POST',
      body: {
        enhancement_id: enhancement.id,
        author_type: 'system',
        author_name: 'System',
        content: `💡 Enhancement request ${requestNumber} submitted.\n📍 Source: ${body.source_app || 'platform'}\n\n🤖 Javari AI will analyze this request and provide an implementation plan.`
      }
    });
    
    // Log activity
    await supabaseQuery('enhancement_activity', {
      method: 'POST',
      body: {
        enhancement_id: enhancement.id,
        action: 'enhancement_submitted',
        actor_type: 'user',
        actor_name: body.user_name || 'Anonymous',
        new_value: { status: 'submitted', source_app: body.source_app || 'platform' }
      }
    });
    
    return NextResponse.json({
      success: true,
      enhancement: {
        id: enhancement.id,
        request_number: requestNumber,
        status: 'submitted',
        message: 'Enhancement request submitted. Javari AI will analyze and provide an implementation plan.'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('POST enhancement error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create enhancement'
    }, { status: 500 });
  }
}

// ============ PATCH - Update Enhancement (Admin) ============
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing enhancement id'
      }, { status: 400 });
    }
    
    // Handle special actions
    if (action === 'approve') {
      updates.approval_status = 'approved';
      updates.approved_by = body.approved_by || 'Admin';
      updates.approved_at = new Date().toISOString();
      updates.status = 'approved';
    } else if (action === 'reject') {
      updates.approval_status = 'rejected';
      updates.rejection_reason = body.rejection_reason;
      updates.status = 'rejected';
    } else if (action === 'start_development') {
      updates.status = 'in_development';
      updates.assigned_to = body.assigned_to || 'Development Team';
    }
    
    // Update via REST API
    const url = `${SUPABASE_URL}/rest/v1/enhancement_requests?id=eq.${id}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updates)
    });
    
    const enhancement = await response.json();
    
    return NextResponse.json({
      success: true,
      enhancement: Array.isArray(enhancement) ? enhancement[0] : enhancement
    });
    
  } catch (error) {
    console.error('PATCH enhancement error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update enhancement'
    }, { status: 500 });
  }
}

// ============ PUT - Vote or Comment ============
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { enhancement_id, action } = body;
    
    if (!enhancement_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing enhancement_id'
      }, { status: 400 });
    }
    
    // Handle vote
    if (action === 'vote') {
      const { user_id, vote_type } = body;
      
      if (!user_id) {
        return NextResponse.json({
          success: false,
          error: 'User ID required for voting'
        }, { status: 400 });
      }
      
      // Get current enhancement
      const enhancement = await supabaseQuery('enhancement_requests', {
        filters: { 'id': `eq.${enhancement_id}` },
        select: 'upvotes,downvotes',
        single: true
      });
      
      // Update vote count
      const updateUrl = `${SUPABASE_URL}/rest/v1/enhancement_requests?id=eq.${enhancement_id}`;
      await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          upvotes: vote_type === 'up' ? (enhancement?.upvotes || 0) + 1 : enhancement?.upvotes || 0,
          downvotes: vote_type === 'down' ? (enhancement?.downvotes || 0) + 1 : enhancement?.downvotes || 0
        })
      });
      
      return NextResponse.json({ success: true, action: 'vote_added', vote_type });
    }
    
    // Handle comment
    if (action === 'comment') {
      const { content, author_type, author_name } = body;
      
      if (!content) {
        return NextResponse.json({
          success: false,
          error: 'Comment content required'
        }, { status: 400 });
      }
      
      const comment = await supabaseQuery('enhancement_comments', {
        method: 'POST',
        body: {
          enhancement_id,
          author_type: author_type || 'user',
          author_name: author_name || 'User',
          content,
          is_internal: false
        },
        single: true
      });
      
      return NextResponse.json({ success: true, comment });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "vote" or "comment"'
    }, { status: 400 });
    
  } catch (error) {
    console.error('PUT enhancement error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Action failed'
    }, { status: 500 });
  }
}
