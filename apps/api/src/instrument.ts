import * as Sentry from '@sentry/node'
import { env } from '@/config/env'

/**
 * Sentry initialisation.
 *
 * Imported as the very first module in index.ts (before the Express app) so the
 * HTTP/Express auto-instrumentation is in place. A no-op when SENTRY_DSN is unset,
 * which keeps local/test/CI runs free of any Sentry network activity.
 */
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    release: env.APP_VERSION,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
  })
}
