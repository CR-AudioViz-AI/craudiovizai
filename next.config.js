/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    domains: ['kteobfyferrukqeolofj.supabase.co'],
  },
  // Handle server-side packages
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Dont resolve server-only modules on client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        pg: false,
        crypto: false,
        stream: false,
        dns: false,
        child_process: false,
      };
    }
    // Externalize pg on server side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('pg', 'pg-native');
    }
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Security headers — CORS handled dynamically per-route in API handlers
  // 2026-04-09 — Removed static CORS from next.config: billing routes now use
  // dynamic origin reflection (see app/api/billing/*/route.ts).
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-XSS-Protection',       value: '1; mode=block' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://js.stripe.com https://www.paypal.com https://www.google-analytics.com https://www.googletagmanager.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https: http:; connect-src 'self' https://*.supabase.co https://api.stripe.com https://api.paypal.com https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://cloudflareinsights.com wss://*.supabase.co; frame-src https://js.stripe.com https://www.paypal.com https://www.youtube.com; object-src 'none'; base-uri 'self';",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
