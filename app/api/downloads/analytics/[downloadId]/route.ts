import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '../../../../lib/cache';
import { DownloadAnalytics } from '../../../../lib/types/wordpress';

// Ensure Node.js runtime for better performance
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { downloadId: string } }
) {
  const requestId = crypto.randomUUID();
  const { downloadId } = params;

  try {
    // Create cache key
    const cacheKey = `downloads:analytics:${downloadId}`;

    // Check cache first
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, max-age=300', // 5 minutes
          'X-Cache': 'HIT',
          'X-Request-ID': requestId,
        },
      });
    }

    // Get analytics for specific download
    const analytics = await getDownloadAnalytics(downloadId);

    // Cache the response
    cacheManager.set(cacheKey, analytics, 5 * 60 * 1000); // 5 minutes

    return NextResponse.json(analytics, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'X-Cache': 'MISS',
        'X-Request-ID': requestId,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Download analytics error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch download analytics',
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

// Get analytics for a specific download
async function getDownloadAnalytics(
  downloadId: string
): Promise<DownloadAnalytics> {
  // In a real implementation, this would query a database
  // For now, return mock data based on downloadId
  const seed = downloadId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (multiplier: number) =>
    Math.floor((Math.sin(seed * multiplier) + 1) * 1000);

  return {
    downloadCount: random(1) + 100,
    lastDownloaded: new Date(Date.now() - random(2) * 1000).toISOString(),
    popularityScore: random(3) % 100,
    downloadsByDate: generateDownloadsByDate(seed),
    downloadsByCountry: {
      US: random(4) + 50,
      CA: random(5) + 20,
      UK: random(6) + 15,
      AU: random(7) + 10,
    },
    downloadsByDevice: {
      desktop: random(8) + 100,
      mobile: random(9) + 50,
      tablet: random(10) + 20,
    },
  };
}

// Generate mock downloads by date data with seed for consistency
function generateDownloadsByDate(seed: number): Record<string, number> {
  const data: Record<string, number> = {};
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const daySeed = seed + i;
    if (dateStr) {
      data[dateStr] = Math.floor((Math.sin(daySeed) + 1) * 25) + 10;
    }
  }

  return data;
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
