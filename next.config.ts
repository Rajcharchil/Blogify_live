import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Next.js 16 uses Turbopack by default.
   * Defining a custom `webpack()` forces webpack mode in dev/build.
   */
  webpack: (config) => config,
}

export default nextConfig

