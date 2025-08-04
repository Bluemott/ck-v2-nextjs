import { Metadata } from 'next';
import { generateSEOMetadata } from '../lib/seo';
import ShopClient from './ShopClient';
import StructuredData from '../components/StructuredData';

export const metadata: Metadata = generateSEOMetadata({
  title: "Shop",
  description: "Shop our unique collection of handcrafted cowboy kimonos, western-inspired robes, and artistic apparel. Each piece is carefully crafted with attention to detail and artistic flair.",
  keywords: ["cowboy kimono shop", "handcrafted robes", "western apparel", "artistic clothing", "unique fashion", "etsy shop"],
  canonical: "/shop",
});

export default function ShopPage() {
  return (
    <>
      <StructuredData
        type="WebSite"
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Cowboy Kimono Shop',
          url: 'https://www.cowboykimono.com/shop',
          description: 'Shop our unique collection of handcrafted cowboy kimonos and western-inspired apparel',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://www.cowboykimono.com/shop?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        }}
      />
      <div className="pt-16">
        <ShopClient />
      </div>
    </>
  );
}
