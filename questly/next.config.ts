import type { NextConfig } from 'next'

/**
 * Security headers are applied to every response. `Content-Security-Policy` is
 * intentionally strict: Questly renders no third-party scripts and loads no
 * remote images, so nothing outside the origin needs to be allow-listed.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js injects inline bootstrap scripts; styles are inlined by Tailwind.
      "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client'],
  // The repository hosts more than one project; pin the tracing root explicitly.
  outputFileTracingRoot: process.cwd(),
  typedRoutes: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // The service worker must never be cached aggressively.
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
    ]
  },
}

export default nextConfig
