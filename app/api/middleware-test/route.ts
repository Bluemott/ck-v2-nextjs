import { NextRequest } from 'next/server';
import { APIResponseBuilder } from '../../lib/api-response';

export async function GET(request: NextRequest) {
  const responseBuilder = new APIResponseBuilder('/api/middleware-test', 'GET');
  
  try {
    // Test middleware headers
    const headers = request.headers;
    const middlewareHeaders = {
      'x-content-type-options': headers.get('x-content-type-options'),
      'x-frame-options': headers.get('x-frame-options'),
      'x-xss-protection': headers.get('x-xss-protection'),
      'referrer-policy': headers.get('referrer-policy'),
      'permissions-policy': headers.get('permissions-policy'),
      'access-control-allow-origin': headers.get('access-control-allow-origin'),
      'x-rate-limit-limit': headers.get('x-ratelimit-limit'),
      'x-rate-limit-remaining': headers.get('x-ratelimit-remaining'),
    };

    return responseBuilder.success({
      message: 'Middleware test successful',
      timestamp: new Date().toISOString(),
      path: request.nextUrl.pathname,
      method: request.method,
      middlewareHeaders,
      userAgent: request.headers.get('user-agent'),
      clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    });
  } catch (error) {
    console.error('Middleware test error:', error);
    return responseBuilder.error('Middleware test failed', 500);
  }
} 