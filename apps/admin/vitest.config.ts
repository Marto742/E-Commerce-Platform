import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      // E2E-first strategy: gated unit coverage targets the lib logic surface. Dashboard
      // components (tables, forms, charts) and pages are exercised by Playwright E2E.
      include: ['src/lib/**'],
      exclude: [
        'src/test/**',
        'src/lib/server-fetch.ts', // server-only (next/headers cookies) — E2E/pages
      ],
      // Wave 3: lib logic fully covered (L100 F100 B95). Floors locked below current;
      // dashboard components/pages are covered by Playwright E2E. See docs/testing.md.
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Stub Next.js navigation so components that import it can render in jsdom
      'next/navigation': path.resolve(__dirname, './src/test/__mocks__/next-navigation.ts'),
      'next/image': path.resolve(__dirname, './src/test/__mocks__/next-image.tsx'),
      'next/link': path.resolve(__dirname, './src/test/__mocks__/next-link.tsx'),
    },
  },
})
