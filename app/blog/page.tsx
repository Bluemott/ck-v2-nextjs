import { Metadata } from 'next';
import { generateSEOMetadata } from '../lib/seo';
import BlogClient from './BlogClient';

export const metadata: Metadata = generateSEOMetadata({
  title: "Blog",
  description: "Discover stories, inspiration, and insights from the world of Cowboy Kimono. Read about our latest designs, craftsmanship techniques, and western fashion trends.",
  keywords: ["cowboy kimono blog", "western fashion", "handcraft stories", "design inspiration", "artisan techniques"],
  canonical: "/blog",
});

export default function BlogPage() {
  return <BlogClient />;
}
