// API Route Type Definitions
// This file contains comprehensive type definitions for all API routes

import { z } from 'zod';

// Health Check Response Types
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    wordpress: boolean;
    cache: boolean;
    monitoring: boolean;
    ssl: boolean;
    performance: boolean;
  };
  metrics: {
    responseTime: number;
    cacheStats: CacheHealthStats | null;
    wordpressStatus: WordPressHealthStatus | null;
  };
  issues: string[];
}

export interface CacheHealthStats {
  status: 'healthy' | 'degraded' | 'unhealthy';
  hitRate: number;
  missRate: number;
  evictionRate: number;
  memoryUsage: number;
  entryCount: number;
  maxEntries: number;
  issues: string[];
}

export interface WordPressHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  postsAvailable: number;
  apiUrl: string;
  lastCheck: string;
}

// WordPress REST API Response Types
export interface WPRestAPIResponse<T> {
  data: T;
  headers: Headers;
  status: number;
  statusText: string;
}

export interface WPRestPaginationMeta {
  totalPosts: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface WPRestPostsResponse {
  posts: unknown[]; // Using unknown[] for now to avoid circular dependency
  pagination: WPRestPaginationMeta;
}

// Webhook Validation and Response Types
export interface WordPressWebhookPayload {
  post_id: number;
  post_title: string;
  post_name: string;
  post_status: 'publish' | 'draft' | 'private' | 'trash';
  post_type: string;
  old_slug?: string;
  new_slug?: string;
  timestamp?: string;
  user_id?: number;
  user_login?: string;
  user_email?: string;
}

export interface WebhookValidationError {
  field: string;
  message: string;
  code: string;
  received?: unknown;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  data?: {
    post_id: number;
    post_title: string;
    post_name: string;
    post_status: string;
    post_type: string;
    slug_changed: boolean;
    timestamp: string;
  };
  errors?: WebhookValidationError[];
}

// API Error Response Types
export interface APIErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?: unknown;
  meta: {
    timestamp: string;
    endpoint: string;
    method: string;
    requestId: string;
    responseTime: number;
    version: string;
  };
}

export interface APISuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    endpoint: string;
    method: string;
    requestId: string;
    responseTime: number;
    version: string;
  };
}

// Rate Limiting Types
export interface RateLimitInfo {
  maxRequests: number;
  windowMs: number;
  currentRequests: number;
  resetTime: number;
  retryAfter: number;
}

// Monitoring Types
export interface MonitoringMetric {
  namespace: string;
  metricName: string;
  value: number;
  unit: 'Count' | 'Seconds' | 'Percent' | 'Bytes' | 'Count/Second';
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export interface MonitoringLog {
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

// Validation Schemas
export const healthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string(),
  version: z.string(),
  environment: z.string(),
  checks: z.object({
    wordpress: z.boolean(),
    cache: z.boolean(),
    monitoring: z.boolean(),
    ssl: z.boolean(),
    performance: z.boolean(),
  }),
  metrics: z.object({
    responseTime: z.number(),
    cacheStats: z.object({
      status: z.enum(['healthy', 'degraded', 'unhealthy']),
      hitRate: z.number(),
      missRate: z.number(),
      evictionRate: z.number(),
      memoryUsage: z.number(),
      entryCount: z.number(),
      maxEntries: z.number(),
      issues: z.array(z.string()),
    }).nullable(),
    wordpressStatus: z.object({
      status: z.enum(['healthy', 'degraded', 'unhealthy']),
      responseTime: z.number(),
      postsAvailable: z.number(),
      apiUrl: z.string(),
      lastCheck: z.string(),
    }).nullable(),
  }),
  issues: z.array(z.string()),
});

export const webhookPayloadSchema = z.object({
  post_id: z.number().int().nonnegative(), // Allow 0 for test webhooks
  post_title: z.string().min(1),
  post_name: z.string().min(1),
  post_status: z.enum(['publish', 'draft', 'private', 'trash']),
  post_type: z.string().min(1),
  old_slug: z.string().nullable().optional(),
  new_slug: z.string().nullable().optional(),
  timestamp: z.string().nullable().optional(),
  user_id: z.number().int().positive().optional(),
  user_login: z.string().optional(),
  user_email: z.string().email().optional(),
});

// WordPress REST API schemas (re-exported from wordpress.ts)
export { wpRestPostSchema, wpRestCategorySchema, wpRestTagSchema } from './wordpress';

// Type guards (re-exported from wordpress.ts)
export { isWPRestPost, isWPRestCategory, isWPRestTag } from './wordpress';

// AWS type guards (re-exported from aws.ts)
export { isAWSError, isAWSResponseMetadata } from './aws';

// Type guards
export function isHealthCheckResponse(obj: unknown): obj is HealthCheckResponse {
  try {
    healthCheckResponseSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}

export function isWebhookPayload(obj: unknown): obj is WordPressWebhookPayload {
  try {
    webhookPayloadSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}

// Utility types for API handlers
export type APIHandlerParams = {
  request: Request;
  query: Record<string, unknown>;
  body?: unknown;
  responseBuilder: {
    success: <T>(_data: T, _statusCode?: number, _cacheControl?: string) => Response;
    error: (_error: string, _statusCode?: number, _details?: unknown) => Response;
    validationError: (_errors: z.ZodError) => Response;
    methodNotAllowed: () => Response;
    notFound: (_resource?: string) => Response;
    rateLimitExceeded: () => Response;
    getRequestId: () => string;
  };
};

export type APIHandlerFunction = (_params: APIHandlerParams) => Promise<Response>; 