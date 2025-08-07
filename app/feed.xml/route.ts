import { NextRequest } from 'next/server';
import { enhancedCache } from '../lib/cache';
import { env } from '../lib/env';
import { EnhancedMonitoring } from '../lib/monitoring';
import { restAPIClient } from '../lib/rest-api';
import type { WPRestPost as WordPressPost } from '../lib/types/wordpress';

// Create enhanced monitoring instance for RSS feed
const enhancedMonitoring = new EnhancedMonitoring({
  region: process.env.AWS_REGION || 'us-east-1',
  logGroupName: '/aws/wordpress/application',
  enableXRay: process.env.NODE_ENV === 'production',
  enableMetrics: process.env.NODE_ENV === 'production',
  enableLogs: process.env.NODE_ENV === 'production',
  environment:
    (process.env.NODE_ENV as 'development' | 'production' | 'test') ||
    'development',
  maxRetries: 3,
  timeout: 10000,
});

// RSS Feed Configuration
const RSS_CONFIG = {
  TITLE: 'Cowboy Kimono Blog',
  DESCRIPTION:
    'Stories, inspiration, and insights from the world of Cowboy Kimono',
  LANGUAGE: 'en-US',
  CATEGORY: 'Blog',
  GENERATOR: 'Cowboy Kimono v2.4.0',
  TTL: 60, // minutes
  MAX_ITEMS: 20,
  CACHE_KEY: 'rss-feed',
  CACHE_TTL: 3600000, // 1 hour in milliseconds
};

// RSS Item interface for type safety
interface RSSItem {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  description: string;
  author?: string;
  category?: string;
  enclosure?: {
    url: string;
    type: string;
    length: string;
  };
}

// Generate RSS XML content
function generateRSSXML(items: RSSItem[], lastBuildDate: string): string {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title><![CDATA[${RSS_CONFIG.TITLE}]]></title>
    <link>${baseUrl}</link>
    <description><![CDATA[${RSS_CONFIG.DESCRIPTION}]]></description>
    <language>${RSS_CONFIG.LANGUAGE}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>${RSS_CONFIG.GENERATOR}</generator>
    <ttl>${RSS_CONFIG.TTL}</ttl>
    <category>${RSS_CONFIG.CATEGORY}</category>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${items
      .map(
        (item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <guid>${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description><![CDATA[${item.description}]]></description>
      ${item.author ? `<author><![CDATA[${item.author}]]></author>` : ''}
      ${item.category ? `<category><![CDATA[${item.category}]]></category>` : ''}
      ${item.enclosure ? `<enclosure url="${item.enclosure.url}" type="${item.enclosure.type}" length="${item.enclosure.length}" />` : ''}
    </item>
    `
      )
      .join('')}
  </channel>
</rss>`;
}

// Sanitize HTML content for RSS
function sanitizeRSSContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

// Convert WordPress post to RSS item
function convertPostToRSSItem(post: WordPressPost, baseUrl: string): RSSItem {
  const title = post.title?.rendered || 'Untitled';
  const content = post.content?.rendered || '';
  const excerpt = post.excerpt?.rendered || '';
  const slug = post.slug || '';
  const date = post.date || post.modified || new Date().toISOString();

  // Get author information
  let author = 'Cowboy Kimono';
  if (post._embedded?.author?.[0]?.name) {
    author = post._embedded.author[0].name;
  }

  // Get featured image
  let enclosure;
  if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    const media = post._embedded['wp:featuredmedia'][0];
    enclosure = {
      url: media.source_url,
      type: media.mime_type || 'image/jpeg',
      length: '0', // WordPress doesn't provide file size
    };
  }

  // Get category
  let category = '';
  if (post._embedded?.['wp:term']?.[0]?.[0]?.name) {
    category = post._embedded['wp:term'][0][0].name;
  }

  return {
    title: sanitizeRSSContent(title),
    link: `${baseUrl}/blog/${slug}`,
    guid: `${baseUrl}/blog/${slug}`,
    pubDate: new Date(date).toUTCString(),
    description: sanitizeRSSContent(
      `${excerpt || content.substring(0, 500)}...`
    ),
    author,
    category,
    enclosure,
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `rss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Track RSS feed request
    await enhancedMonitoring.info('RSS feed request', {
      requestId,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
    });

    // Check cache first
    const cachedRSS = await enhancedCache.getWithRedis(RSS_CONFIG.CACHE_KEY);
    if (cachedRSS && typeof cachedRSS === 'string') {
      await enhancedMonitoring.info('RSS feed cache hit', { requestId });

      return new Response(cachedRSS, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'X-Cache': 'HIT',
          'X-Request-ID': requestId,
        },
      });
    }

    // Fetch posts from WordPress REST API
    const { posts } = await restAPIClient.getPosts({
      per_page: RSS_CONFIG.MAX_ITEMS,
      _embed: true,
      status: 'publish',
      orderby: 'date',
      order: 'desc',
    });

    if (!posts || !Array.isArray(posts)) {
      throw new Error('Failed to fetch posts for RSS feed');
    }

    // Convert posts to RSS items
    const baseUrl = env.NEXT_PUBLIC_SITE_URL;
    const rssItems: RSSItem[] = posts
      .filter((post) => post && post.status === 'publish' && post.slug)
      .map((post) => convertPostToRSSItem(post, baseUrl));

    // Generate RSS XML
    const lastBuildDate = new Date().toUTCString();
    const rssXML = generateRSSXML(rssItems, lastBuildDate);

    // Cache the RSS feed
    await enhancedCache.setWithRedis(
      RSS_CONFIG.CACHE_KEY,
      rssXML,
      RSS_CONFIG.CACHE_TTL
    );

    // Track successful generation
    await enhancedMonitoring.info('RSS feed generated successfully', {
      requestId,
      itemsCount: rssItems.length,
      totalPosts: posts.length,
      generationTime: Date.now() - startTime,
    });

    return new Response(rssXML, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Cache': 'MISS',
        'X-Request-ID': requestId,
        'X-Items-Count': rssItems.length.toString(),
        'X-Generation-Time': (Date.now() - startTime).toString(),
      },
    });
  } catch (error) {
    console.error('RSS feed generation error:', error);

    // Track error
    await enhancedMonitoring.error('RSS feed generation error', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      generationTime: Date.now() - startTime,
    });

    // Return fallback RSS feed
    const fallbackRSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${RSS_CONFIG.TITLE}]]></title>
    <link>${env.NEXT_PUBLIC_SITE_URL}</link>
    <description><![CDATA[${RSS_CONFIG.DESCRIPTION}]]></description>
    <language>${RSS_CONFIG.LANGUAGE}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>${RSS_CONFIG.GENERATOR}</generator>
    <ttl>${RSS_CONFIG.TTL}</ttl>
    <category>${RSS_CONFIG.CATEGORY}</category>
    <atom:link href="${env.NEXT_PUBLIC_SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <item>
      <title><![CDATA[Feed temporarily unavailable]]></title>
      <link>${env.NEXT_PUBLIC_SITE_URL}/blog</link>
      <guid>${env.NEXT_PUBLIC_SITE_URL}/blog</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <description><![CDATA[The RSS feed is temporarily unavailable. Please visit our blog directly.]]></description>
    </item>
  </channel>
</rss>`;

    return new Response(fallbackRSS, {
      status: 200, // Return 200 even on error to prevent feed readers from failing
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Shorter cache for fallback
        'X-Cache': 'ERROR',
        'X-Request-ID': requestId,
        'X-Error': error instanceof Error ? error.message : String(error),
      },
    });
  }
}
