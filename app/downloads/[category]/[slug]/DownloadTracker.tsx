'use client';

import { useEffect } from 'react';
import { trackDownload } from '../../../lib/analytics';

interface DownloadTrackerProps {
  downloadId: string;
  category: string;
  slug: string;
}

const DownloadTracker = ({
  downloadId,
  category,
  slug,
}: DownloadTrackerProps) => {
  useEffect(() => {
    // Track page view as a download impression
    trackDownload(downloadId, {
      category,
      slug,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
    });
  }, [downloadId, category, slug]);

  return null; // This component doesn't render anything visible
};

export default DownloadTracker;
