import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@repo/ui', '@repo/utils', '@repo/validation'],
}

export default nextConfig
