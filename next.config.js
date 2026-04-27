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
  // Security headers
  // 2026-04-27 — Updated connect-src: added craudiovizai.com, *.vercel.app,
  //              www.paypal.com, api.resend.com to cover internal API calls
  //              and preview deployment communication.
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
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://js.stripe.com https://www.paypal.com https://www.google-analytics.com https://www.googletagmanager.com https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://craudiovizai.com https://*.vercel.app https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.paypal.com https://www.paypal.com https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.resend.com https://cloudflareinsights.com",
              "frame-src https://js.stripe.com https://www.paypal.com https://www.youtube.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
