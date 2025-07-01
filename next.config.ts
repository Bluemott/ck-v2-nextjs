import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      'cowboykimono.com',
      'i.etsystatic.com',
      'img.etsystatic.com',
      'v5.airtableusercontent.com'
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
    ],
  },
  
  // Environment variables for build
  env: {
    CUSTOM_KEY: 'my-value',
  },
  
  // Optimize for production
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
