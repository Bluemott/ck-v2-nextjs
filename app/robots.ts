import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cowboykimono.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/private/', '/admin/', '/wp-content/', '/wp-admin/', '/wp-includes/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
