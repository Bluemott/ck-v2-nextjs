import { NextResponse } from 'next/server';
import { z } from 'zod';
import type {
  APIErrorResponse,
  APISuccessResponse,
  RateLimitInfo,
} from './types/api';

// Conditional monitoring import to avoid client-side bundling issues
let monitoring: unknown = null;

// Only import monitoring on the server side
if (typeof window === 'undefined') {
  try {
    // Dynamic import to avoid bundling issues
    import('./monitoring')
      .then((module) => {
        monitoring = module.monitoring;
      })
      .catch(() => {
        // Silently fail if monitoring is not available
        console.warn('Monitoring not available in current environment');
      });
  } catch {
    // Silently fail if monitoring is not available
  }
}

// Request ID generator
export function generateRequestId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Standard API Response Builder with proper typing
export class APIResponseBuilder {
  private requestId: string;
  private startTime: number;
  private endpoint: string;
  private method: string;

  constructor(endpoint: string, method: string) {
    this.requestId = generateRequestId();
    this.startTime = Date.now();
    this.endpoint = endpoint;
    this.method = method;
  }

  private getResponseTime(): number {
    return Date.now() - this.startTime;
  }

  private getMeta(): APISuccessResponse<unknown>['meta'] {
    return {
      timestamp: new Date().toISOString(),
      endpoint: this.endpoint,
      method: this.method,
      requestId: this.requestId,
      responseTime: this.getResponseTime(),
      version: '2.3.0',
    };
  }

  // Success response with proper typing
  success<T>(
    data: T,
    statusCode: number = 200,
    cacheControl?: string
  ): NextResponse {
    const response: APISuccessResponse<T> = {
      success: true,
      data,
      meta: this.getMeta(),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': this.requestId,
      'X-Response-Time': this.getResponseTime().toString(),
    };

    if (cacheControl) {
      headers['Cache-Control'] = cacheControl;
    }

    // Log successful response (if monitoring is available)
    if (
      monitoring &&
      typeof monitoring === 'object' &&
      monitoring !== null &&
      'info' in monitoring
    ) {
      (
        monitoring as {
          info: (
            _message: string,
            _metadata: Record<string, unknown>
          ) => Promise<void>;
        }
      ).info('API response successful', {
        requestId: this.requestId,
        endpoint: this.endpoint,
        method: this.method,
        responseTime: this.getResponseTime(),
        statusCode,
      });
    }

    return NextResponse.json(response, { status: statusCode, headers });
  }

  // Error response with proper typing
  error(
    error: string,
    statusCode: number = 500,
    details?: unknown
  ): NextResponse {
    const response: APIErrorResponse = {
      success: false,
      error,
      message: error,
      meta: this.getMeta(),
    };

    if (details) {
      response.details = details;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': this.requestId,
      'X-Response-Time': this.getResponseTime().toString(),
    };

    // Log error response (if monitoring is available)
    if (
      monitoring &&
      typeof monitoring === 'object' &&
      monitoring !== null &&
      'error' in monitoring
    ) {
      (
        monitoring as {
          error: (
            _message: string,
            _metadata: Record<string, unknown>
          ) => Promise<void>;
        }
      ).error('API response error', {
        requestId: this.requestId,
        endpoint: this.endpoint,
        method: this.method,
        responseTime: this.getResponseTime(),
        statusCode,
        error,
        details,
      });
    }

    return NextResponse.json(response, { status: statusCode, headers });
  }

  // Validation error response with proper typing
  validationError(validationErrors: z.ZodError): NextResponse {
    const errors = validationErrors.issues.map((err: z.ZodIssue) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return this.error('Validation failed', 400, { errors });
  }

  // Method not allowed response with proper typing
  methodNotAllowed(): NextResponse {
    return this.error('Method not allowed', 405, {
      allowedMethods: ['GET'],
      message: 'This endpoint only supports GET requests',
    });
  }

  // Not found response with proper typing
  notFound(resource: string = 'Resource'): NextResponse {
    return this.error(`${resource} not found`, 404);
  }

  // Rate limit exceeded response with proper typing
  rateLimitExceeded(): NextResponse {
    const rateLimitInfo: RateLimitInfo = {
      maxRequests: 60,
      windowMs: 60000,
      currentRequests: 60,
      resetTime: Date.now() + 60000,
      retryAfter: 60,
    };

    return this.error('Rate limit exceeded', 429, {
      retryAfter: rateLimitInfo.retryAfter,
      message: 'Too many requests. Please try again later.',
      rateLimit: rateLimitInfo,
    });
  }

  // Get request ID for logging
  getRequestId(): string {
    return this.requestId;
  }
}

// Standard query parameter validation with proper typing
export const commonQuerySchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .optional(),
  per_page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100))
    .optional(),
  orderby: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  categories: z
    .string()
    .transform((val) =>
      val
        .split(',')
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id))
    )
    .optional(),
  tags: z
    .string()
    .transform((val) =>
      val
        .split(',')
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id))
    )
    .optional(),
});

export type CommonQueryParams = z.infer<typeof commonQuerySchema>;

// Standard pagination helper with proper typing
export function createPaginationMeta(
  currentPage: number,
  perPage: number,
  totalPages: number,
  totalItems: number
): {
  currentPage: number;
  perPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  return {
    currentPage,
    perPage,
    totalPages,
    totalItems,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}

// Standard cache control headers
export const CACHE_CONTROL = {
  SHORT: 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
  MEDIUM: 'public, s-maxage=1800, stale-while-revalidate=3600', // 30 min cache, 1 hour stale
  LONG: 'public, s-maxage=3600, stale-while-revalidate=7200', // 1 hour cache, 2 hours stale
  NONE: 'no-cache, no-store, must-revalidate',
} as const;

// Standard error codes with proper typing
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
} as const;

// Type guards for API responses
export function isAPIErrorResponse(obj: unknown): obj is APIErrorResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    obj.success === false
  );
}

export function isAPISuccessResponse<T>(
  obj: unknown
): obj is APISuccessResponse<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    obj.success === true
  );
}

// Utility functions for API responses
export function createAPIErrorResponse(
  error: string,
  _statusCode: number = 500,
  details?: unknown
): APIErrorResponse {
  return {
    success: false,
    error,
    message: error,
    details,
    meta: {
      timestamp: new Date().toISOString(),
      endpoint: 'unknown',
      method: 'unknown',
      requestId: generateRequestId(),
      responseTime: 0,
      version: '2.3.0',
    },
  };
}

export function createAPISuccessResponse<T>(
  data: T,
  endpoint: string = 'unknown',
  method: string = 'unknown'
): APISuccessResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      requestId: generateRequestId(),
      responseTime: 0,
      version: '2.3.0',
    },
  };
}
