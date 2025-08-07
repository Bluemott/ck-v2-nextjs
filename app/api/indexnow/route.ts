import { NextRequest, NextResponse } from 'next/server';
import { validateIndexNowSubmission } from '../../lib/validation';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the IndexNow submission data
    const validatedSubmission = validateIndexNowSubmission(body);
    
    const {
      host,
      key,
      keyLocation,
      urlList
    } = validatedSubmission;

    // Log the submission for debugging
    console.warn('IndexNow submission received:', {
      host,
      key,
      keyLocation,
      urlCount: urlList.length,
      urls: urlList.slice(0, 5), // Log first 5 URLs
      timestamp: new Date().toISOString()
    });

    // Validate the key by checking the keyLocation
    try {
      const keyResponse = await fetch(keyLocation);
      if (!keyResponse.ok) {
        return NextResponse.json(
          { 
            error: 'Invalid key location',
            message: 'Could not verify IndexNow key'
          },
          { status: 400 }
        );
      }
      
      const keyContent = await keyResponse.text();
      if (!keyContent.includes(key)) {
        return NextResponse.json(
          { 
            error: 'Invalid key',
            message: 'IndexNow key verification failed'
          },
          { status: 400 }
        );
      }
    } catch (keyError) {
      console.error('Key verification error:', keyError);
      return NextResponse.json(
        { 
          error: 'Key verification failed',
          message: 'Could not verify IndexNow key'
        },
        { status: 400 }
      );
    }

    // Submit URLs to IndexNow services
    const indexNowServices = [
      'https://api.indexnow.org/indexnow',
      'https://www.bing.com/indexnow',
      'https://yandex.com/indexnow'
    ];

    const results = [];

    for (const service of indexNowServices) {
      try {
        const response = await fetch(service, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            host,
            key,
            keyLocation,
            urlList
          }),
        });

        const result = {
          service,
          status: response.status,
          success: response.ok,
          message: response.ok ? 'Submitted successfully' : `HTTP ${response.status}`
        };

        results.push(result);
        
        if (response.ok) {
          console.warn(`Successfully submitted to ${service}`);
        } else {
          console.warn(`Failed to submit to ${service}: HTTP ${response.status}`);
        }

      } catch (serviceError) {
        console.error(`Error submitting to ${service}:`, serviceError);
        results.push({
          service,
          status: 0,
          success: false,
          message: 'Network error'
        });
      }
    }

    // Calculate success rate
    const successfulSubmissions = results.filter(r => r.success).length;
    const totalSubmissions = results.length;
    const successRate = totalSubmissions > 0 ? (successfulSubmissions / totalSubmissions) * 100 : 0;

    // Return results
    return NextResponse.json({
      success: successfulSubmissions > 0,
      message: `Submitted ${urlList.length} URLs to ${totalSubmissions} services. ${successfulSubmissions} successful.`,
      data: {
        host,
        urlCount: urlList.length,
        services: results,
        successRate: `${successRate.toFixed(1)}%`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('IndexNow submission error:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid submission data',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'IndexNow submission endpoint',
    description: 'Submits URLs to search engines for faster indexing',
    supportedServices: [
      'https://api.indexnow.org/indexnow',
      'https://www.bing.com/indexnow',
      'https://yandex.com/indexnow'
    ],
    requiredFields: [
      'host',
      'key',
      'keyLocation',
      'urlList'
    ],
    limits: {
      maxUrls: 10000,
      maxUrlLength: 2048
    },
    documentation: 'https://www.indexnow.org/'
  });
} 