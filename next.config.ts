import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'googleusercontent.com',
      'github.com',
    ],
  },
  webpack: (config: any) => config,
};

export default nextConfig;
