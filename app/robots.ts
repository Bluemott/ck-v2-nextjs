import { MetadataRoute } from 'next'
import { env } from './lib/env';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/private/',
          '/admin/',
          '/wp-content/',
          '/wp-admin/',
          '/wp-includes/',
          '/api/',
          '/_next/',
          '/debug/',
          '/shop-1',
          '/kimono-builder',
          '/about',
          '/contact-2',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/private/',
          '/admin/',
          '/wp-content/',
          '/wp-admin/',
          '/wp-includes/',
          '/api/',
          '/debug/',
          '/shop-1',
          '/kimono-builder',
          '/about',
          '/contact-2',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/private/',
          '/admin/',
          '/wp-content/',
          '/wp-admin/',
          '/wp-includes/',
          '/api/',
          '/debug/',
          '/shop-1',
          '/kimono-builder',
          '/about',
          '/contact-2',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
