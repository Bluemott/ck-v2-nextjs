import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Simple test response
    const testData = {
      message: 'Downloads API test endpoint working',
      timestamp: new Date().toISOString(),
      testDownloads: [
        {
          id: 'test-1',
          title: 'Test Download 1',
          thumbnail: '/images/Neon_Coloring_Mock.webp',
          downloadUrl: '/downloads/test1.pdf',
          type: 'pdf',
        },
        {
          id: 'test-2',
          title: 'Test Download 2',
          thumbnail: '/images/CK_Coloring_Button.webp',
          downloadUrl: '/downloads/test2.pdf',
          type: 'pdf',
        },
      ],
    };

    return NextResponse.json(testData, {
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (error) {
    console.error('Test downloads API error:', error);

    return NextResponse.json(
      {
        error: 'Test API failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
