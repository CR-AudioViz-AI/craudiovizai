// =====================================================
// CR AUDIOVIZ AI - UNIVERSAL SECURITY MIDDLEWARE
// Fortune 50 Protection Layer
// Updated: March 22, 2026 - Added Supabase session refresh
// =====================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Configuration - with safe defaults
const CONFIG = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'craudiovizai',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  HONEYPOT_ENABLED: true,
  HONEYPOT_ROUTES: ['/wp-admin', '/phpmyadmin', '/.env', '/config.php', '/api/v1/admin'],
  FORCE_HTTPS: true,
};

// Attack patterns
const ATTACK_PATTERNS = {
  sqlInjection: [/union.*select/i, /insert.*into/i, /drop.*table/i, /exec\s*\(/i],
  xss: [/<script[\s\S]*?>/i, /javascript:/i, /onerror\s*=/i],
  pathTraversal: [\/\.\.\/\.\.\/\/, /\.\.\\\.\.\\/, /%2e%2e%2f/i],
};

const BLOCKED_USER_AGENTS = ['sqlmap', 'nikto', 'nmap', 'metasploit'];

// Rate limiting store (in-memory for edge)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // ============================================
  // 1. HTTPS REDIRECT (First priority)
  // ============================================
  const proto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host') || '';

  if (CONFIG.FORCE_HTTPS && proto === 'http' && !host.includes('localhost')) {
    const httpsUrl = `https://${host}${pathname}${url.search}`;
    return NextResponse.redirect(httpsUrl, { status: 301 });
  }

  // ============================================
  // 2. SKIP MIDDLEWARE FOR STATIC/INTERNAL
  // ============================================
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/cron') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // ============================================
  // 3. WARMUP REQUEST PASSTHROUGH
  // ============================================
  if (request.headers.get('X-Warmup-Request') === 'true') {
    return NextResponse.next();
  }

  // ============================================
  // 4. HONEYPOT TRAP
  // ============================================
  if (CONFIG.HONEYPOT_ENABLED) {
    for (const route of CONFIG.HONEYPOT_ROUTES) {
      if (pathname.startsWith(route)) {
        console.log(`[HONEYPOT] Trapped: ${pathname} from ${request.ip}`);
        return new NextResponse('Not Found', { status: 404 });
      }
    }
  }

  // ============================================
  // 5. BLOCKED USER AGENTS
  // ============================================
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  for (const blocked of BLOCKED_USER_AGENTS) {
    if (userAgent.includes(blocked)) {
      console.log(`[SECURITY] Blocked user agent: ${blocked}`);
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // ============================================
  // 6. ATTACK PATTERN DETECTION
  // ============================================
  const fullUrl = pathname + url.search;
  for (const [type, patterns] of Object.entries(ATTACK_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(fullUrl)) {
        console.log(`[SECURITY] Blocked ${type} attempt: ${fullUrl}`);
        return new NextResponse('Bad Request', { status: 400 });
      }
    }
  }

  // ============================================
  // 7. RATE LIMITING (Simple in-memory for edge)
  // ============================================
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const rateLimit = rateLimitStore.get(clientIP);

  if (rateLimit) {
    if (now > rateLimit.resetTime) {
      rateLimitStore.set(clientIP, { count: 1, resetTime: now + CONFIG.RATE_LIMIT_WINDOW_MS });
    } else if (rateLimit.count >= CONFIG.RATE_LIMIT_MAX_REQUESTS) {
      return new NextResponse('Too Many Requests', { status: 429 });
    } else {
      rateLimit.count++;
    }
  } else {
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + CONFIG.RATE_LIMIT_WINDOW_MS });
  }

  // ============================================
  // 8. SUPABASE SESSION REFRESH + CONTINUE
  // ============================================
  // Create response first — supabase cookie setter writes into it.
  // Call getUser() to validate and refresh the session token.
  // Return the response so updated cookies are sent to the browser.
  // This is the required @supabase/ssr middleware pattern.
  let response = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get:    (name: string) => request.cookies.get(name)?.value,
          set:    (name: string, value: string, options: object) => {
            request.cookies.set({ name, value, ...options } as any)
            response = NextResponse.next({ request })
            response.cookies.set({ name, value, ...options } as any)
          },
          remove: (name: string, options: object) => {
            request.cookies.set({ name, value: '', ...options } as any)
            response = NextResponse.next({ request })
            response.cookies.set({ name, value: '', ...options } as any)
          },
        },
      }
    )

    // Refresh session — non-fatal if user is not logged in
    await supabase.auth.getUser()
  } catch {
    // Never block a request due to auth errors
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
