import type { NextConfig } from "next";
import { createRedirectsConfig } from "./app/lib/redirect-manager";

const nextConfig: NextConfig = {
  // Remove output: 'standalone' for Amplify hosting to enable dynamic routes
  // output: 'standalone', // Commented out for Amplify compatibility
  
  images: {
    // Enable optimization for better performance
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Optimize for performance
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cowboykimono.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.cowboykimono.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'admin.cowboykimono.com',
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
  },
  
  // Optimize for production
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@next/font'],
  },
  
  // Server external packages moved to correct location
  serverExternalPackages: ['pg'],
  
  // Compression
  compress: true,
  
  // ESLint configuration for build - make it more lenient for Amplify
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration for build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // AWS-specific optimizations
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Cache static assets for better performance
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      // Optimize for CloudFront
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Redirects for SEO and user experience
  async redirects() {
    return createRedirectsConfig();
  },
  
  // Webpack optimizations for AWS
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size for production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          aws: {
            test: /[\\/]node_modules[\\/]@aws-sdk[\\/]/,
            name: 'aws-sdk',
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }
    
    // Tree shaking for AWS SDK
    if (!dev) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@aws-sdk/client-s3': '@aws-sdk/client-s3/dist/index.js',
        '@aws-sdk/client-lambda': '@aws-sdk/client-lambda/dist/index.js',
        '@aws-sdk/client-cloudfront': '@aws-sdk/client-cloudfront/dist/index.js',
        '@aws-sdk/client-secrets-manager': '@aws-sdk/client-secrets-manager/dist/index.js',
      };
    }
    
    return config;
  },
  
  // Add build-time environment variable handling
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Ensure proper handling of environment variables
  publicRuntimeConfig: {
    // Add any public runtime config here
  },
  
  serverRuntimeConfig: {
    // Add any server runtime config here
  },
};

export default nextConfig;
