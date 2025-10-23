'use client';

import { useEffect, useState } from 'react';
import DownloadCard from './DownloadCard';
import DownloadSkeleton from './DownloadSkeleton';
import EmptyState from './EmptyState';

interface FeaturedDownload {
  id: string;
  title: string;
  thumbnail: string;
  downloadUrl: string;
  description?: string;
  type?: string;
  format?: string;
  fileSize?: string;
  difficulty?: string;
  timeEstimate?: string;
  category: string;
  slug: string;
}

interface FeaturedDownloadsProps {
  onDownload?: (_downloadId: string, _title: string) => void;
}

export default function FeaturedDownloads({
  onDownload,
}: FeaturedDownloadsProps) {
  const [featuredDownloads, setFeaturedDownloads] = useState<
    FeaturedDownload[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedDownloads();
  }, []);

  const fetchFeaturedDownloads = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/downloads?featured=true');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch featured downloads');
      }

      // Transform the data to match our component interface
      const downloads =
        data.downloads?.map((download: Record<string, unknown>) => ({
          id: download.id,
          title: download.title,
          thumbnail: download.thumbnail,
          downloadUrl: download.downloadUrl,
          description: download.description,
          type: download.type,
          format: download.format,
          fileSize: download.fileSize,
          difficulty: download.difficulty,
          timeEstimate: download.timeEstimate,
          category: download.category,
          slug: download.slug,
        })) || [];

      setFeaturedDownloads(downloads);
    } catch (err) {
      console.error('Error fetching featured downloads:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load featured downloads'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 serif">
          Featured Downloads
        </h2>
        <DownloadSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 serif">
          Featured Downloads
        </h2>
        <EmptyState
          title="Failed to Load Featured Downloads"
          description={error}
          actionText="Try Again"
          onAction={fetchFeaturedDownloads}
          icon="⚠️"
        />
      </div>
    );
  }

  if (featuredDownloads.length === 0) {
    return null; // Don't show section if no featured downloads
  }

  return (
    <div className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 serif">
          Featured Downloads
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredDownloads.map((download) => (
          <DownloadCard
            key={download.id}
            {...download}
            onDownload={onDownload}
          />
        ))}
      </div>
    </div>
  );
}
