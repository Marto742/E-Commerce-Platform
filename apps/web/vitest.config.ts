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
      reporter: ['text', 'lcov'],
      include: ['src/components/**', 'src/hooks/**', 'src/lib/**', 'src/store/**'],
      exclude: ['src/test/**'],
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
