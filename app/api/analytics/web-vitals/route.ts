import { NextRequest, NextResponse } from 'next/server';
import { EnhancedMonitoring } from '../../../lib/monitoring';

// Ensure Node.js runtime (not Edge) and no static optimization
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Create enhanced monitoring instance
const enhancedMonitoring = new EnhancedMonitoring({
  region: process.env.AWS_REGION || 'us-east-1',
  logGroupName: '/aws/wordpress/application',
  enableXRay: process.env.NODE_ENV === 'production',
  enableMetrics: process.env.NODE_ENV === 'production',
  enableLogs: process.env.NODE_ENV === 'production',
  environment:
    (process.env.NODE_ENV as 'development' | 'production' | 'test') ||
    'development',
  maxRetries: 3,
  timeout: 10000,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log to CloudWatch if in production
    if (process.env.NODE_ENV === 'production') {
      try {
        await enhancedMonitoring.trackCoreWebVitals({
          ...body,
          timestamp: new Date(),
          userAgent: request.headers.get('user-agent') || undefined,
        });
      } catch (monitoringError) {
        console.warn('Failed to log to CloudWatch:', monitoringError);
      }
    }

    // Return success response with proper headers
    return NextResponse.json(
      { success: true, timestamp: new Date().toISOString() },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Web Vitals Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process web vitals',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// Explicit GET handler to avoid 405 from intermediaries that probe with GET
export async function GET() {
  return new NextResponse(
    JSON.stringify({ message: 'Web Vitals endpoint - use POST method' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        Allow: 'POST, OPTIONS, GET',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}
