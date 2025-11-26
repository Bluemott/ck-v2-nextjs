import { Metadata } from 'next';
import Script from 'next/script';
import { blogStructuredData } from '../components/StructuredData';
import { generateSEOMetadata } from '../lib/seo';
// Use SWR-based client for better caching and background revalidation
import BlogClientSWR from './BlogClientSWR';

// ISR: Revalidate every 5 minutes for fresh content
export const revalidate = 300;

export const metadata: Metadata = generateSEOMetadata({
  title: 'Blog',
  description:
    'Discover stories, inspiration, and insights from the world of Cowboy Kimono. Read about our latest designs, craftsmanship techniques, and western fashion trends.',
  keywords: [
    'cowboy kimono blog',
    'western fashion',
    'handcraft stories',
    'design inspiration',
    'artisan techniques',
  ],
  canonical: '/blog',
});

export default function BlogPage() {
  return (
    <>
      {/* Structured Data for Blog - Server-side rendered */}
      <Script
        id="structured-data-blog"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogStructuredData),
        }}
      />
      <BlogClientSWR />
    </>
  );
}
