import { env } from './env';
import { z } from 'zod';
import { type BlogPost } from './api';

// Lambda API Configuration
const LAMBDA_CONFIG = {
  RECOMMENDATIONS_URL: env.NEXT_PUBLIC_LAMBDA_RECOMMENDATIONS_URL,
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 2,
};

// Lambda API Response Schema
const lambdaRecommendationsSchema = z.object({
  recommendations: z.array(z.object({
    id: z.number(),
    title: z.object({ rendered: z.string() }),
    excerpt: z.object({ rendered: z.string() }),
    slug: z.string(),
    date: z.string(),
    featured_media: z.number(),
    _embedded: z.any().optional(),
    score: z.number().optional(),
    categoryOverlap: z.number().optional(),
    tagOverlap: z.number().optional(),
  })),
  total: z.number(),
  metadata: z.object({
    sourcePostId: z.number(),
    categoriesFound: z.number(),
    tagsFound: z.number(),
    totalPostsProcessed: z.number(),
    uniquePostsFound: z.number(),
  }).optional(),
});

export type LambdaRecommendationsResponse = z.infer<typeof lambdaRecommendationsSchema>;

// Lambda API Error Schema
const lambdaErrorSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
  message: z.string().optional(),
});

export type LambdaErrorResponse = z.infer<typeof lambdaErrorSchema>;

/**
 * Lambda API Client for AWS Lambda functions
 * Handles communication with the recommendations Lambda function
 */
export class LambdaAPIClient {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;

  constructor() {
    this.baseUrl = LAMBDA_CONFIG.RECOMMENDATIONS_URL;
    this.timeout = LAMBDA_CONFIG.TIMEOUT;
    this.retryAttempts = LAMBDA_CONFIG.RETRY_ATTEMPTS;
  }

  /**
   * Make a request to the Lambda API with retry logic and error handling
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CowboyKimono-NextJS/2.3.0',
      },
      signal: controller.signal,
    };

    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(endpoint, requestOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          let errorData: LambdaErrorResponse;

          try {
            errorData = lambdaErrorSchema.parse(JSON.parse(errorText));
          } catch {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
          }

          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes('HTTP 4')) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Request failed after all retry attempts');
  }

  /**
   * Get recommendations for a post using the Lambda API
   */
  async getRecommendations(postId: number, limit: number = 3): Promise<{
    recommendations: BlogPost[];
    total: number;
    metadata?: {
      sourcePostId: number;
      categoriesFound: number;
      tagsFound: number;
      totalPostsProcessed: number;
      uniquePostsFound: number;
    };
  }> {
    try {
      const response = await this.makeRequest<LambdaRecommendationsResponse>(
        this.baseUrl,
        {
          method: 'POST',
          body: JSON.stringify({
            postId,
            limit,
          }),
        }
      );

      // Validate response
      const validatedResponse = lambdaRecommendationsSchema.parse(response);

      // Transform Lambda response to BlogPost format
      const recommendations: BlogPost[] = validatedResponse.recommendations.map(post => ({
        id: post.id,
        date: post.date,
        modified: post.date, // Use date as modified if not available
        slug: post.slug,
        status: 'publish', // Assume published for recommendations
        title: post.title,
        content: { rendered: '', protected: false }, // Content not included in recommendations
        excerpt: post.excerpt,
        author: 1, // Default author ID
        featured_media: post.featured_media,
        _embedded: post._embedded,
      }));

      return {
        recommendations,
        total: validatedResponse.total,
        metadata: validatedResponse.metadata,
      };
    } catch (error) {
      console.error('Lambda API error:', error);
      
      // Return empty result on error (non-critical feature)
      return {
        recommendations: [],
        total: 0,
      };
    }
  }

  /**
   * Get configuration for debugging
   */
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      config: LAMBDA_CONFIG,
    };
  }
}

// Export singleton instance
export const lambdaAPIClient = new LambdaAPIClient(); 