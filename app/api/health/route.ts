import { createGETHandler, createMethodNotAllowedHandler } from '../../lib/api-handler';
import { CACHE_CONTROL } from '../../lib/api-response';
import { monitoring } from '../../lib/monitoring';
import { checkCacheHealth } from '../../lib/cache';
import { restAPIClient } from '../../lib/rest-api';
import { env } from '../../lib/env';
import type { HealthCheckResponse, CacheHealthStats, WordPressHealthStatus } from '../../lib/types/api';

// Disable Edge Runtime to avoid module issues
export const runtime = 'nodejs';

// Health Check Handler with proper type definitions
const healthHandler = async ({ responseBuilder }: {
  responseBuilder: {
    success: <T>(_data: T, _statusCode?: number, _cacheControl?: string) => Response;
    error: (_error: string, _statusCode?: number, _details?: unknown) => Response;
    getRequestId: () => string;
  };
}): Promise<Response> => {
  const startTime = Date.now();
  
  const healthData: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.3.0',
    environment: env.NODE_ENV,
    checks: {
      wordpress: false,
      cache: false,
      monitoring: false,
      ssl: false,
      performance: false,
    },
    metrics: {
      responseTime: 0,
      cacheStats: null,
      wordpressStatus: null,
    },
    issues: [] as string[],
  };

  try {
    // Check WordPress API with enhanced diagnostics
    try {
      const wpStartTime = Date.now();
      const apiUrl = env.NEXT_PUBLIC_WORDPRESS_REST_URL;
      
      // Test basic connectivity first
      let connectivityCheck = false;
      try {
        const connectivityResponse = await fetch(`${apiUrl}/wp-json/`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });
        connectivityCheck = connectivityResponse.ok || connectivityResponse.status === 200;
      } catch {
        // Connectivity failed, will be caught in main try-catch
      }
      
      // Test posts endpoint
      const wpResponse = await restAPIClient.getPosts({ per_page: 1 });
      const wpResponseTime = Date.now() - wpStartTime;
      
      healthData.checks.wordpress = true;
      const wordpressStatus: WordPressHealthStatus = {
        status: 'healthy',
        responseTime: wpResponseTime,
        postsAvailable: wpResponse.pagination.totalPosts,
        apiUrl,
        lastCheck: new Date().toISOString(),
        connectivity: connectivityCheck,
      };
      healthData.metrics.wordpressStatus = wordpressStatus;
      
      // Log WordPress API performance
      await monitoring.recordAPICall('/wp-json/wp/v2/posts', wpResponseTime, 200);
      
      // Check response time thresholds
      if (wpResponseTime > 5000) {
        healthData.issues.push(`WordPress API slow response: ${wpResponseTime}ms`);
        wordpressStatus.status = 'degraded';
      }
      
    } catch (error) {
      healthData.checks.wordpress = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Enhanced error diagnostics
      let detailedError = errorMessage;
      if (errorMessage.includes('500') || errorMessage.includes('501')) {
        detailedError = `WordPress API server error (${errorMessage}). Check Lightsail instance logs and firewall rules.`;
      } else if (errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
        detailedError = `WordPress API connectivity issue (${errorMessage}). Check firewall rules and instance status.`;
      } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('DNS')) {
        detailedError = `WordPress API DNS resolution failed (${errorMessage}). Check DNS configuration.`;
      }
      
      healthData.issues.push(`WordPress API error: ${detailedError}`);
      
      // Set WordPress status with error details
      healthData.metrics.wordpressStatus = {
        status: 'unhealthy',
        responseTime: 0,
        postsAvailable: 0,
        apiUrl: env.NEXT_PUBLIC_WORDPRESS_REST_URL,
        lastCheck: new Date().toISOString(),
        connectivity: false,
        error: detailedError,
      };
      
      await monitoring.error('WordPress API health check failed', { 
        error: detailedError,
        originalError: errorMessage,
        requestId: responseBuilder.getRequestId(),
      });
    }

    // Check cache health
    try {
      const cacheHealth = await checkCacheHealth();
      healthData.checks.cache = cacheHealth.status === 'healthy';
      
      // Convert cache health status to match our type definition
      const cacheStatus = cacheHealth.status === 'healthy' ? 'healthy' : 
                         cacheHealth.status === 'warning' ? 'degraded' : 'unhealthy';
      
      const cacheStats: CacheHealthStats = {
        status: cacheStatus,
        hitRate: typeof cacheHealth.stats.hitRate === 'number' ? cacheHealth.stats.hitRate : 0,
        missRate: typeof cacheHealth.stats.missRate === 'number' ? cacheHealth.stats.missRate : 0,
        evictionRate: typeof cacheHealth.stats.evictionRate === 'number' ? cacheHealth.stats.evictionRate : 0,
        memoryUsage: typeof cacheHealth.stats.memoryUsage === 'number' ? cacheHealth.stats.memoryUsage : 0,
        entryCount: typeof cacheHealth.stats.entryCount === 'number' ? cacheHealth.stats.entryCount : 0,
        maxEntries: typeof cacheHealth.stats.maxEntries === 'number' ? cacheHealth.stats.maxEntries : 0,
        issues: cacheHealth.issues,
      };
      healthData.metrics.cacheStats = cacheStats;
      
      if (cacheHealth.issues.length > 0) {
        healthData.issues.push(...cacheHealth.issues);
      }
      
    } catch (error) {
      healthData.checks.cache = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      healthData.issues.push(`Cache health check error: ${errorMessage}`);
    }

    // Check monitoring system
    try {
      const monitoringHealth = await monitoring.healthCheck();
      healthData.checks.monitoring = monitoringHealth;
      
      if (!monitoringHealth) {
        healthData.issues.push('Monitoring system health check failed');
      }
      
    } catch (error) {
      healthData.checks.monitoring = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      healthData.issues.push(`Monitoring error: ${errorMessage}`);
    }

    // Check SSL/HTTPS
    try {
      const sslResponse = await fetch(env.NEXT_PUBLIC_WORDPRESS_REST_URL, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      healthData.checks.ssl = sslResponse.ok;
      
      if (!sslResponse.ok) {
        healthData.issues.push(`SSL check failed: ${sslResponse.status} ${sslResponse.statusText}`);
      }
      
    } catch (error) {
      healthData.checks.ssl = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      healthData.issues.push(`SSL check error: ${errorMessage}`);
    }

    // Performance check
    const totalResponseTime = Date.now() - startTime;
    healthData.metrics.responseTime = totalResponseTime;
    healthData.checks.performance = totalResponseTime < 2000; // 2 seconds threshold
    
    if (totalResponseTime > 2000) {
      healthData.issues.push(`Slow response time: ${totalResponseTime}ms`);
    }

    // Determine overall status
    const failedChecks = Object.values(healthData.checks).filter(check => !check).length;
    const criticalIssues = healthData.issues.length;
    
    if (failedChecks === 0 && criticalIssues === 0) {
      healthData.status = 'healthy';
    } else if (failedChecks <= 1 && criticalIssues <= 2) {
      healthData.status = 'degraded';
    } else {
      healthData.status = 'unhealthy';
    }

    // Log health check
    await monitoring.info('Health check completed', {
      status: healthData.status,
      responseTime: totalResponseTime,
      failedChecks,
      criticalIssues,
      checks: healthData.checks,
      requestId: responseBuilder.getRequestId(),
    });

    // Return appropriate status code
    const statusCode = healthData.status === 'healthy' ? 200 : 
                      healthData.status === 'degraded' ? 200 : 503;

    return responseBuilder.success(healthData, statusCode, CACHE_CONTROL.NONE);

  } catch (error) {
    await monitoring.error('Health check failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId: responseBuilder.getRequestId(),
    });

    healthData.status = 'unhealthy';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    healthData.issues.push(`Health check error: ${errorMessage}`);
    
    return responseBuilder.error('Health check failed', 503, healthData);
  }
};

// Export GET handler
export const GET = createGETHandler(healthHandler, {
  endpoint: '/api/health',
  cacheControl: CACHE_CONTROL.NONE,
  rateLimit: {
    maxRequests: 60, // Allow more frequent health checks
    windowMs: 60000, // 1 minute
  },
});

// Export POST handler (method not allowed)
export const POST = createMethodNotAllowedHandler('/api/health'); 