import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Minimal test working',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      WORDPRESS_URL: process.env.NEXT_PUBLIC_WORDPRESS_REST_URL,
    }
  });
} 