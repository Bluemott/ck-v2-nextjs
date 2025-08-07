import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  APIResponseBuilder,
  commonQuerySchema,
  ERROR_CODES,
} from './api-response';
import type { APIHandlerFunction } from './types/api';

// Conditional monitoring import to avoid client-side bundling issues
let monitoring: typeof import('./monitoring').monitoring | null = null;

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

// Standard API Handler Options with proper typing
export interface APIHandlerOptions {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  cacheControl?: string;
  validateQuery?: z.ZodSchema;
  validateBody?: z.ZodSchema;
  requireAuth?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

// Rate limiting store (in-memory for now, should be Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting middleware with proper typing
function checkRateLimit(ip: string, options: APIHandlerOptions): boolean {
  if (!options.rateLimit) return true;

  const key = `${ip}:${options.endpoint}`;
  const now = Date.now();
  const windowMs = options.rateLimit.windowMs;
  const maxRequests = options.rateLimit.maxRequests;

  const current = rateLimitStore.get(key);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

// Standard API Handler Wrapper with proper typing
export function createAPIHandler(
  handler: APIHandlerFunction,
  options: APIHandlerOptions
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const responseBuilder = new APIResponseBuilder(
      options.endpoint,
      options.method
    );

    try {
      // Check method
      if (request.method !== options.method) {
        return responseBuilder.methodNotAllowed();
      }

      // Check rate limiting
      const ip =
        (request as { ip?: string }).ip ||
        request.headers.get('x-forwarded-for') ||
        'unknown';
      if (!checkRateLimit(ip, options)) {
        return responseBuilder.rateLimitExceeded();
      }

      // Parse and validate query parameters
      let query: Record<string, unknown> = {};
      if (options.validateQuery) {
        try {
          const { searchParams } = new URL(request.url);
          const queryParams = Object.fromEntries(searchParams.entries());
          query = options.validateQuery.parse(queryParams) as Record<
            string,
            unknown
          >;
        } catch (error) {
          if (error instanceof z.ZodError) {
            return responseBuilder.validationError(error);
          }
          throw error;
        }
      } else {
        // Use common query schema by default
        try {
          const { searchParams } = new URL(request.url);
          const queryParams = Object.fromEntries(searchParams.entries());
          query = commonQuerySchema.parse(queryParams);
        } catch (error) {
          if (error instanceof z.ZodError) {
            return responseBuilder.validationError(error);
          }
          throw error;
        }
      }

      // Parse and validate body for non-GET requests
      let body: unknown;
      if (options.method !== 'GET' && options.validateBody) {
        try {
          const rawBody = await request.json();
          body = options.validateBody.parse(rawBody);
        } catch (error) {
          if (error instanceof z.ZodError) {
            return responseBuilder.validationError(error);
          }
          throw error;
        }
      }

      // Call the handler with proper typing
      const result = await handler({
        request,
        query,
        body,
        responseBuilder,
      });

      return result as NextResponse;
    } catch (error) {
      // Log the error (if monitoring is available)
      if (monitoring) {
        monitoring.error('API handler error', {
          requestId: responseBuilder.getRequestId(),
          endpoint: options.endpoint,
          method: options.method,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }

      // Return error response
      return responseBuilder.error(
        'Internal server error',
        500,
        process.env.NODE_ENV === 'development'
          ? {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            }
          : undefined
      );
    }
  };
}

// Convenience function for GET handlers with proper typing
export function createGETHandler(
  handler: APIHandlerFunction,
  options: Omit<APIHandlerOptions, 'method'>
) {
  return createAPIHandler(handler, { ...options, method: 'GET' });
}

// Convenience function for POST handlers with proper typing
export function createPOSTHandler(
  handler: APIHandlerFunction,
  options: Omit<APIHandlerOptions, 'method'>
) {
  return createAPIHandler(handler, { ...options, method: 'POST' });
}

// WordPress API error handler with proper typing
export function handleWordPressError(
  error: unknown,
  responseBuilder: APIResponseBuilder
): NextResponse {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes('fetch')) {
    return responseBuilder.error('WordPress API connection failed', 503, {
      code: ERROR_CODES.EXTERNAL_API_ERROR,
      message: 'Unable to connect to WordPress API',
    });
  }

  if (errorMessage.includes('404')) {
    return responseBuilder.notFound('Post');
  }

  if (errorMessage.includes('403')) {
    return responseBuilder.error('Access forbidden', 403, {
      code: ERROR_CODES.FORBIDDEN,
      message: 'Access to this resource is forbidden',
    });
  }

  return responseBuilder.error('WordPress API error', 502, {
    code: ERROR_CODES.EXTERNAL_API_ERROR,
    message: errorMessage || 'Unknown WordPress API error',
  });
}

// Standard WordPress API response transformer with proper typing
export function transformWordPressResponse<T>(
  data: T,
  pagination?: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalItems: number;
  }
) {
  const response: Record<string, unknown> = {
    data,
  };

  if (pagination) {
    response.pagination = {
      currentPage: pagination.currentPage,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
      totalItems: pagination.totalItems,
      hasNextPage: pagination.currentPage < pagination.totalPages,
      hasPreviousPage: pagination.currentPage > 1,
    };
  }

  return response;
}

// Standard error response for unsupported methods with proper typing
export function createMethodNotAllowedHandler(endpoint: string) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const responseBuilder = new APIResponseBuilder(endpoint, request.method);
    return responseBuilder.methodNotAllowed();
  };
}
