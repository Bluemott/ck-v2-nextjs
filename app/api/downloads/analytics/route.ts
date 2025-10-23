import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '../../../lib/cache';
import { DownloadAnalytics, DownloadStats } from '../../../lib/types/wordpress';

// Ensure Node.js runtime for better performance
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { searchParams } = new URL(request.url);
    const downloadId = searchParams.get('downloadId');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Create cache key
    const cacheKey = `downloads:analytics:${downloadId || 'all'}:${category || 'all'}:${limit}`;

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

    let responseData;

    if (downloadId) {
      // Get analytics for specific download
      responseData = await getDownloadAnalytics(downloadId);
    } else {
      // Get overall download statistics
      responseData = await getOverallStats(category, limit);
    }

    // Cache the response
    cacheManager.set(cacheKey, responseData, 5 * 60 * 1000); // 5 minutes

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'X-Cache': 'MISS',
        'X-Request-ID': requestId,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Analytics API error:`, error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics',
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
  _downloadId: string
): Promise<DownloadAnalytics> {
  // In a real implementation, this would query a database
  // For now, return mock data
  return {
    downloadCount: Math.floor(Math.random() * 1000) + 100,
    lastDownloaded: new Date(
      Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    popularityScore: Math.floor(Math.random() * 100),
    downloadsByDate: generateDownloadsByDate(),
    downloadsByCountry: {
      US: Math.floor(Math.random() * 200) + 50,
      CA: Math.floor(Math.random() * 100) + 20,
      UK: Math.floor(Math.random() * 80) + 15,
      AU: Math.floor(Math.random() * 60) + 10,
    },
    downloadsByDevice: {
      desktop: Math.floor(Math.random() * 300) + 100,
      mobile: Math.floor(Math.random() * 200) + 50,
      tablet: Math.floor(Math.random() * 100) + 20,
    },
  };
}

// Get overall download statistics
async function getOverallStats(
  category?: string | null,
  limit: number = 10
): Promise<DownloadStats> {
  // In a real implementation, this would query a database
  // For now, return mock data
  return {
    totalDownloads: Math.floor(Math.random() * 10000) + 5000,
    downloadsThisMonth: Math.floor(Math.random() * 1000) + 500,
    mostPopular: Array.from({ length: limit }, (_, i) => ({
      id: `download-${i + 1}`,
      title: `Popular Download ${i + 1}`,
      downloadCount: Math.floor(Math.random() * 500) + 100,
      category:
        ['coloring-pages', 'craft-templates', 'diy-tutorials'][i % 3] ||
        'coloring-pages',
    })),
    downloadsByCategory: {
      'coloring-pages': Math.floor(Math.random() * 2000) + 1000,
      'craft-templates': Math.floor(Math.random() * 1500) + 800,
      'diy-tutorials': Math.floor(Math.random() * 1000) + 500,
    },
    recentDownloads: Array.from({ length: 5 }, (_, i) => ({
      id: `download-${i + 1}`,
      title: `Recent Download ${i + 1}`,
      category:
        ['coloring-pages', 'craft-templates', 'diy-tutorials'][i % 3] ||
        'coloring-pages',
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    })),
  };
}

// Generate mock downloads by date data
function generateDownloadsByDate(): Record<string, number> {
  const data: Record<string, number> = {};
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    if (dateStr) {
      data[dateStr] = Math.floor(Math.random() * 50) + 10;
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
