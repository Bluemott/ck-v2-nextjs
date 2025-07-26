import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cowboykimono.com';
  
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
