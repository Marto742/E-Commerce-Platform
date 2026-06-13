import path from 'path'
import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '*.yourdomain.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Transpile shared workspace packages
  transpilePackages: ['@repo/ui', '@repo/utils', '@repo/validation'],
}

// Only engage the Sentry build plugin when a DSN is configured, so local/CI
// builds without Sentry are completely unaffected. Source-map upload reads
// SENTRY_AUTH_TOKEN/SENTRY_ORG/SENTRY_PROJECT from the build environment.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, { silent: true })
  : nextConfig
