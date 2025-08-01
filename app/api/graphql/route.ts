import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../lib/env';
import { validateGraphQLQuery, graphqlQuerySchema } from '../../lib/validation';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    
    // Validate GraphQL query structure
    const validatedQuery = validateGraphQLQuery(body);
    
    // Additional validation for query complexity and security
    const query = validatedQuery.query;
    
    // Check for potentially dangerous operations
    const dangerousKeywords = ['mutation', 'delete', 'drop', 'truncate', 'alter'];
    const hasDangerousKeywords = dangerousKeywords.some(keyword => 
      query.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (hasDangerousKeywords) {
      return NextResponse.json(
        { 
          errors: [{ 
            message: 'Query contains potentially dangerous operations',
            code: 'FORBIDDEN_OPERATION'
          }] 
        },
        { 
          status: 403,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Check query length to prevent abuse
    if (query.length > 10000) {
      return NextResponse.json(
        { 
          errors: [{ 
            message: 'Query too long',
            code: 'QUERY_TOO_LONG'
          }] 
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Forward the validated request to AWS GraphQL
    const response = await fetch(env.NEXT_PUBLIC_AWS_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedQuery),
    });

    const data = await response.json();

    // Return with CORS headers
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          errors: error.errors.map(err => ({
            message: err.message,
            field: err.path.join('.'),
            code: 'VALIDATION_ERROR'
          }))
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 