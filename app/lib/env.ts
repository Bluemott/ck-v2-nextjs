import { z } from 'zod';

// Environment variable schema for validation
const envSchema = z.object({
  // WordPress Configuration (Lightsail-based)
  NEXT_PUBLIC_WORDPRESS_REST_URL: z.string().url().default('https://api.cowboykimono.com'),
  NEXT_PUBLIC_WORDPRESS_ADMIN_URL: z.string().url().default('https://admin.cowboykimono.com'),
  
  // Application Configuration
  NEXT_PUBLIC_APP_URL: z.string().url().default('https://cowboykimono.com'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://cowboykimono.com'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // AWS Configuration (for Lambda functions only)
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // CloudFront Configuration (for media delivery)
  NEXT_PUBLIC_CLOUDFRONT_URL: z.string().url().optional(),
  CLOUDFRONT_DISTRIBUTION_ID: z.string().optional(),
  
  // Legacy Aurora/S3 Configuration (deprecated - kept for backward compatibility)
  AWS_DATABASE_SETUP_ENDPOINT: z.string().url().optional(),
  AWS_DATA_IMPORT_ENDPOINT: z.string().url().optional(),
  AWS_AURORA_ENDPOINT: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  
  // WordPress URLs (Lightsail-based)
  WORDPRESS_URL: z.string().url().default('https://cowboykimono.com'),
  WORDPRESS_API_URL: z.string().url().default('https://api.cowboykimono.com'),
  
  // Analytics and Monitoring
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  
  // Security
  NEXT_PUBLIC_SITE_VERIFICATION: z.string().optional(),
  
  // API Configuration
  API_RATE_LIMIT: z.string().transform(val => parseInt(val, 10)).default('100'),
  API_TIMEOUT: z.string().transform(val => parseInt(val, 10)).default('10000'),
});

// Parse and validate environment variables
const envParseResult = envSchema.safeParse(process.env);

if (!envParseResult.success) {
  console.error('❌ Invalid environment variables:', envParseResult.error.format());
  throw new Error('Invalid environment variables');
}

export const env = envParseResult.data;

// Development check
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Environment-specific configurations
export const config = {
  // WordPress Configuration (Lightsail-based)
  wordpress: {
    restUrl: env.NEXT_PUBLIC_WORDPRESS_REST_URL,
    adminUrl: env.NEXT_PUBLIC_WORDPRESS_ADMIN_URL,
    siteUrl: env.WORDPRESS_URL,
    apiUrl: env.WORDPRESS_API_URL,
  },
  
  // API Configuration
  api: {
    baseUrl: env.NEXT_PUBLIC_WORDPRESS_REST_URL,
    adminUrl: env.NEXT_PUBLIC_WORDPRESS_ADMIN_URL,
    timeout: env.API_TIMEOUT,
    rateLimit: env.API_RATE_LIMIT,
  },
  
  // Application Configuration
  app: {
    url: env.NEXT_PUBLIC_APP_URL,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    environment: env.NODE_ENV,
    isDevelopment,
    isProduction,
    isTest,
  },
  
  // AWS Configuration (for Lambda functions only)
  aws: {
    region: env.AWS_REGION,
    hasCredentials: !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY),
    // Legacy endpoints (deprecated)
    databaseSetupEndpoint: env.AWS_DATABASE_SETUP_ENDPOINT,
    dataImportEndpoint: env.AWS_DATA_IMPORT_ENDPOINT,
    auroraEndpoint: env.AWS_AURORA_ENDPOINT,
    s3BucketName: env.S3_BUCKET_NAME,
  },
  
  // CloudFront Configuration (for media delivery)
  cloudfront: {
    distributionUrl: env.NEXT_PUBLIC_CLOUDFRONT_URL,
    distributionId: env.CLOUDFRONT_DISTRIBUTION_ID,
    hasCloudFront: !!(env.NEXT_PUBLIC_CLOUDFRONT_URL && env.CLOUDFRONT_DISTRIBUTION_ID),
  },
  
  // Analytics Configuration
  analytics: {
    gaMeasurementId: env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    gtmId: env.NEXT_PUBLIC_GTM_ID,
    hasAnalytics: !!(env.NEXT_PUBLIC_GA_MEASUREMENT_ID || env.NEXT_PUBLIC_GTM_ID),
  },
  
  // Security Configuration
  security: {
    siteVerification: env.NEXT_PUBLIC_SITE_VERIFICATION,
  },
  
  // Architecture Information
  architecture: {
    type: 'lightsail-wordpress',
    description: 'WordPress on Lightsail with Next.js frontend',
    database: 'WordPress MySQL on Lightsail',
    media: 'WordPress media on Lightsail',
    cdn: 'CloudFront for media delivery',
  },
};

// Validation helpers
export function validateEnvironment() {
  const errors: string[] = [];
  
  // Check required production variables
  if (isProduction) {
    if (!env.NEXT_PUBLIC_WORDPRESS_REST_URL) {
      errors.push('NEXT_PUBLIC_WORDPRESS_REST_URL is required in production');
    }
    if (!env.NEXT_PUBLIC_APP_URL) {
      errors.push('NEXT_PUBLIC_APP_URL is required in production');
    }
    if (!env.NEXT_PUBLIC_SITE_URL) {
      errors.push('NEXT_PUBLIC_SITE_URL is required in production');
    }
    if (!env.WORDPRESS_URL) {
      errors.push('WORDPRESS_URL is required in production');
    }
  }
  
  // Check for deprecated Aurora/S3 configuration
  if (env.AWS_AURORA_ENDPOINT || env.S3_BUCKET_NAME) {
    console.warn('⚠️  Deprecated Aurora/S3 configuration detected. WordPress is now hosted on Lightsail.');
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
}

// Export for use in other modules
export default env; 