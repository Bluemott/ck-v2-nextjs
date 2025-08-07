import type { NextConfig } from "next";
import { createRedirectsConfig } from "./app/lib/redirect-manager";

const nextConfig: NextConfig = {
  // Amplify SSR configuration - no output setting needed
  // output: 'export', // Use only for static export
  // output: 'standalone', // Use only for containerized deployment
  
  // Performance optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  
  // Advanced image optimization
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
    // Enhanced image optimization settings
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
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
  
  // Bundle optimization
  experimental: {
    optimizePackageImports: ['@next/font'],
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            aws: {
              test: /[\\/]node_modules[\\/]@aws-sdk[\\/]/,
              name: 'aws-sdk',
              chunks: 'all',
              priority: 20,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
            },
          },
        },
        // Add tree shaking optimization
        usedExports: true,
        sideEffects: false,
      };
    }
    
    // Add compression
    if (!dev) {
      config.optimization.minimize = true;
      // Note: Next.js handles minification automatically in production
      // TerserPlugin is not needed as Next.js uses its own minification
    }
    
    return config;
  },
  
  // Server external packages for AWS SDK
  serverExternalPackages: [
    '@aws-sdk/client-cloudwatch',
    '@aws-sdk/client-cloudwatch-logs',
    '@aws-sdk/client-xray',
    '@aws-sdk/client-s3',
    '@aws-sdk/client-rds-data',
  ],
  
  // Headers for performance and security
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
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/downloads/(.*)',
        headers: [
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
            value: 'public, max-age=300, s-maxage=600',
          },
        ],
      },
    ];
  },
  
  // Redirects for SEO and performance
  async redirects() {
    return createRedirectsConfig();
  },
};

export default nextConfig;
