import { NextRequest, NextResponse } from 'next/server';
import { getApiConfig } from '../../lib/api-rest';
import { env } from '../../lib/env';

export async function GET(request: NextRequest) {
  try {
    // Get API configuration
    const apiConfig = getApiConfig();
    
    // Check if WordPress REST API is accessible
    let wordpressStatus = 'unknown';
    let wordpressResponseTime = 0;
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${apiConfig.restAPIClient.baseUrl}/wp-json/wp/v2/posts?per_page=1`);
      const endTime = Date.now();
      
      wordpressResponseTime = endTime - startTime;
      wordpressStatus = response.ok ? 'healthy' : 'unhealthy';
    } catch (error) {
      wordpressStatus = 'error';
    }
    
    // Get environment information
    const environment = {
      nodeEnv: env.NODE_ENV,
      isDevelopment: env.NODE_ENV === 'development',
      isProduction: env.NODE_ENV === 'production',
      restApiEnabled: true, // Always true now
      wordpressUrl: apiConfig.restAPIClient.baseUrl,
      siteUrl: env.NEXT_PUBLIC_SITE_URL
    };
    
    // Determine overall health status
    const overallStatus = wordpressStatus === 'healthy' ? 'healthy' : 'degraded';
    
    // Return health check response
    return NextResponse.json({
      success: true,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment,
      services: {
        wordpress: {
          status: wordpressStatus,
          responseTime: wordpressResponseTime,
          url: apiConfig.restAPIClient.baseUrl
        },
        api: {
          status: 'healthy',
          endpoints: [
            '/api/posts',
            '/api/posts/[slug]',
            '/api/categories',
            '/api/tags',
            '/api/search',
            '/api/health'
          ]
        }
      },
      meta: {
        endpoint: '/api/health',
        method: 'GET'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only supports GET requests'
  }, { status: 405 });
} 