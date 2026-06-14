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
      // Pages/app routes are exercised by Playwright E2E, not unit coverage.
      include: ['src/components/**', 'src/hooks/**', 'src/lib/**'],
      exclude: ['src/test/**'],
      // Phase-in floors — admin starts near-zero (infra just added) and is raised toward
      // the 70% exit criterion as Wave 3 lands. See docs/testing.md. Baseline 2026-06-14.
      thresholds: {
        lines: 1,
        functions: 7,
        branches: 42,
        statements: 1,
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
