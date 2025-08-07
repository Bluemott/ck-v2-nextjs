import { NextRequest, NextResponse } from 'next/server';
import { EnhancedMonitoring, monitoring } from '../../../lib/monitoring';

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
    const {
      type,
      value,
      page,
      userAgent,
      timestamp,
      loadTime,
      interactionType,
      duration,
    } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
        { status: 400 }
      );
    }

    // Handle different types of metrics
    switch (type) {
      case 'LCP':
      case 'FID':
      case 'CLS':
      case 'FCP':
      case 'TTFB':
      case 'INP':
        // Core Web Vitals
        if (typeof value !== 'number') {
          return NextResponse.json(
            { error: 'Invalid value for Core Web Vital' },
            { status: 400 }
          );
        }

        await enhancedMonitoring.trackCoreWebVitals({
          [type]: value,
          page: page || 'unknown',
          userAgent: userAgent || 'unknown',
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        });
        break;

      case 'page-load':
        // Page load metrics
        if (typeof loadTime !== 'number') {
          return NextResponse.json(
            { error: 'Invalid loadTime for page load' },
            { status: 400 }
          );
        }

        await enhancedMonitoring.trackPageLoad(
          page || 'unknown',
          loadTime,
          userAgent || 'unknown'
        );

        // Also track as performance metric
        await enhancedMonitoring.trackPerformanceMetric(
          'PageLoadTime',
          loadTime,
          'Milliseconds',
          {
            Page: page || 'unknown',
            UserAgent: userAgent || 'unknown',
          }
        );
        break;

      case 'user-interaction':
        // User interaction metrics
        if (typeof duration !== 'number' || !interactionType) {
          return NextResponse.json(
            { error: 'Invalid interaction data' },
            { status: 400 }
          );
        }

        await enhancedMonitoring.trackUserInteraction(
          interactionType,
          duration,
          page || 'unknown'
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown metric type: ${type}` },
          { status: 400 }
        );
    }

    // Log the metric for debugging
    await monitoring.info('Web Vitals metric received', {
      type,
      value,
      page,
      userAgent,
      timestamp,
    });

    return NextResponse.json(
      { success: true, message: 'Metric tracked successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing web vitals:', error);

    // Log the error
    await monitoring.error('Web Vitals processing error', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
