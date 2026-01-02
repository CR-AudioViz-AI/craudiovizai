/**
 * CR AudioViz AI - Enhanced Analytics Tracking
 * =============================================
 * 
 * Comprehensive event tracking with:
 * - Page views
 * - Feature usage
 * - Conversion events
 * - User engagement metrics
 * 
 * @version 2.0.0
 * @date January 2, 2026 - 1:47 AM EST
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Event types for tracking
type EventType = 
  | 'page_view'
  | 'feature_used'
  | 'conversion'
  | 'subscription_started'
  | 'subscription_cancelled'
  | 'credit_purchased'
  | 'credit_used'
  | 'ebook_opened'
  | 'audiobook_converted'
  | 'tool_accessed'
  | 'error_occurred'
  | 'search_performed'
  | 'signup_completed'
  | 'login_performed'

interface TrackingEvent {
  event_type: EventType
  user_id?: string
  session_id?: string
  page_url?: string
  referrer?: string
  properties?: Record<string, any>
  timestamp?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TrackingEvent = await request.json()
    
    // Validate event
    if (!body.event_type) {
      return NextResponse.json({
        error: 'event_type is required'
      }, { status: 400 })
    }
    
    // Extract user agent info
    const userAgent = request.headers.get('user-agent') || ''
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    // Parse device info
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent)
    const isBot = /bot|crawler|spider/i.test(userAgent)
    
    // Skip bot traffic
    if (isBot) {
      return NextResponse.json({ success: true, skipped: 'bot' })
    }
    
    // Build event record
    const event = {
      event_type: body.event_type,
      user_id: body.user_id || null,
      session_id: body.session_id || null,
      page_url: body.page_url || null,
      referrer: body.referrer || null,
      properties: body.properties || {},
      device_type: isMobile ? 'mobile' : 'desktop',
      user_agent: userAgent.substring(0, 500),
      ip_hash: await hashIP(ip), // Hash for privacy
      created_at: body.timestamp || new Date().toISOString()
    }
    
    // Insert into analytics_events table
    const { error } = await supabase
      .from('analytics_events')
      .insert(event)
    
    if (error) {
      console.error('Analytics insert error:', error)
      // Don't fail the request - analytics should be fire-and-forget
    }
    
    // Track conversion events specially
    if (body.event_type === 'conversion' || 
        body.event_type === 'subscription_started' ||
        body.event_type === 'credit_purchased') {
      await trackConversion(event)
    }
    
    // Update user activity
    if (body.user_id) {
      await supabase
        .from('profiles')
        .update({ 
          last_active: new Date().toISOString(),
          total_events: supabase.rpc('increment_counter', { row_id: body.user_id, counter_name: 'total_events' })
        })
        .eq('id', body.user_id)
    }
    
    return NextResponse.json({
      success: true,
      event_type: body.event_type,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip + process.env.ANALYTICS_SALT || 'craudioviz')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function trackConversion(event: any) {
  // Track in conversions table for funnel analysis
  await supabase
    .from('conversions')
    .insert({
      user_id: event.user_id,
      conversion_type: event.event_type,
      value: event.properties?.value || 0,
      source: event.properties?.source || event.referrer,
      properties: event.properties,
      created_at: event.created_at
    })
}

export async function GET(request: NextRequest) {
  // Return tracking pixel for email opens
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('e')
  
  if (eventId) {
    // Track email open
    await supabase
      .from('email_queue')
      .update({ opened_at: new Date().toISOString() })
      .eq('id', eventId)
  }
  
  // Return 1x1 transparent GIF
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
  
  return new NextResponse(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}
