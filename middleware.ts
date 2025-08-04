import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { monitoring } from './app/lib/monitoring';
import { cacheManager } from './app/lib/cache';

// Performance monitoring middleware
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Skip monitoring for static assets and health checks
  const skipMonitoring = [
    '/_next/',
    '/favicon.ico',
    '/api/health',
    '/robots.txt',
    '/sitemap.xml',
  ].some(path => pathname.startsWith(path));

  // HTTPS redirect for production
  if (process.env.NODE_ENV === 'production') {
    const hostname = request.headers.get('host') || '';
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    const isAmplify = hostname.includes('amplifyapp.com') || hostname.includes('amplify.aws');
    
    // Only redirect if not localhost and not already HTTPS
    if (!isLocalhost && !isAmplify && request.headers.get('x-forwarded-proto') !== 'https') {
      const httpsUrl = new URL(request.url);
      httpsUrl.protocol = 'https:';
      return NextResponse.redirect(httpsUrl, 301);
    }
  }

  if (skipMonitoring) {
    return NextResponse.next();
  }

  try {
    // Record request start
    await monitoring.info('Request started', {
      pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      ip: request.ip || request.headers.get('x-forwarded-for'),
    });

    // Add monitoring headers
    const response = NextResponse.next();
    response.headers.set('X-Request-ID', generateRequestId());
    response.headers.set('X-Response-Time', '0');

    // Monitor API calls
    if (pathname.startsWith('/api/')) {
      await monitoring.recordAPICall(pathname, 0, 200);
    }

    // Cache headers for static content
    if (pathname.startsWith('/images/') || pathname.startsWith('/downloads/')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }

    // Monitor response time
    const responseTime = Date.now() - startTime;
    response.headers.set('X-Response-Time', responseTime.toString());

    // Record successful request
    await monitoring.info('Request completed', {
      pathname,
      method: request.method,
      responseTime,
      statusCode: 200,
    });

    return response;
  } catch (error) {
    // Record error
    await monitoring.error('Request failed', {
      pathname,
      method: request.method,
      error: error.message,
      stack: error.stack,
    });

    // Return error response
    const errorResponse = NextResponse.next();
    errorResponse.headers.set('X-Request-ID', generateRequestId());
    errorResponse.headers.set('X-Error', 'true');
    
    return errorResponse;
  }
}

// Generate unique request ID
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Configure middleware matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 