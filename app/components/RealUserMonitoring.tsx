'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';

interface RealUserMonitoringProps {
  enabled?: boolean;
}

export default function RealUserMonitoring({
  enabled = true,
}: RealUserMonitoringProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Track page load time
    const trackPageLoad = () => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        const domContentLoaded =
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart;

        // Send to analytics endpoint
        fetch('/api/analytics/web-vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'page-load',
            page: pathname,
            loadTime,
            domContentLoaded,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          }),
        }).catch(console.error);
      }
    };

    // Track Core Web Vitals
    const trackCoreWebVitals = () => {
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            fetch('/api/analytics/web-vitals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'LCP',
                value: lastEntry.startTime,
                page: pathname,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
              }),
            }).catch(console.error);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const perfEntry = entry as PerformanceEventTiming; // Type assertion for PerformanceEventTiming
            fetch('/api/analytics/web-vitals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'FID',
                value: perfEntry.processingStart - perfEntry.startTime,
                page: pathname,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
              }),
            }).catch(console.error);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShift = entry as PerformanceEntry & {
              hadRecentInput: boolean;
              value: number;
            }; // Type assertion for LayoutShift
            if (!layoutShift.hadRecentInput) {
              clsValue += layoutShift.value;
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Report CLS periodically
        setInterval(() => {
          if (clsValue > 0) {
            fetch('/api/analytics/web-vitals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'CLS',
                value: clsValue,
                page: pathname,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
              }),
            }).catch(console.error);
            clsValue = 0; // Reset after reporting
          }
        }, 5000);

        // First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            fetch('/api/analytics/web-vitals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'FCP',
                value: entry.startTime,
                page: pathname,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
              }),
            }).catch(console.error);
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        // Time to First Byte (TTFB)
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        if (navigation) {
          const ttfb = navigation.responseStart - navigation.requestStart;
          fetch('/api/analytics/web-vitals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'TTFB',
              value: ttfb,
              page: pathname,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
            }),
          }).catch(console.error);
        }

        // Interaction to Next Paint (INP) - if supported
        if ('interactionId' in PerformanceEntry.prototype) {
          const inpObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              fetch('/api/analytics/web-vitals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'INP',
                  value: entry.duration,
                  page: pathname,
                  userAgent: navigator.userAgent,
                  timestamp: new Date().toISOString(),
                }),
              }).catch(console.error);
            }
          });
          inpObserver.observe({ entryTypes: ['interaction'] });
        }
      }
    };

    // Track user interactions
    const trackUserInteractions = () => {
      let interactionStartTime = 0;

      const trackInteraction = (type: string) => {
        const now = performance.now();
        const duration = now - interactionStartTime;

        if (duration > 0) {
          fetch('/api/analytics/web-vitals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'user-interaction',
              interactionType: type,
              duration,
              page: pathname,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
            }),
          }).catch(console.error);
        }
      };

      // Track clicks
      document.addEventListener('click', () => {
        interactionStartTime = performance.now();
        setTimeout(() => trackInteraction('click'), 100);
      });

      // Track scroll events
      let scrollTimeout: NodeJS.Timeout;
      document.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => trackInteraction('scroll'), 100);
      });

      // Track form interactions
      document.addEventListener('input', () => {
        interactionStartTime = performance.now();
        setTimeout(() => trackInteraction('input'), 100);
      });
    };

    // Initialize tracking
    trackPageLoad();
    trackCoreWebVitals();
    trackUserInteractions();

    // Cleanup function
    return () => {
      // PerformanceObserver cleanup is automatic
    };
  }, [pathname, enabled]);

  if (!enabled) return null;

  return (
    <Script
      id="rum-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          // Real User Monitoring initialization
          window.addEventListener('load', function() {
            console.log('Real User Monitoring initialized');
          });
        `,
      }}
    />
  );
}
