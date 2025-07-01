import { Metadata } from 'next';
import { generateSEOMetadata } from '../lib/seo';
import BlogClient from './BlogClient';
import StructuredData, { blogStructuredData } from '../components/StructuredData';

export const metadata: Metadata = generateSEOMetadata({
  title: "Blog",
  description: "Discover stories, inspiration, and insights from the world of Cowboy Kimonos. Read about our latest designs, craftsmanship techniques, and western fashion trends.",
  keywords: ["cowboy kimono blog", "western fashion", "handcraft stories", "design inspiration", "artisan techniques"],
  canonical: "/blog",
});

export default function BlogPage() {
  return (
    <>
      <StructuredData type="WebSite" data={blogStructuredData} />
      <BlogClient />
    </>
  );
}
