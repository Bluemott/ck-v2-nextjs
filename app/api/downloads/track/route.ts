import { NextRequest, NextResponse } from 'next/server';
import { EnhancedMonitoring } from '../../../lib/monitoring';
import { DownloadTrackingData } from '../../../lib/types/wordpress';

// Ensure Node.js runtime for better performance
export const runtime = 'nodejs';
export const revalidate = 0;

// Create monitoring instance
const monitoring = new EnhancedMonitoring({
  region: process.env.AWS_REGION || 'us-east-1',
  logGroupName: '/aws/downloads/tracking',
  enableXRay: process.env.NODE_ENV === 'production',
  enableMetrics: process.env.NODE_ENV === 'production',
  enableLogs: process.env.NODE_ENV === 'production',
  environment:
    (process.env.NODE_ENV as 'development' | 'production' | 'test') ||
    'development',
  maxRetries: 3,
  timeout: 5000,
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.downloadId) {
      return NextResponse.json(
        {
          success: false,
          error: 'downloadId is required',
          requestId,
        },
        { status: 400 }
      );
    }

    // Create tracking data
    const trackingData: DownloadTrackingData = {
      downloadId: body.downloadId,
      category: body.category || 'unknown',
      slug: body.slug || 'unknown',
      timestamp: body.timestamp || new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || undefined,
      referrer: request.headers.get('referer') || body.referrer,
      ipHash: hashIP(getClientIP(request)),
      deviceType: getDeviceType(request.headers.get('user-agent')),
      country: body.country,
    };

    // Log to CloudWatch in production
    if (process.env.NODE_ENV === 'production') {
      try {
        await monitoring.info('Download tracked', {
          eventType: 'download_tracked',
          ...trackingData,
          requestId,
          timestamp: new Date().toISOString(),
        });
      } catch (monitoringError) {
        console.warn('Failed to log to CloudWatch:', monitoringError);
      }
    }

    // In a real implementation, you would store this in a database
    // For now, we'll just log it and return success
    console.warn(`Download tracked: ${trackingData.downloadId}`, {
      category: trackingData.category,
      timestamp: trackingData.timestamp,
      deviceType: trackingData.deviceType,
      requestId,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Download tracked successfully',
        requestId,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Request-ID': requestId,
        },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Download tracking error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track download',
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        timestamp: new Date().toISOString(),
      },
      {
        status: 500,
        headers: {
          'X-Request-ID': requestId,
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
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

// Helper function to hash IP for privacy
function hashIP(ip: string): string {
  if (ip === 'unknown') return 'unknown';

  // Simple hash for anonymization
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Helper function to determine device type
function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();
  if (
    ua.includes('mobile') ||
    ua.includes('android') ||
    ua.includes('iphone')
  ) {
    return 'mobile';
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  return 'desktop';
}
