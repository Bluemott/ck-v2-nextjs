import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '../../lib/monitoring';
import { cacheManager } from '../../lib/cache';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('X-Request-ID') || 'unknown';

  try {
    // Perform health checks
    const healthChecks = await Promise.allSettled([
      // WordPress API health check
      fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_REST_URL}/wp/v2/posts?per_page=1`)
        .then(response => ({ status: response.status, ok: response.ok }))
        .catch(error => ({ status: 0, ok: false, error: error.message })),

      // Cache health check
      cacheManager.getStats()
        .then(stats => ({ ok: true, stats }))
        .catch(error => ({ ok: false, error: error.message })),

      // Monitoring health check
      monitoring.healthCheck()
        .then(ok => ({ ok }))
        .catch(error => ({ ok: false, error: error.message })),
    ]);

    const [wordpressHealth, cacheHealth, monitoringHealth] = healthChecks;

    // Determine overall health status
    const isHealthy = wordpressHealth.status === 'fulfilled' && 
                     wordpressHealth.value.ok &&
                     cacheHealth.status === 'fulfilled' && 
                     cacheHealth.value.ok &&
                     monitoringHealth.status === 'fulfilled' && 
                     monitoringHealth.value.ok;

    const responseTime = Date.now() - startTime;

    // Log health check results
    await monitoring.info('Health check performed', {
      requestId,
      responseTime,
      isHealthy,
      wordpressStatus: wordpressHealth.status === 'fulfilled' ? wordpressHealth.value.status : 'failed',
      cacheStatus: cacheHealth.status === 'fulfilled' ? 'ok' : 'failed',
      monitoringStatus: monitoringHealth.status === 'fulfilled' ? 'ok' : 'failed',
    });

    // Record health check metrics
    await monitoring.putMetric({
      namespace: 'WordPress/Health',
      metricName: 'HealthCheckDuration',
      value: responseTime,
      unit: 'Seconds',
      dimensions: {
        Status: isHealthy ? 'healthy' : 'unhealthy',
        Environment: process.env.NODE_ENV || 'development',
      },
    });

    const response = {
      success: true,
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime,
      requestId,
      checks: {
        wordpress: {
          status: wordpressHealth.status === 'fulfilled' ? 'ok' : 'failed',
          details: wordpressHealth.status === 'fulfilled' ? {
            statusCode: wordpressHealth.value.status,
            ok: wordpressHealth.value.ok,
          } : {
            error: wordpressHealth.reason,
          },
        },
        cache: {
          status: cacheHealth.status === 'fulfilled' ? 'ok' : 'failed',
          details: cacheHealth.status === 'fulfilled' ? {
            stats: cacheHealth.value.stats,
          } : {
            error: cacheHealth.reason,
          },
        },
        monitoring: {
          status: monitoringHealth.status === 'fulfilled' ? 'ok' : 'failed',
          details: monitoringHealth.status === 'fulfilled' ? {
            ok: monitoringHealth.value.ok,
          } : {
            error: monitoringHealth.reason,
          },
        },
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        region: process.env.AWS_REGION || 'unknown',
        version: process.env.npm_package_version || 'unknown',
      },
    };

    return NextResponse.json(response, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Request-ID': requestId,
        'X-Response-Time': responseTime.toString(),
        'X-Health-Status': isHealthy ? 'healthy' : 'degraded',
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Log health check error
    await monitoring.error('Health check failed', {
      requestId,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      responseTime,
      requestId,
    }, {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Response-Time': responseTime.toString(),
        'X-Health-Status': 'unhealthy',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('X-Request-ID') || 'unknown';
  
  await monitoring.warn('Health API method not allowed', {
    requestId,
    method: 'POST',
    endpoint: '/api/health',
  });

  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'This endpoint only supports GET requests',
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    }
  }, { 
    status: 405,
    headers: {
      'X-Request-ID': requestId,
    }
  });
} 