import { z } from 'zod';

// Environment variable schema with comprehensive validation
const envSchema = z.object({
  // Database Configuration - Optional in development
  DB_HOST: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_PORT: z.string()
    .transform((val) => {
      if (!val) return undefined;
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) return undefined;
      return parsed;
    })
    .pipe(z.number().int().positive().max(65535).optional())
    .optional(),

  // AWS Configuration
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),

  // Site Configuration
  NEXT_PUBLIC_SITE_URL: z.string().default('https://cowboykimono.com'),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_VERIFICATION: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),

  // WordPress Configuration - REST API only
  NEXT_PUBLIC_WORDPRESS_ADMIN_URL: z.string().optional(),
  NEXT_PUBLIC_WORDPRESS_REST_URL: z.string().optional(),

  // Feature Flags - REST API is now the default and only option
  NEXT_PUBLIC_USE_REST_API: z.string()
    .transform((val) => {
      if (val === 'true' || val === '1' || val === 'yes') return true;
      if (val === 'false' || val === '0' || val === 'no' || val === '') return false;
      return true; // Default to true for REST API
    })
    .pipe(z.boolean())
    .default('true'),

  // CloudFront Configuration
  NEXT_PUBLIC_CLOUDFRONT_URL: z.string().optional(),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Custom Configuration
  CUSTOM_KEY: z.string().optional(),
});

// Parse and validate environment variables with comprehensive fallbacks
let env: z.infer<typeof envSchema>;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  // Graceful fallback for build time - don't log errors during Amplify build
  const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_VERCEL_URL;
  if (!isBuildTime) {
    console.warn('Environment validation failed, using safe defaults:', error);
  }
  
  // Safe defaults for build and runtime
  env = {
    AWS_REGION: 'us-east-1',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://cowboykimono.com',
    NEXT_PUBLIC_USE_REST_API: true,
    NEXT_PUBLIC_WORDPRESS_REST_URL: process.env.NEXT_PUBLIC_WORDPRESS_REST_URL || 'https://api.cowboykimono.com',
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NEXT_PUBLIC_GOOGLE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_WORDPRESS_ADMIN_URL: process.env.NEXT_PUBLIC_WORDPRESS_ADMIN_URL,
    NEXT_PUBLIC_CLOUDFRONT_URL: process.env.NEXT_PUBLIC_CLOUDFRONT_URL,
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  } as z.infer<typeof envSchema>;
}

// Type export for use throughout the application
export type Env = z.infer<typeof envSchema>;

// Export validated environment
export { env };

// Helper function to get environment variables with validation
export function getEnvVar(key: keyof Env): string {
  const value = env[key];
  if (typeof value === 'string' && value.length === 0) {
    throw new Error(`Environment variable ${key} is empty`);
  }
  return value as string;
}

// Helper function to check if we're in development
export const isDevelopment = env.NODE_ENV === 'development';

// Helper function to check if we're in production
export const isProduction = env.NODE_ENV === 'production';

// Helper function to check if REST API is enabled (always true now)
export const isRestAPIEnabled = true; 