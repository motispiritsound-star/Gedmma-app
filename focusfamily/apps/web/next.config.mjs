/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The domain package ships as compiled ESM from the workspace.
  transpilePackages: ['@focusfamily/domain'],
  poweredByHeader: false,
  // The repository root holds an unrelated project with its own lockfile.
  outputFileTracingRoot: new URL('.', import.meta.url).pathname,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'x-content-type-options', value: 'nosniff' },
          { key: 'x-frame-options', value: 'DENY' },
          { key: 'referrer-policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'permissions-policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
