import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  const healthData: {
    status: string;
    timestamp: string;
    version: string;
    environment: string | undefined;
    uptime: number;
    memory: {
      used: number;
      total: number;
      external: number;
    };
    checks: {
      basic: boolean;
      wordpress: boolean;
    };
    errors: string[];
    warnings: string[];
    wordpress?: {
      status: string;
      postsCount: string | null;
    };
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.2.0',
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
    },
    checks: {
      basic: true,
      wordpress: false,
    },
    errors: [],
    warnings: [],
  };

  try {
    // Check WordPress API connectivity
    try {
      const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_REST_URL;
      if (!wpUrl) {
        healthData.errors.push('WordPress URL not configured');
        healthData.checks.wordpress = false;
      } else {
        const wpResponse = await fetch(`${wpUrl}/wp/v2/posts?per_page=1`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        
        if (wpResponse.ok) {
          healthData.checks.wordpress = true;
          healthData.wordpress = {
            status: 'connected',
            postsCount: wpResponse.headers.get('X-WP-Total'),
          };
        } else {
          healthData.checks.wordpress = false;
          healthData.errors.push(`WordPress API error: ${wpResponse.status} ${wpResponse.statusText}`);
        }
      }
    } catch (error) {
      healthData.checks.wordpress = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      healthData.errors.push(`WordPress API connection failed: ${errorMessage}`);
    }

    // Overall health status
    const allChecksPassed = Object.values(healthData.checks).every(check => check === true);
    healthData.status = allChecksPassed ? 'healthy' : 'degraded';
    
    if (healthData.errors.length > 0) {
      healthData.status = 'unhealthy';
    }

    // Set appropriate status code
    const statusCode = healthData.status === 'healthy' ? 200 : 
                      healthData.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthData, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
        'X-Health-Check': 'true',
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: errorMessage,
      checks: healthData.checks,
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
        'X-Health-Check': 'true',
      },
    });
  }
} 