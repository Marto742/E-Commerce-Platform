import path from 'path'
import type { NextConfig } from 'next'

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
    ],
  },
  // Transpile shared workspace packages
  transpilePackages: ['@repo/ui', '@repo/utils', '@repo/validation'],
}

export default nextConfig
