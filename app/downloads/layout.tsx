import { Metadata } from 'next';
import { generateSEOMetadata } from '../lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: "Downloads",
  description: "Free downloadable resources including sewing patterns, design templates, and care guides for your cowboy kimono collection.",
  keywords: ["free patterns", "sewing templates", "kimono patterns", "download guides", "DIY patterns"],
  canonical: "/downloads",
});

export default function DownloadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
