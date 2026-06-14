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
      // E2E-first strategy: gated unit coverage targets the logic surface (lib, store,
      // hooks) + reusable UI primitives. Feature/flow components, pages, and framework
      // glue are exercised by Playwright E2E (see e2e/) rather than unit coverage.
      include: ['src/lib/**', 'src/store/**', 'src/hooks/**', 'src/components/ui/**'],
      exclude: [
        'src/test/**',
        'src/lib/auth.ts', // NextAuth v5 config — E2E auth flow
        'src/lib/server-api.ts', // RSC server-only fetchers — E2E/pages
        'src/lib/session.ts', // server session accessor — E2E
        'src/lib/stripe.ts', // Stripe.js browser loader — E2E checkout
        'src/hooks/use-products.ts', // thin react-query data hooks — E2E
        'src/hooks/use-categories.ts',
        'src/hooks/use-reviews.ts',
        'src/hooks/use-search-suggestions.ts',
        'src/hooks/use-cart-mutations.ts', // react-query cart mutations — E2E checkout/cart
      ],
      // Wave 3 exceeded the 70% frontend exit criterion on the logic surface
      // (L93.6 F87.6 B91.5). Floors locked below current to guard regressions.
      thresholds: {
        lines: 88,
        functions: 83,
        branches: 88,
        statements: 88,
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
