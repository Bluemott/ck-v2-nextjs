// Google Analytics tracking utilities

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

interface CustomEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

// Track page views
export const trackPageView = (url: string, title: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
      page_title: title,
      page_location: url,
    });
  }
};

// Track custom events
export const trackEvent = ({ action, category, label, value }: CustomEvent) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
};

// Pre-defined tracking functions for common events
export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent({
    action: 'click',
    category: 'Button',
    label: `${buttonName} - ${location}`,
  });
};

export const trackNavigation = (destination: string, source: string) => {
  trackEvent({
    action: 'navigate',
    category: 'Navigation',
    label: `${source} to ${destination}`,
  });
};

export const trackProductView = (productName: string, productId?: string) => {
  trackEvent({
    action: 'view_item',
    category: 'Product',
    label: productName,
    value: productId ? parseInt(productId) : undefined,
  });
};

export const trackBlogPostView = (postTitle: string) => {
  trackEvent({
    action: 'view_item',
    category: 'Blog',
    label: postTitle,
  });
};

export const trackExternalLink = (url: string, linkText: string) => {
  trackEvent({
    action: 'click',
    category: 'External Link',
    label: `${linkText} - ${url}`,
  });
};

export const trackSocialMediaClick = (platform: string, location: string) => {
  trackEvent({
    action: 'click',
    category: 'Social Media',
    label: `${platform} - ${location}`,
  });
};

export const trackFormSubmission = (formName: string, success: boolean) => {
  trackEvent({
    action: success ? 'submit_success' : 'submit_error',
    category: 'Form',
    label: formName,
  });
};

export const trackSearch = (searchTerm: string, resultCount: number) => {
  trackEvent({
    action: 'search',
    category: 'Search',
    label: searchTerm,
    value: resultCount,
  });
};
