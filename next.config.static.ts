import type { NextConfig } from "next";

// Alternative static export configuration for Amplify
// Use this if the standalone build is causing issues
const nextConfig: NextConfig = {
  // Static export configuration
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  
  images: {
    unoptimized: true, // Required for static export
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
