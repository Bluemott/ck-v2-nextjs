import { NextRequest, NextResponse } from 'next/server';
import { 
  submitToIndexNow, 
  submitWordPressPostToIndexNow,
  submitWordPressCategoryToIndexNow,
  submitWordPressTagToIndexNow,
  getIndexNowConfig
} from '../../lib/indexnow';

/**
 * POST /api/indexnow
 * Submit URLs to IndexNow for faster search engine indexing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, type, slug, searchEngines } = body;

    // Validate request
    if (!urls && !type && !slug) {
      return NextResponse.json(
        { error: 'Missing required parameters. Provide either urls array, or type and slug.' },
        { status: 400 }
      );
    }

    let result;

    // Handle different submission types
    if (urls && Array.isArray(urls)) {
      // Submit multiple URLs
      result = await submitToIndexNow(urls, searchEngines);
    } else if (type && slug) {
      // Submit WordPress content by type
      switch (type) {
        case 'post':
          result = await submitWordPressPostToIndexNow(slug, searchEngines);
          break;
        case 'category':
          result = await submitWordPressCategoryToIndexNow(slug, searchEngines);
          break;
        case 'tag':
          result = await submitWordPressTagToIndexNow(slug, searchEngines);
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid type. Must be post, category, or tag.' },
            { status: 400 }
          );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid request format.' },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('IndexNow API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/indexnow
 * Get IndexNow configuration status
 */
export async function GET() {
  try {
    const config = getIndexNowConfig();
    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    console.error('IndexNow config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 