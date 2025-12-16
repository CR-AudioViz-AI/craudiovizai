import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Allowed origins for cross-domain auth
const ALLOWED_ORIGINS = [
  'https://cravbarrels.com',
  'https://cardverse.craudiovizai.com',
  'https://games.craudiovizai.com',
  'https://javariai.com',
  'http://localhost:3000',
  'http://localhost:3001',
]

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  
  // CORS check
  if (!ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
    return NextResponse.json({ error: 'Unauthorized origin' }, { status: 403 })
  }

  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify the token
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user profile with credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Return session info
    const response = NextResponse.json({
      access_token: token,
      refresh_token: null, // Don't expose refresh token cross-domain
      expires_at: Date.now() + 3600 * 1000, // 1 hour
      user: {
        id: user.id,
        email: user.email,
        name: profile.name || user.user_metadata?.full_name,
        avatar_url: profile.avatar_url || user.user_metadata?.avatar_url,
        credits_balance: profile.credits_balance,
        plan: profile.plan,
        apps_access: profile.apps_access || [],
        created_at: profile.created_at,
        last_login: profile.last_login,
      },
    })

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')

    return response
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  
  const response = new NextResponse(null, { status: 200 })
  
  if (ALLOWED_ORIGINS.some(o => origin.startsWith(o))) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-App-ID')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}
