import { resolve } from 'node:path';
import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // The protocol package ships TypeScript source on purpose: the emulator, the
  // PWA and the server all compile the same files, so they cannot drift.
  transpilePackages: ['@wonderbox/hardware-protocol'],
  poweredByHeader: false,
  // The repository this app lives in has its own lockfile at the top; point
  // tracing at the workspace root so Next does not guess.
  outputFileTracingRoot: resolve(import.meta.dirname, '../..'),
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // No third-party anything: no ads, no analytics, no embedded players.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), geolocation=(), interest-cohort=(), microphone=(self)',
          },
        ],
      },
      {
        // Audio and invoices are private; never let a CDN or browser cache them.
        source: '/api/audio/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
    ];
  },
};

export default config;
