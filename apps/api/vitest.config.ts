import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/ecommerce_test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'test-access-secret-at-least-32-characters-long',
      JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-characters-long',
      STRIPE_SECRET_KEY: 'sk_test_placeholder_for_tests',
      STRIPE_WEBHOOK_SECRET: 'whsec_placeholder_for_tests',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      include: ['src/**'],
      exclude: [
        'src/**/*.test.ts',
        'src/generated/**', // Prisma v7 generated client (~34k lines of codegen)
        'src/index.ts', // server bootstrap (process-level, not unit-testable)
        'src/instrument.ts', // Sentry init (no-op without DSN)
        'src/scripts/**', // operational scripts (backup, reindex, loadtest seeds)
        'src/docs/**', // OpenAPI spec
        'src/**/*.d.ts',
        'src/types/**',
      ],
      // Wave 2 met the 80% backend exit criterion (L80.6 F74.8 B82.2). Floors locked
      // just below current to guard against regressions. See docs/testing.md.
      thresholds: {
        lines: 80,
        functions: 74,
        branches: 81,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
