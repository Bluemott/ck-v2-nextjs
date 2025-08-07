import { z } from 'zod';
import {
  sanitizeBlogPostContent,
  sanitizeEmail,
  sanitizeExcerpt,
  sanitizeSearchQuery,
  sanitizeText,
  sanitizeTitle,
} from './sanitization';
import type { WordPressWebhookPayload } from './types/api';

// Media Upload Validation Schema with sanitization
export const mediaUploadSchema = z.object({
  file: z.unknown().refine(
    (val) => {
      // Check if we're in a browser environment where File is available
      if (
        typeof window !== 'undefined' &&
        typeof (globalThis as Record<string, unknown>).File !== 'undefined'
      ) {
        return val instanceof File;
      }
      // In server environment, accept any object with required properties
      return (
        val &&
        typeof val === 'object' &&
        'name' in val &&
        'size' in val &&
        'type' in val
      );
    },
    { message: 'File is required' }
  ),
  title: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeTitle(val) : val)),
  altText: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
  caption: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
  description: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
  category: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
});

export type MediaUpload = z.infer<typeof mediaUploadSchema>;

// File Type Validation
export const allowedFileTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
] as const;

export const fileTypeSchema = z.enum(allowedFileTypes);

// File Size Validation (10MB max)
export const maxFileSize = 10 * 1024 * 1024; // 10MB
export const fileSizeSchema = z
  .number()
  .max(
    maxFileSize,
    `File size must be less than ${maxFileSize / (1024 * 1024)}MB`
  );

// Blog Post Validation Schema - Enhanced for AWS/WordPress compatibility with sanitization
export const blogPostSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .transform((val) => sanitizeText(val)),
  title: z
    .string()
    .min(1, 'Title is required')
    .transform((val) => sanitizeTitle(val)),
  excerpt: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeExcerpt(val) : val)),
  content: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeBlogPostContent(val) : val)),
  // Flexible date parsing - accepts various formats
  date: z
    .string()
    .transform((val) => {
      // Try to parse the date and return ISO string
      if (!val) return undefined;
      try {
        const date = new Date(val);
        return date.toISOString();
      } catch {
        return val; // Return as-is if parsing fails
      }
    })
    .optional(),
  modified: z
    .string()
    .transform((val) => {
      // Try to parse the date and return ISO string
      if (!val) return undefined;
      try {
        const date = new Date(val);
        return date.toISOString();
      } catch {
        return val; // Return as-is if parsing fails
      }
    })
    .optional(),
  status: z.enum(['publish', 'draft', 'private']).optional(),
  // Flexible featured image schema - handles both null and different structures
  featuredImage: z
    .union([
      z.null(),
      z.object({
        sourceUrl: z.string().url().optional(),
        altText: z.string().optional(),
      }),
      z.object({
        node: z
          .object({
            sourceUrl: z.string().url().optional(),
            altText: z.string().optional(),
            id: z.string().optional(),
            mediaDetails: z
              .object({
                width: z.number().optional(),
                height: z.number().optional(),
                sizes: z
                  .array(
                    z.object({
                      name: z.string().optional(),
                      sourceUrl: z.string().url().optional(),
                      width: z.number().optional(),
                      height: z.number().optional(),
                    })
                  )
                  .optional(),
              })
              .optional(),
          })
          .optional(),
      }),
    ])
    .optional(),
  // Flexible categories schema
  categories: z
    .union([
      z.object({
        nodes: z.array(
          z.object({
            id: z.string().optional(),
            slug: z.string(),
            name: z.string(),
            count: z.number().optional(),
          })
        ),
      }),
      z.array(
        z.object({
          id: z.string().optional(),
          slug: z.string(),
          name: z.string(),
          count: z.number().optional(),
        })
      ),
    ])
    .optional(),
  // Flexible tags schema
  tags: z
    .union([
      z.object({
        nodes: z.array(
          z.object({
            id: z.string().optional(),
            slug: z.string(),
            name: z.string(),
            count: z.number().optional(),
          })
        ),
      }),
      z.array(
        z.object({
          id: z.string().optional(),
          slug: z.string(),
          name: z.string(),
          count: z.number().optional(),
        })
      ),
    ])
    .optional(),
  // Author schema - flexible for different structures
  author: z
    .union([
      z.object({
        node: z.object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
          avatar: z
            .object({
              url: z.string().optional(),
            })
            .optional(),
        }),
      }),
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        avatar: z
          .object({
            url: z.string().optional(),
          })
          .optional(),
      }),
    ])
    .optional(),
  // SEO data - optional for AWS compatibility, handles null values
  seo: z
    .union([
      z.null(),
      z.object({
        title: z.string().optional(),
        metaDesc: z.string().optional(),
        canonical: z.string().optional(),
        opengraphTitle: z.string().optional(),
        opengraphDescription: z.string().optional(),
        opengraphImage: z
          .union([
            z.null(),
            z.object({
              sourceUrl: z.string().optional(),
            }),
          ])
          .optional(),
        twitterTitle: z.string().optional(),
        twitterDescription: z.string().optional(),
        twitterImage: z
          .union([
            z.null(),
            z.object({
              sourceUrl: z.string().optional(),
            }),
          ])
          .optional(),
        focuskw: z.string().optional(),
        metaKeywords: z.string().optional(),
        metaRobotsNoindex: z.string().optional(),
        metaRobotsNofollow: z.string().optional(),
        opengraphType: z.string().optional(),
        opengraphUrl: z.string().optional(),
        opengraphSiteName: z.string().optional(),
        opengraphAuthor: z.string().optional(),
        opengraphPublishedTime: z.string().optional(),
        opengraphModifiedTime: z.string().optional(),
        schema: z
          .object({
            raw: z.string().optional(),
          })
          .optional(),
      }),
    ])
    .optional(),
});

export type BlogPost = z.infer<typeof blogPostSchema>;

// Category Validation Schema
export const categorySchema = z.object({
  slug: z.string().min(1, 'Category slug is required'),
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  count: z.number().int().nonnegative().optional(),
});

export type Category = z.infer<typeof categorySchema>;

// Tag Validation Schema
export const tagSchema = z.object({
  slug: z.string().min(1, 'Tag slug is required'),
  name: z.string().min(1, 'Tag name is required'),
  description: z.string().optional(),
  count: z.number().int().nonnegative().optional(),
});

export type Tag = z.infer<typeof tagSchema>;

// Search Parameters Validation Schema with sanitization
export const searchParamsSchema = z.object({
  search: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeSearchQuery(val) : val)),
  category: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
  tag: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
  page: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 1 : Math.max(1, parsed);
    })
    .pipe(z.number().int().positive())
    .optional(),
  perPage: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 12 : Math.max(1, Math.min(100, parsed));
    })
    .pipe(z.number().int().positive().max(100))
    .optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

// WordPress Webhook Validation Schema - Enhanced with proper typing and sanitization
export const wordpressWebhookSchema = z.object({
  post_id: z.number().int().positive(),
  post_title: z
    .string()
    .min(1)
    .transform((val) => sanitizeTitle(val)),
  post_name: z
    .string()
    .min(1)
    .transform((val) => sanitizeText(val)),
  post_status: z.enum(['publish', 'draft', 'private', 'trash']),
  post_type: z
    .string()
    .min(1)
    .transform((val) => sanitizeText(val)),
  old_slug: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
  new_slug: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
  timestamp: z.string().datetime().optional(),
  user_id: z.number().int().positive().optional(),
  user_login: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeText(val) : val)),
  user_email: z
    .string()
    .email()
    .optional()
    .transform((val) => (val ? sanitizeEmail(val) : val)),
});

export type WordPressWebhook = z.infer<typeof wordpressWebhookSchema>;

// IndexNow Submission Validation Schema
export const indexNowSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  key: z.string().min(1, 'Key is required'),
  keyLocation: z.string().url('Key location must be a valid URL'),
  urlList: z
    .array(z.string().url('URL must be valid'))
    .min(1, 'At least one URL is required')
    .max(10000, 'Maximum 10,000 URLs allowed'),
});

export type IndexNowSubmission = z.infer<typeof indexNowSchema>;

// SEO Metadata Validation Schema
export const seoMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z
    .string()
    .max(160, 'Description must be 160 characters or less'),
  keywords: z.array(z.string()).optional(),
  canonical: z.string().url().optional(),
  ogImage: z.string().url().optional(),
  ogType: z.enum(['website', 'article', 'product']).optional(),
  publishedTime: z.string().datetime().optional(),
  modifiedTime: z.string().datetime().optional(),
  author: z.string().optional(),
  yoastSEO: z.record(z.string(), z.unknown()).optional(),
});

export type SEOMetadata = z.infer<typeof seoMetadataSchema>;

// Database Connection Validation Schema
export const databaseConfigSchema = z.object({
  host: z.string().min(1, 'Database host is required'),
  port: z.number().int().positive().max(65535),
  database: z.string().min(1, 'Database name is required'),
  user: z.string().min(1, 'Database user is required'),
  password: z.string().min(1, 'Database password is required'),
  ssl: z.boolean().optional(),
  connectionTimeoutMillis: z.number().int().positive().optional(),
  idleTimeoutMillis: z.number().int().positive().optional(),
});

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;

// AWS S3 Upload Validation Schema
export const s3UploadSchema = z.object({
  bucket: z.string().min(1, 'S3 bucket is required'),
  key: z.string().min(1, 'S3 key is required'),
  body: z.instanceof(Buffer),
  contentType: z.string().min(1, 'Content type is required'),
  metadata: z.record(z.string(), z.string()).optional(),
});

export type S3Upload = z.infer<typeof s3UploadSchema>;

// Validation helper functions with proper error handling
// Helper function to format ZodError messages
function formatZodError(error: z.ZodError): string {
  return (error as any).errors
    .map((e: any) => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
}

export function validateMediaUpload(data: unknown): MediaUpload {
  try {
    return mediaUploadSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Media upload validation failed: ${formatZodError(error)}`
      );
    }
    throw error;
  }
}

export function validateBlogPost(post: unknown): BlogPost {
  try {
    return blogPostSchema.parse(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Blog post validation failed: ${formatZodError(error)}`);
    }
    throw error;
  }
}

export function validateSearchParams(params: unknown): SearchParams {
  try {
    return searchParamsSchema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Search params validation failed: ${formatZodError(error)}`
      );
    }
    throw error;
  }
}

export function validateWordPressWebhook(
  webhook: unknown
): WordPressWebhookPayload {
  try {
    return wordpressWebhookSchema.parse(webhook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `WordPress webhook validation failed: ${formatZodError(error)}`
      );
    }
    throw error;
  }
}

export function validateIndexNowSubmission(
  submission: unknown
): IndexNowSubmission {
  try {
    return indexNowSchema.parse(submission);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `IndexNow submission validation failed: ${formatZodError(error)}`
      );
    }
    throw error;
  }
}

export function validateSEOMetadata(metadata: unknown): SEOMetadata {
  try {
    return seoMetadataSchema.parse(metadata);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `SEO metadata validation failed: ${formatZodError(error)}`
      );
    }
    throw error;
  }
}

export function validateDatabaseConfig(config: unknown): DatabaseConfig {
  try {
    return databaseConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Database config validation failed: ${formatZodError(error)}`
      );
    }
    throw error;
  }
}

export function validateS3Upload(upload: unknown): S3Upload {
  try {
    return s3UploadSchema.parse(upload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`S3 upload validation failed: ${formatZodError(error)}`);
    }
    throw error;
  }
}

// Error handling helper with proper typing
export function createValidationError(message: string, field?: string): Error {
  return new Error(field ? `${field}: ${message}` : message);
}

// Type guards for validation
export function isValidMediaUpload(data: unknown): data is MediaUpload {
  try {
    mediaUploadSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidBlogPost(data: unknown): data is BlogPost {
  try {
    blogPostSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidWordPressWebhook(
  data: unknown
): data is WordPressWebhookPayload {
  try {
    wordpressWebhookSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function isValidSEOMetadata(data: unknown): data is SEOMetadata {
  try {
    seoMetadataSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}
