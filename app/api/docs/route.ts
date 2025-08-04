import { NextRequest, NextResponse } from 'next/server';
import { getApiConfig } from '../../lib/api';
import { env } from '../../lib/env';

export async function GET(_request: NextRequest) {
  try {
    const apiConfig = getApiConfig();
    
    const documentation = {
      title: 'Cowboy Kimono REST API Documentation',
      version: '2.0.0',
      description: 'REST API for Cowboy Kimono website with WordPress integration',
      baseUrl: env.NEXT_PUBLIC_APP_URL,
      endpoints: {
        posts: {
          url: '/api/posts',
          method: 'GET',
          description: 'Fetch blog posts with pagination and filtering',
          parameters: {
            page: { type: 'number', optional: true, description: 'Page number for pagination' },
            per_page: { type: 'number', optional: true, description: 'Number of posts per page (default: 12)' },
            search: { type: 'string', optional: true, description: 'Search term to filter posts' },
            categories: { type: 'string', optional: true, description: 'Comma-separated category IDs' },
            tags: { type: 'string', optional: true, description: 'Comma-separated tag IDs' },
            orderby: { type: 'string', optional: true, description: 'Order by field (default: date)' },
            order: { type: 'string', optional: true, description: 'Order direction: asc or desc (default: desc)' },
            with_pagination: { type: 'boolean', optional: true, description: 'Include pagination info in response' }
          },
          example: '/api/posts?page=1&per_page=10&orderby=date&order=desc'
        },
        'posts/[slug]': {
          url: '/api/posts/{slug}',
          method: 'GET',
          description: 'Fetch a single post by slug',
          parameters: {
            slug: { type: 'string', required: true, description: 'Post slug' },
            include_related: { type: 'boolean', optional: true, description: 'Include related posts' },
            related_limit: { type: 'number', optional: true, description: 'Number of related posts (default: 3)' }
          },
          example: '/api/posts/my-blog-post?include_related=true&related_limit=5'
        },
        categories: {
          url: '/api/categories',
          method: 'GET',
          description: 'Fetch all categories',
          parameters: {
            page: { type: 'number', optional: true, description: 'Page number for pagination' },
            per_page: { type: 'number', optional: true, description: 'Number of categories per page (default: 100)' },
            orderby: { type: 'string', optional: true, description: 'Order by field (default: name)' },
            order: { type: 'string', optional: true, description: 'Order direction: asc or desc (default: asc)' }
          },
          example: '/api/categories?per_page=50&orderby=name&order=asc'
        },
        tags: {
          url: '/api/tags',
          method: 'GET',
          description: 'Fetch all tags',
          parameters: {
            page: { type: 'number', optional: true, description: 'Page number for pagination' },
            per_page: { type: 'number', optional: true, description: 'Number of tags per page (default: 100)' },
            orderby: { type: 'string', optional: true, description: 'Order by field (default: name)' },
            order: { type: 'string', optional: true, description: 'Order direction: asc or desc (default: asc)' }
          },
          example: '/api/tags?per_page=50&orderby=name&order=asc'
        },
        search: {
          url: '/api/search',
          method: 'GET',
          description: 'Search posts by query',
          parameters: {
            q: { type: 'string', required: true, description: 'Search query' },
            page: { type: 'number', optional: true, description: 'Page number for pagination' },
            per_page: { type: 'number', optional: true, description: 'Number of results per page (default: 50)' }
          },
          example: '/api/search?q=cowboy&page=1&per_page=20'
        },
        health: {
          url: '/api/health',
          method: 'GET',
          description: 'Health check endpoint',
          parameters: {},
          example: '/api/health'
        },
        docs: {
          url: '/api/docs',
          method: 'GET',
          description: 'API documentation (this endpoint)',
          parameters: {},
          example: '/api/docs'
        }
      },
      architecture: {
        frontend: 'Next.js 15.3.4 on AWS Amplify',
        backend: 'WordPress on EC2 (headless CMS via REST API)',
        serverless: 'AWS Lambda functions with API Gateway',
        database: 'Aurora Serverless for enhanced features',
        storage: 'S3 for static assets, CloudFront for CDN',
        cdn: 'CloudFront for image optimization and caching'
      },
      configuration: {
        wordpressUrl: apiConfig.restAPIClient.baseUrl,
        siteUrl: env.NEXT_PUBLIC_APP_URL,
        environment: env.NODE_ENV,
        restApiEnabled: true
      },
      responseFormat: {
        success: {
          success: true,
          data: 'Response data',
          meta: {
            timestamp: 'ISO timestamp',
            endpoint: 'API endpoint',
            method: 'HTTP method'
          }
        },
        error: {
          success: false,
          error: 'Error type',
          message: 'Error description',
          details: 'Validation errors (if applicable)'
        }
      },
      caching: {
        posts: '5 minutes cache, 10 minutes stale-while-revalidate',
        categories: '30 minutes cache, 1 hour stale-while-revalidate',
        tags: '30 minutes cache, 1 hour stale-while-revalidate',
        search: '5 minutes cache, 10 minutes stale-while-revalidate',
        health: 'No cache'
      }
    };
    
    return NextResponse.json({
      success: true,
      data: documentation,
      meta: {
        timestamp: new Date().toISOString(),
        endpoint: '/api/docs',
        method: 'GET'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' // 1 hour cache, 2 hours stale
      }
    });

  } catch (error) {
    console.error('API Documentation error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only supports GET requests'
  }, { status: 405 });
} 