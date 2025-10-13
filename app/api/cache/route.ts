import { NextRequest, NextResponse } from 'next/server';
import {
  getCacheStats,
  invalidateAllCache,
  invalidateDownloadsCache,
  invalidatePostCache,
} from '../../lib/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, slug } = body;

    switch (action) {
      case 'clear-all':
        invalidateAllCache();
        return NextResponse.json({
          success: true,
          message: 'All cache cleared successfully',
        });

      case 'clear-posts':
        if (slug) {
          invalidatePostCache(slug);
          return NextResponse.json({
            success: true,
            message: `Cache cleared for post: ${slug}`,
          });
        } else {
          // Clear all posts cache
          invalidatePostCache('*');
          return NextResponse.json({
            success: true,
            message: 'All posts cache cleared successfully',
          });
        }

      case 'clear-downloads':
        invalidateDownloadsCache();
        return NextResponse.json({
          success: true,
          message: 'Downloads cache cleared successfully',
        });

      case 'stats':
        const stats = getCacheStats();
        return NextResponse.json({
          success: true,
          stats,
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              'Invalid action. Use: clear-all, clear-posts, clear-downloads, or stats',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Cache management error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = getCacheStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
