import { NextResponse } from 'next/server';

interface EtsyProduct {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
  image?: string;
  price?: string;
}

export async function GET() {
  try {
    const ETSY_SHOP_NAME = 'CowboyKimono';
    const RSS_URL = `https://www.etsy.com/shop/${ETSY_SHOP_NAME}/rss`;

    // Fetch RSS feed server-side to avoid CORS issues
    const response = await fetch(RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CowboyKimono/1.0)',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const rssText = await response.text();

    // Parse XML using DOMParser (available in Node.js 18+)
    const { DOMParser } = await import('xmldom');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rssText, 'text/xml');

    const items = xmlDoc.getElementsByTagName('item');
    const parsedProducts: EtsyProduct[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item) continue;

      const title = item.getElementsByTagName('title')[0]?.textContent || '';
      const link = item.getElementsByTagName('link')[0]?.textContent || '';
      let description =
        item.getElementsByTagName('description')[0]?.textContent || '';
      const pubDate =
        item.getElementsByTagName('pubDate')[0]?.textContent || '';
      const guid = item.getElementsByTagName('guid')[0]?.textContent || '';

      // Decode HTML entities
      description = description
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

      // Extract image from description (Etsy includes images in CDATA)
      const imageMatch = description.match(/<img[^>]+src="([^"]+)"/);
      const image = imageMatch ? imageMatch[1] : '';

      // Extract price from description (Etsy includes price at the beginning)
      const priceMatch = description.match(/^([\d,]+\.?\d*)USD/);
      const price = priceMatch ? `$${priceMatch[1]}` : '';

      parsedProducts.push({
        title: title.replace(/\s*-\s*\$[\d,]+\.?\d*/, ''), // Remove price from title
        link,
        description: description
          .replace(/^[\d,]+\.?\d*USD/, '')
          .replace(/<[^>]*>/g, ''), // Remove price and strip HTML
        pubDate,
        guid,
        image,
        price,
      });
    }

    return NextResponse.json({
      success: true,
      products: parsedProducts,
      count: parsedProducts.length,
    });
  } catch (error) {
    console.error('Error fetching Etsy products:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products from Etsy',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
