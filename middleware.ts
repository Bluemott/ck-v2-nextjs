import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiter } from './app/lib/rate-limiter';

// Enhanced middleware for Cowboy Kimono v2 with AWS integration and performance optimizations
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  try {
    // Security headers for all requests
    const response = NextResponse.next();
    
    // Enhanced comprehensive security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

    // Enhanced Content Security Policy
    response.headers.set('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https:",
      "connect-src 'self' https://api.cowboykimono.com https://www.google-analytics.com https://*.execute-api.us-east-1.amazonaws.com",
      "frame-src 'self' https://www.googletagmanager.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '));
    
    // Performance optimizations
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('X-Download-Options', 'noopen');
    
    // Enhanced canonical URL handling
    const host = request.headers.get('host') || '';
    const isWWW = host.startsWith('www.');
    const canonicalUrl = isWWW 
      ? `https://cowboykimono.com${pathname}`
      : `https://cowboykimono.com${pathname}`;
    
    // Set canonical URL header
    response.headers.set('Link', `<${canonicalUrl}>; rel="canonical"`);
    
    // Enhanced caching headers for static assets
    if (pathname.startsWith('/images/') || pathname.startsWith('/downloads/')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      response.headers.set('Vary', 'Accept-Encoding');
    }
    
    // Optimized caching for Next.js static files
    if (pathname.startsWith('/_next/static/')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      response.headers.set('Vary', 'Accept-Encoding');
    }
    
    // Enhanced caching for API responses
    if (pathname.startsWith('/api/')) {
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      
      // Different cache strategies for different API endpoints
      if (pathname.startsWith('/api/posts') || pathname.startsWith('/api/categories') || pathname.startsWith('/api/tags')) {
        response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600'); // 5 min client, 10 min CDN
      } else if (pathname.startsWith('/api/search')) {
        response.headers.set('Cache-Control', 'public, max-age=180, s-maxage=300'); // 3 min client, 5 min CDN
      } else if (pathname.startsWith('/api/health')) {
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=120'); // 1 min client, 2 min CDN
      }
    }
    
    // Handle WordPress webhook authentication with enhanced security
    if (pathname.startsWith('/api/wordpress-webhook')) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401,
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          }
        );
      }
      
      // Add security headers for webhook endpoints
      response.headers.set('X-Webhook-Authenticated', 'true');
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    
    // Enhanced rate limiting for API routes
    if (pathname.startsWith('/api/') && !pathname.startsWith('/api/health')) {
      const clientIP = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      const rateLimitResult = await rateLimiter.check(clientIP, 100, 60000); // 100 requests per minute
      
      if (!rateLimitResult.success) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
          }),
          { 
            status: 429,
            headers: { 
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': rateLimitResult.limit.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': rateLimitResult.reset.toString(),
              'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
            }
          }
        );
      }
      
      // Add rate limit headers to response
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
    }
    
    // Enhanced blog pagination and SEO
    if (pathname.startsWith('/blog')) {
      // Add canonical URL for blog pages
      response.headers.set('Link', `<${canonicalUrl}>; rel="canonical"`);
      
      // Add structured data headers for blog pages
      response.headers.set('X-Structured-Data', 'true');
      
      // Add caching for blog pages
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600'); // 5 min client, 10 min CDN
    }
    
    // Enhanced search engine optimization
    if (pathname === '/') {
      response.headers.set('X-Robots-Tag', 'index, follow');
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    }
    
    // Handle admin redirects with enhanced security
    if (pathname.startsWith('/admin')) {
      // Add security headers for admin routes
      response.headers.set('X-Admin-Route', 'true');
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }
    
    // Handle Lambda API integration with enhanced headers
    if (pathname.startsWith('/api/recommendations')) {
      // Add Lambda-specific headers
      response.headers.set('X-Lambda-API', 'true');
      response.headers.set('X-API-Version', '2.3.0');
      response.headers.set('Cache-Control', 'public, max-age=180, s-maxage=300'); // 3 min client, 5 min CDN
    }
    
    // Handle health checks with no caching
    if (pathname.startsWith('/api/health')) {
      response.headers.set('X-Health-Check', 'true');
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    
    // Enhanced static file optimization
    if (pathname.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|webp|avif|woff|woff2|ttf|eot)$/)) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      response.headers.set('Vary', 'Accept-Encoding');
    }
    
    // Enhanced API response optimization
    if (pathname.startsWith('/api/')) {
      response.headers.set('Content-Type', 'application/json');
      response.headers.set('X-API-Response', 'true');
      response.headers.set('Vary', 'Accept-Encoding');
    }
    
    // Add performance monitoring headers
    response.headers.set('X-Response-Time', Date.now().toString());
    response.headers.set('X-Request-ID', Math.random().toString(36).substring(2, 15));
    
    return response;
    
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Return a safe response on middleware errors
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Middleware processing failed',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'X-Middleware-Error': 'true',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  }
}

// Configure middleware matcher - optimized for performance
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (static images)
     * - downloads (static downloads)
     * - public folder files
     * - robots.txt and sitemap.xml
     * - health check endpoints (to avoid middleware overhead)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|downloads/|public/|robots.txt|sitemap.xml|api/health).*)',
  ],
}; 