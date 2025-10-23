import { DownloadStats, DownloadTrackingData } from './types/wordpress';

// Function to track a single download event
export async function trackDownload(
  downloadId: string,
  data: Omit<DownloadTrackingData, 'timestamp' | 'ipHash' | 'downloadId'>
): Promise<void> {
  try {
    const trackingData: DownloadTrackingData = {
      downloadId,
      category: data.category || 'unknown',
      slug: data.slug || '',
      timestamp: new Date().toISOString(),
      ipHash: await hashIP(data.userAgent || ''),
      userAgent: data.userAgent,
      referrer: data.referrer,
      deviceType: getDeviceType(data.userAgent || ''),
      country: data.country,
    };

    // Send tracking data to API
    await fetch('/api/downloads/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData),
    });

    console.warn('Download tracked:', downloadId);
  } catch (error) {
    console.error('Failed to track download:', error);
    // Don't throw error to avoid breaking the download flow
  }
}

// Function to get overall download analytics
export async function getDownloadAnalytics(): Promise<DownloadStats> {
  try {
    const response = await fetch('/api/downloads/analytics');
    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to get download analytics:', error);
    return {
      totalDownloads: 0,
      downloadsThisMonth: 0,
      mostPopular: [],
      downloadsByCategory: {},
      recentDownloads: [],
    };
  }
}

// Function to get individual download analytics
export async function getIndividualDownloadAnalytics(
  downloadId: string
): Promise<Record<string, unknown>> {
  try {
    const response = await fetch(`/api/downloads/analytics/${downloadId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch individual analytics');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to get individual download analytics:', error);
    return {
      downloadCount: 0,
      lastDownloaded: null,
      popularityScore: 0,
      downloadsByDate: {},
      downloadsByCountry: {},
      downloadsByDevice: {},
    };
  }
}

// Helper function to hash IP for privacy
async function hashIP(userAgent: string): Promise<string> {
  // Simple hash function for demo purposes
  // In production, you'd want to use a proper hashing algorithm
  const encoder = new TextEncoder();
  const data = encoder.encode(userAgent + Date.now().toString());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 16);
}

// Helper function to determine device type
function getDeviceType(userAgent: string): string {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();
  if (
    ua.includes('mobile') ||
    ua.includes('android') ||
    ua.includes('iphone')
  ) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

// Function to track page views (for download impressions)
export async function trackPageView(
  pageUrl: string,
  pageTitle: string,
  additionalData?: Record<string, unknown>
): Promise<void> {
  try {
    const trackingData = {
      pageUrl,
      pageTitle,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      ...additionalData,
    };

    // Send to analytics API
    await fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData),
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
}

// Function to track user interactions
export async function trackInteraction(
  interactionType: string,
  elementId: string,
  additionalData?: Record<string, unknown>
): Promise<void> {
  try {
    const trackingData = {
      interactionType,
      elementId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...additionalData,
    };

    // Send to analytics API
    await fetch('/api/analytics/interaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData),
    });
  } catch (error) {
    console.error('Failed to track interaction:', error);
  }
}

// Function to get download statistics for a specific time period
export async function getDownloadStats(
  startDate: string,
  endDate: string
): Promise<{
  totalDownloads: number;
  downloadsByDate: Record<string, number>;
  topDownloads: Array<{ id: string; title: string; count: number }>;
}> {
  try {
    const response = await fetch(
      `/api/downloads/analytics?startDate=${startDate}&endDate=${endDate}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch download stats');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to get download stats:', error);
    return {
      totalDownloads: 0,
      downloadsByDate: {},
      topDownloads: [],
    };
  }
}

// Function to track download completion
export async function trackDownloadCompletion(
  downloadId: string,
  fileSize?: number,
  downloadTime?: number
): Promise<void> {
  try {
    const trackingData = {
      downloadId,
      fileSize,
      downloadTime,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    await fetch('/api/downloads/track/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingData),
    });
  } catch (error) {
    console.error('Failed to track download completion:', error);
  }
}
