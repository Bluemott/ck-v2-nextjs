import { NextRequest, NextResponse } from 'next/server';
import { restAPIClient } from '../../../lib/rest-api';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'coloring-pages';
    const testMedia = searchParams.get('testMedia') === 'true';

    console.warn(`[${requestId}] Downloads Debug Request:`, {
      category,
      testMedia,
    });

    const debugInfo = {
      requestId,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        wordpressUrl: process.env.NEXT_PUBLIC_WORDPRESS_REST_URL,
        wordpressAdminUrl: process.env.NEXT_PUBLIC_WORDPRESS_ADMIN_URL,
      },
      tests: {
        wordpressConnection: null as any,
        downloadsEndpoint: null as any,
        mediaEndpoint: null as any,
        categoryFilter: null as any,
      },
      errors: [] as string[],
    };

    // Test 1: Basic WordPress connection
    try {
      console.warn(`[${requestId}] Testing WordPress connection...`);
      const wpUrl =
        process.env.NEXT_PUBLIC_WORDPRESS_REST_URL ||
        'https://api.cowboykimono.com';
      const healthResponse = await fetch(
        `${wpUrl}/wp-json/wp/v2/posts?per_page=1`,
        {
          signal: AbortSignal.timeout(10000),
        }
      );

      debugInfo.tests.wordpressConnection = {
        status: healthResponse.status,
        statusText: healthResponse.statusText,
        ok: healthResponse.ok,
        headers: Object.fromEntries(healthResponse.headers.entries()),
      };

      if (!healthResponse.ok) {
        debugInfo.errors.push(
          `WordPress connection failed: ${healthResponse.status} ${healthResponse.statusText}`
        );
      }
    } catch (error) {
      debugInfo.errors.push(
        `WordPress connection error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Test 2: Downloads endpoint
    try {
      console.warn(`[${requestId}] Testing downloads endpoint...`);
      const downloadsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_REST_URL || 'https://api.cowboykimono.com'}/wp-json/wp/v2/downloads?per_page=5&_embed=1`,
        {
          signal: AbortSignal.timeout(15000),
        }
      );

      const downloadsData = await downloadsResponse.json();

      debugInfo.tests.downloadsEndpoint = {
        status: downloadsResponse.status,
        statusText: downloadsResponse.statusText,
        ok: downloadsResponse.ok,
        dataLength: Array.isArray(downloadsData) ? downloadsData.length : 0,
        sampleData:
          Array.isArray(downloadsData) && downloadsData.length > 0
            ? downloadsData[0]
            : null,
        headers: Object.fromEntries(downloadsResponse.headers.entries()),
      };

      if (!downloadsResponse.ok) {
        debugInfo.errors.push(
          `Downloads endpoint failed: ${downloadsResponse.status} ${downloadsResponse.statusText}`
        );
      }
    } catch (error) {
      debugInfo.errors.push(
        `Downloads endpoint error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Test 3: Media endpoint (if testMedia is true)
    if (testMedia) {
      try {
        console.warn(`[${requestId}] Testing media endpoint...`);
        const mediaResponse = await fetch(
          `${process.env.NEXT_PUBLIC_WORDPRESS_REST_URL || 'https://api.cowboykimono.com'}/wp-json/wp/v2/media?per_page=3`,
          {
            signal: AbortSignal.timeout(10000),
          }
        );

        const mediaData = await mediaResponse.json();

        debugInfo.tests.mediaEndpoint = {
          status: mediaResponse.status,
          statusText: mediaResponse.statusText,
          ok: mediaResponse.ok,
          dataLength: Array.isArray(mediaData) ? mediaData.length : 0,
          sampleData:
            Array.isArray(mediaData) && mediaData.length > 0
              ? mediaData[0]
              : null,
          headers: Object.fromEntries(mediaResponse.headers.entries()),
        };

        if (!mediaResponse.ok) {
          debugInfo.errors.push(
            `Media endpoint failed: ${mediaResponse.status} ${mediaResponse.statusText}`
          );
        }
      } catch (error) {
        debugInfo.errors.push(
          `Media endpoint error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Test 4: Category filtering
    try {
      console.warn(
        `[${requestId}] Testing category filtering for: ${category}`
      );
      const categoryDownloads =
        await restAPIClient.getDownloadsByCategory(category);

      debugInfo.tests.categoryFilter = {
        category,
        downloadCount: categoryDownloads.length,
        sampleDownloads: categoryDownloads.slice(0, 2).map((download) => ({
          id: download.id,
          title: download.title?.rendered,
          acf: download.acf,
          meta: download.meta,
          hasEmbedded: !!download._embedded,
        })),
      };

      if (categoryDownloads.length === 0) {
        debugInfo.errors.push(`No downloads found for category: ${category}`);
      }
    } catch (error) {
      debugInfo.errors.push(
        `Category filtering error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Test 5: Our API endpoint
    try {
      console.warn(`[${requestId}] Testing our downloads API endpoint...`);
      const ourApiResponse = await fetch(
        `${request.nextUrl.origin}/api/downloads?category=${category}`,
        {
          signal: AbortSignal.timeout(15000),
        }
      );

      const ourApiData = await ourApiResponse.json();

      debugInfo.tests.ourApiEndpoint = {
        status: ourApiResponse.status,
        statusText: ourApiResponse.statusText,
        ok: ourApiResponse.ok,
        success: ourApiData.success,
        downloadsCount: ourApiData.downloads?.length || 0,
        sectionsCount: Array.isArray(ourApiData.downloads)
          ? ourApiData.downloads.length
          : 0,
        sampleResponse: {
          success: ourApiData.success,
          downloads: ourApiData.downloads?.slice(0, 1),
          meta: ourApiData.meta,
        },
        headers: Object.fromEntries(ourApiResponse.headers.entries()),
      };

      if (!ourApiResponse.ok) {
        debugInfo.errors.push(
          `Our API endpoint failed: ${ourApiResponse.status} ${ourApiResponse.statusText}`
        );
      }
    } catch (error) {
      debugInfo.errors.push(
        `Our API endpoint error: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Summary
    const hasErrors = debugInfo.errors.length > 0;
    const status = hasErrors ? 500 : 200;

    console.warn(`[${requestId}] Debug complete:`, {
      errors: debugInfo.errors.length,
      hasErrors,
      status,
    });

    return NextResponse.json(debugInfo, {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Debug endpoint error:`, error);

    return NextResponse.json(
      {
        requestId,
        error: 'Debug endpoint failed',
        message: error instanceof Error ? error.message : 'Unknown error',
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
