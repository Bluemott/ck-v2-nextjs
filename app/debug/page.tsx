'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [gaLoaded, setGaLoaded] = useState(false);
  const [dataLayerEvents, setDataLayerEvents] = useState<unknown[]>([]);

  useEffect(() => {
    // Check if Google Analytics is loaded
    const checkGA = () => {
      if (typeof window !== 'undefined') {
        setGaLoaded(!!window.gtag);
        
        // Monitor dataLayer events
        if (window.dataLayer) {
          setDataLayerEvents([...window.dataLayer]);
        }
      }
    };

    checkGA();
    
    // Check every second for the first 10 seconds
    const interval = setInterval(checkGA, 1000);
    setTimeout(() => clearInterval(interval), 10000);

    return () => clearInterval(interval);
  }, []);

  const testEvent = () => {
    if (window.gtag) {
      window.gtag('event', 'test_event', {
        event_category: 'debug',
        event_label: 'manual_test',
        value: 1
      });
      alert('Test event sent! Check your Google Analytics Real-time reports.');
    } else {
      alert('Google Analytics not loaded yet!');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Google Analytics Debug Page</h1>
      
      <div className="grid gap-6">
        {/* GA Status */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Analytics Status</h2>
          <div className="space-y-2">
            <p>
              <strong>GA Measurement ID:</strong> {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'Not set'}
            </p>
            <p>
              <strong>Google Verification:</strong> {process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || 'Not set'}
            </p>
            <p>
              <strong>Site URL:</strong> {process.env.NEXT_PUBLIC_SITE_URL || 'Not set'}
            </p>
            <p className={`font-semibold ${gaLoaded ? 'text-green-600' : 'text-red-600'}`}>
              <strong>GA Loaded:</strong> {gaLoaded ? '✅ Yes' : '❌ No'}
            </p>
          </div>
        </div>

        {/* Test Button */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Analytics</h2>
          <button
            onClick={testEvent}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={!gaLoaded}
          >
            Send Test Event
          </button>
          <p className="text-sm text-gray-600 mt-2">
            This will send a test event to Google Analytics. Check your Real-time reports to see if it appears.
          </p>
        </div>

        {/* DataLayer Info */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">DataLayer Events ({dataLayerEvents.length})</h2>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-auto">
            <pre className="text-sm">
              {JSON.stringify(dataLayerEvents, null, 2)}
            </pre>
          </div>
        </div>

        {/* Verification Instructions */}
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">Verification Steps</h2>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700">
            <li>Make sure your Google Analytics GA4 property is set up</li>
            <li>Check that your Measurement ID (G-VYVT6J7XLS) is correct in your GA4 property</li>
            <li>Verify the verification file is accessible at: <a href="/googlef57ab1d1c14fa1e3.html" target="_blank" className="underline">/googlef57ab1d1c14fa1e3.html</a></li>
            <li>Check Google Search Console for verification status</li>
            <li>Use browser dev tools Network tab to see if gtag requests are being made</li>
            <li>Check Real-time reports in Google Analytics after clicking the test button</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
