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
      // Phase-in floors (just below current baseline) — raised toward the 80% exit
      // criterion as each wave lands. See docs/testing.md. Baseline 2026-06-14: L65 F58 B81.
      thresholds: {
        lines: 64,
        functions: 56,
        branches: 79,
        statements: 64,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
