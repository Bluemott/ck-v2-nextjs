import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output configuration for Amplify
  output: 'standalone',
  
  images: {
    // Disable optimization for better Amplify compatibility
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      'cowboykimono.com',
      'api.cowboykimono.com',
      'admin.cowboykimono.com',
      'i.etsystatic.com',
      'img.etsystatic.com',
      'v5.airtableusercontent.com',
      'images.unsplash.com' // Add more domains as needed
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cowboykimono.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.etsystatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.etsystatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'v5.airtableusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Add loader configuration for better performance
    loader: 'default',
    // Increase timeout for slow loading images
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Optimize for production
  poweredByHeader: false,
  reactStrictMode: true,
  
  // ESLint configuration for build
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // TypeScript configuration for build
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
