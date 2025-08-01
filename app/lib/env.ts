import { z } from 'zod';

// Environment variable schema with comprehensive validation
const envSchema = z.object({
  // Database Configuration - Optional in development
  DB_HOST: z.string().min(1, 'Database host is required').optional(),
  DB_USER: z.string().min(1, 'Database user is required').optional(),
  DB_PASSWORD: z.string().min(1, 'Database password is required').optional(),
  DB_NAME: z.string().min(1, 'Database name is required').optional(),
  DB_PORT: z.string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) throw new Error('DB_PORT must be a valid number');
      return parsed;
    })
    .pipe(z.number().int().positive().max(65535))
    .optional(),

  // AWS Configuration
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().min(1, 'S3 bucket name is required').optional(),
  NEXT_PUBLIC_AWS_GRAPHQL_URL: z.string().url('AWS GraphQL URL must be a valid URL').optional(),

  // Site Configuration
  NEXT_PUBLIC_SITE_URL: z.string().url('Site URL must be a valid URL').default('https://cowboykimono.com'),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_VERIFICATION: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),

  // WordPress Configuration
  NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL: z.string().url('WordPress GraphQL URL must be a valid URL').optional(),
  NEXT_PUBLIC_WORDPRESS_ADMIN_URL: z.string().url('WordPress admin URL must be a valid URL').optional(),
  NEXT_PUBLIC_WPGRAPHQL_URL: z.string().url('WP GraphQL URL must be a valid URL').optional(),

  // Feature Flags - Fixed to properly handle boolean values
  NEXT_PUBLIC_USE_AWS_GRAPHQL: z.string()
    .transform((val) => {
      if (val === 'true' || val === '1' || val === 'yes') return true;
      if (val === 'false' || val === '0' || val === 'no' || val === '') return false;
      return val === 'true'; // Default to false for any other value
    })
    .pipe(z.boolean())
    .default('false'),

  // CloudFront Configuration
  NEXT_PUBLIC_CLOUDFRONT_URL: z.string().url('CloudFront URL must be a valid URL').optional(),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Custom Configuration
  CUSTOM_KEY: z.string().optional(),
});

// Parse and validate environment variables with fallbacks
let env: z.infer<typeof envSchema>;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.warn('Environment validation failed, using defaults:', error);
  // Use defaults for development
  env = {
    AWS_REGION: 'us-east-1',
    NEXT_PUBLIC_SITE_URL: 'https://cowboykimono.com',
    NEXT_PUBLIC_USE_AWS_GRAPHQL: false,
    NODE_ENV: 'development',
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

// Helper function to check if AWS GraphQL is enabled - Fixed to work during build time
export const isAWSGraphQLEnabled = env.NEXT_PUBLIC_USE_AWS_GRAPHQL; 