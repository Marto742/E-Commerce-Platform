import * as Sentry from '@sentry/nextjs'

// No-op unless NEXT_PUBLIC_SENTRY_DSN is set (so local/CI builds stay clean).
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0,
  })
}
