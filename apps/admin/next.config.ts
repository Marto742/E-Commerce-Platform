import path from 'path'
import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@repo/ui', '@repo/utils', '@repo/validation'],
}

// Only engage the Sentry build plugin when a DSN is configured, so local/CI
// builds without Sentry are completely unaffected. Source-map upload reads
// SENTRY_AUTH_TOKEN/SENTRY_ORG/SENTRY_PROJECT from the build environment.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, { silent: true })
  : nextConfig
