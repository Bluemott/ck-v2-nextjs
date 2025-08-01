import { z } from 'zod';

// GraphQL Query Validation Schema
export const graphqlQuerySchema = z.object({
  query: z.string().min(1, 'GraphQL query is required'),
  variables: z.record(z.any()).optional(),
  operationName: z.string().optional(),
});

export type GraphQLQuery = z.infer<typeof graphqlQuerySchema>;

// Media Upload Validation Schema
export const mediaUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
  title: z.string().optional(),
  altText: z.string().optional(),
  caption: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
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
  'video/x-msvideo'
] as const;

export const fileTypeSchema = z.enum(allowedFileTypes);

// File Size Validation (10MB max)
export const maxFileSize = 10 * 1024 * 1024; // 10MB
export const fileSizeSchema = z.number().max(maxFileSize, `File size must be less than ${maxFileSize / (1024 * 1024)}MB`);

// Blog Post Validation Schema - Enhanced for AWS/WordPress compatibility
export const blogPostSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  title: z.string().min(1, 'Title is required'),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  // Flexible date parsing - accepts various formats
  date: z.string().transform((val) => {
    // Try to parse the date and return ISO string
    if (!val) return undefined;
    try {
      const date = new Date(val);
      return date.toISOString();
    } catch {
      return val; // Return as-is if parsing fails
    }
  }).optional(),
  modified: z.string().transform((val) => {
    // Try to parse the date and return ISO string
    if (!val) return undefined;
    try {
      const date = new Date(val);
      return date.toISOString();
    } catch {
      return val; // Return as-is if parsing fails
    }
  }).optional(),
  status: z.enum(['publish', 'draft', 'private']).optional(),
  // Flexible featured image schema - handles both null and different structures
  featuredImage: z.union([
    z.null(),
    z.object({
      sourceUrl: z.string().url().optional(),
      altText: z.string().optional(),
    }),
    z.object({
      node: z.object({
        sourceUrl: z.string().url().optional(),
        altText: z.string().optional(),
        id: z.string().optional(),
        mediaDetails: z.object({
          width: z.number().optional(),
          height: z.number().optional(),
          sizes: z.array(z.object({
            name: z.string().optional(),
            sourceUrl: z.string().url().optional(),
            width: z.number().optional(),
            height: z.number().optional(),
          })).optional(),
        }).optional(),
      }).optional(),
    }),
  ]).optional(),
  // Flexible categories schema
  categories: z.union([
    z.object({
      nodes: z.array(z.object({
        id: z.string().optional(),
        slug: z.string(),
        name: z.string(),
        count: z.number().optional(),
      })),
    }),
    z.array(z.object({
      id: z.string().optional(),
      slug: z.string(),
      name: z.string(),
      count: z.number().optional(),
    })),
  ]).optional(),
  // Flexible tags schema
  tags: z.union([
    z.object({
      nodes: z.array(z.object({
        id: z.string().optional(),
        slug: z.string(),
        name: z.string(),
        count: z.number().optional(),
      })),
    }),
    z.array(z.object({
      id: z.string().optional(),
      slug: z.string(),
      name: z.string(),
      count: z.number().optional(),
    })),
  ]).optional(),
  // Author schema - flexible for different structures
  author: z.union([
    z.object({
      node: z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        avatar: z.object({
          url: z.string().optional(),
        }).optional(),
      }),
    }),
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      avatar: z.object({
        url: z.string().optional(),
      }).optional(),
    }),
  ]).optional(),
  // SEO data - optional for AWS compatibility, handles null values
  seo: z.union([
    z.null(),
    z.object({
      title: z.string().optional(),
      metaDesc: z.string().optional(),
      canonical: z.string().optional(),
      opengraphTitle: z.string().optional(),
      opengraphDescription: z.string().optional(),
      opengraphImage: z.union([
        z.null(),
        z.object({
          sourceUrl: z.string().optional(),
        }),
      ]).optional(),
      twitterTitle: z.string().optional(),
      twitterDescription: z.string().optional(),
      twitterImage: z.union([
        z.null(),
        z.object({
          sourceUrl: z.string().optional(),
        }),
      ]).optional(),
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
      schema: z.object({
        raw: z.string().optional(),
      }).optional(),
    }),
  ]).optional(),
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

// Search Parameters Validation Schema
export const searchParamsSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  page: z.string().transform((val) => {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 1 : Math.max(1, parsed);
  }).pipe(z.number().int().positive()).optional(),
  perPage: z.string().transform((val) => {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 12 : Math.max(1, Math.min(100, parsed));
  }).pipe(z.number().int().positive().max(100)).optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

// WordPress Webhook Validation Schema
export const wordpressWebhookSchema = z.object({
  post_id: z.number().int().positive(),
  post_title: z.string().min(1),
  post_name: z.string().min(1),
  post_status: z.enum(['publish', 'draft', 'private', 'trash']),
  post_type: z.string().min(1),
  old_slug: z.string().optional(),
  new_slug: z.string().optional(),
});

export type WordPressWebhook = z.infer<typeof wordpressWebhookSchema>;

// IndexNow Submission Validation Schema
export const indexNowSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  key: z.string().min(1, 'Key is required'),
  keyLocation: z.string().url('Key location must be a valid URL'),
  urlList: z.array(z.string().url('URL must be valid')).min(1, 'At least one URL is required').max(10000, 'Maximum 10,000 URLs allowed'),
});

export type IndexNowSubmission = z.infer<typeof indexNowSchema>;

// SEO Metadata Validation Schema
export const seoMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().max(160, 'Description must be 160 characters or less'),
  keywords: z.array(z.string()).optional(),
  canonical: z.string().url().optional(),
  ogImage: z.string().url().optional(),
  ogType: z.enum(['website', 'article', 'product']).optional(),
  publishedTime: z.string().datetime().optional(),
  modifiedTime: z.string().datetime().optional(),
  author: z.string().optional(),
  yoastSEO: z.record(z.any()).optional(),
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
  metadata: z.record(z.string()).optional(),
});

export type S3Upload = z.infer<typeof s3UploadSchema>;

// Validation helper functions
export function validateGraphQLQuery(query: unknown): GraphQLQuery {
  return graphqlQuerySchema.parse(query);
}

export function validateMediaUpload(data: unknown): MediaUpload {
  return mediaUploadSchema.parse(data);
}

export function validateBlogPost(post: unknown): BlogPost {
  return blogPostSchema.parse(post);
}

export function validateSearchParams(params: unknown): SearchParams {
  return searchParamsSchema.parse(params);
}

export function validateWordPressWebhook(webhook: unknown): WordPressWebhook {
  return wordpressWebhookSchema.parse(webhook);
}

export function validateIndexNowSubmission(submission: unknown): IndexNowSubmission {
  return indexNowSchema.parse(submission);
}

export function validateSEOMetadata(metadata: unknown): SEOMetadata {
  return seoMetadataSchema.parse(metadata);
}

export function validateDatabaseConfig(config: unknown): DatabaseConfig {
  return databaseConfigSchema.parse(config);
}

export function validateS3Upload(upload: unknown): S3Upload {
  return s3UploadSchema.parse(upload);
}

// Error handling helper
export function createValidationError(message: string, field?: string): Error {
  return new Error(field ? `${field}: ${message}` : message);
} 