import { Metadata } from 'next';
import { generateSEOMetadata } from '../lib/seo';
import DownloadsClient from './DownloadsClient';

export const metadata: Metadata = generateSEOMetadata({
  title: "Downloads",
  description: "Free downloadable resources from Cowboy Kimono - coloring pages, craft templates, and DIY tutorials. Enhance your western fashion experience with our free patterns and guides.",
  keywords: ["free downloads", "coloring pages", "craft templates", "DIY tutorials", "western patterns", "cowboy kimono resources"],
  canonical: "/downloads",
});

export default function DownloadsPage() {
  return <DownloadsClient />;
}
