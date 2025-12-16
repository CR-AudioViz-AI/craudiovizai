import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const returnUrl = requestUrl.searchParams.get('return') || '/'
  const appId = requestUrl.searchParams.get('app') || 'main'

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Exchange code for session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/error?message=${error.message}`)
    }

    if (session) {
      // Ensure user profile exists with initial credits
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single()

      if (!existingProfile) {
        // Create new profile with 1000 free credits
        await supabase.from('profiles').insert({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
          avatar_url: session.user.user_metadata?.avatar_url || null,
          credits_balance: 1000,
          plan: 'free',
          created_at: new Date().toISOString(),
        })

        // Record initial credit grant
        await supabase.from('credit_transactions').insert({
          user_id: session.user.id,
          amount: 1000,
          transaction_type: 'bonus',
          description: 'Welcome bonus - 1000 free credits!',
          app_id: appId,
        })
      }

      // Update last login
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', session.user.id)

      // Generate cross-domain token for the app
      const token = session.access_token

      // Determine redirect
      if (returnUrl.startsWith('http')) {
        // External app - include token in URL
        const redirectUrl = new URL(returnUrl)
        redirectUrl.searchParams.set('token', token)
        return NextResponse.redirect(redirectUrl.toString())
      } else {
        // Same domain - just redirect
        return NextResponse.redirect(`${requestUrl.origin}${returnUrl}`)
      }
    }
  }

  // No code - redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
}
