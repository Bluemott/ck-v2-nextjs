import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { lambdaAPIClient } from '../../lib/lambda-api';
import { APIResponseBuilder } from '../../lib/api-response';

// Request validation schema
const recommendationsRequestSchema = z.object({
  postId: z.number().int().positive('Post ID must be a positive integer'),
  limit: z.number().int().min(1).max(10).optional().default(3),
});

// Response schema
const recommendationsResponseSchema = z.object({
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
  source: z.enum(['lambda', 'wordpress']),
});

export type RecommendationsRequest = z.infer<typeof recommendationsRequestSchema>;
export type RecommendationsResponse = z.infer<typeof recommendationsResponseSchema>;

/**
 * GET handler for recommendations
 * Allows fetching recommendations via query parameters
 */
export async function GET(request: NextRequest) {
  const responseBuilder = new APIResponseBuilder('/api/recommendations', 'GET');
  
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const limit = searchParams.get('limit');
    
    if (!postId) {
      return responseBuilder.error('postId parameter is required', 400);
    }
    
    const validatedParams = recommendationsRequestSchema.parse({
      postId: parseInt(postId, 10),
      limit: limit ? parseInt(limit, 10) : 3,
    });
    
    const result = await lambdaAPIClient.getRecommendations(
      validatedParams.postId,
      validatedParams.limit
    );
    
    const responseData: RecommendationsResponse = {
      recommendations: result.recommendations,
      total: result.total,
      metadata: result.metadata,
      source: 'lambda', // Lambda API is the primary source
    };
    
    // Validate response
    const validatedResponse = recommendationsResponseSchema.parse(responseData);
    
    return responseBuilder.success(validatedResponse, 200, 'public, max-age=300'); // 5 minutes cache
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return responseBuilder.validationError(error);
    }
    
    console.error('Recommendations API error:', error);
    return responseBuilder.error('Failed to fetch recommendations', 500);
  }
}

/**
 * POST handler for recommendations
 * Allows fetching recommendations via JSON body
 */
export async function POST(request: NextRequest) {
  const responseBuilder = new APIResponseBuilder('/api/recommendations', 'POST');
  
  try {
    const body = await request.json();
    const validatedParams = recommendationsRequestSchema.parse(body);
    
    const result = await lambdaAPIClient.getRecommendations(
      validatedParams.postId,
      validatedParams.limit
    );
    
    const responseData: RecommendationsResponse = {
      recommendations: result.recommendations,
      total: result.total,
      metadata: result.metadata,
      source: 'lambda', // Lambda API is the primary source
    };
    
    // Validate response
    const validatedResponse = recommendationsResponseSchema.parse(responseData);
    
    return responseBuilder.success(validatedResponse, 200, 'public, max-age=300'); // 5 minutes cache
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return responseBuilder.validationError(error);
    }
    
    console.error('Recommendations API error:', error);
    return responseBuilder.error('Failed to fetch recommendations', 500);
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 