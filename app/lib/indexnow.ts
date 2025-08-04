import { env } from './env';

/**
 * IndexNow Integration for Cowboy Kimono v2
 * 
 * IndexNow is a protocol that allows websites to instantly inform search engines
 * about newly created, updated, or deleted web pages. This helps search engines
 * discover and index content faster.
 * 
 * Supported search engines: Google, Bing, Yandex, and others
 */

interface IndexNowSubmission {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

interface IndexNowResponse {
  success: boolean;
  message: string;
  statusCode?: number;
}

interface IndexNowConfig {
  isConfigured: boolean;
  key: string;
  host: string;
  keyLocation: string | null;
  endpoints: string[];
  keyFileAccessible?: boolean;
}

// IndexNow endpoints for different search engines
// Note: Google's IndexNow endpoint may be temporarily unavailable
// We'll use alternative endpoints or focus on Bing and Yandex
const INDEXNOW_ENDPOINTS = {
  google: 'https://www.google.com/indexnow',
  bing: 'https://www.bing.com/indexnow',
  yandex: 'https://yandex.com/indexnow',
  // Add more search engines as needed
};

/**
 * Validate IndexNow key file accessibility
 * @param key - IndexNow key
 * @param host - Domain host
 * @returns Promise<boolean>
 */
async function validateKeyFileAccessibility(key: string, host: string): Promise<boolean> {
  try {
    const keyFileUrl = `${host}/${key}.txt`;
    const response = await fetch(keyFileUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.warn('Key file validation failed:', error);
    return false;
  }
}

/**
 * Submit URLs to IndexNow for faster indexing
 * @param urls - Array of URLs to submit
 * @param searchEngines - Array of search engines to submit to (default: all)
 * @returns Promise<IndexNowResponse>
 */
export async function submitToIndexNow(
  urls: string[],
  searchEngines: (keyof typeof INDEXNOW_ENDPOINTS)[] = ['bing']
): Promise<IndexNowResponse> {
  const key = process.env.NEXT_PUBLIC_INDEXNOW_KEY || process.env.INDEXNOW_KEY;
  const host = env.NEXT_PUBLIC_SITE_URL;
  
  if (!key) {
    return {
      success: false,
      message: 'IndexNow key not configured. Please set NEXT_PUBLIC_INDEXNOW_KEY environment variable.'
    };
  }

  if (urls.length === 0) {
    return {
      success: false,
      message: 'No URLs provided for submission.'
    };
  }

  // Validate URLs
  const validUrls = urls.filter(url => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === new URL(host).hostname;
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) {
    return {
      success: false,
      message: 'No valid URLs found for submission.'
    };
  }

  const submission: IndexNowSubmission = {
    host: new URL(host).hostname,
    key,
    keyLocation: `${host}/${key}.txt`,
    urlList: validUrls
  };

  // Submit to each search engine
  const results = await Promise.allSettled(
    searchEngines.map(async (engine) => {
      const endpoint = INDEXNOW_ENDPOINTS[engine];
      if (!endpoint) {
        throw new Error(`Unsupported search engine: ${engine}`);
      }
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'CowboyKimono-IndexNow/1.0',
          },
          body: JSON.stringify(submission),
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(15000), // 15 second timeout
        });
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          
          // Handle specific error cases
          if (engine === 'google' && response.status === 404) {
            throw new Error(`${engine} IndexNow endpoint is currently unavailable (404). Google may have temporarily disabled their IndexNow service.`);
          }
          
          if (engine === 'bing' && response.status === 422) {
            // Provide more detailed error information for Bing 422 errors
            const errorDetails = errorText || 'No error details provided';
            throw new Error(`${engine} rejected the submission (422). This may be due to:
- Invalid URL format or domain mismatch
- Rate limiting (too many submissions)
- Invalid key format or key file not accessible
- URLs not from the configured domain
Error details: ${errorDetails}`);
          }
          
          throw new Error(`${engine} returned status ${response.status}: ${errorText}`);
        }

        return { engine, success: true };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`${engine} submission timed out after 15 seconds`);
        }
        throw new Error(`${engine} submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    })
  );

  // Process results
  const successful = results.filter(result => result.status === 'fulfilled');
  const failed = results.filter(result => result.status === 'rejected');

  if (successful.length === 0) {
    return {
      success: false,
      message: `All IndexNow submissions failed: ${failed.map(f => (f as PromiseRejectedResult).reason).join(', ')}`
    };
  }

  const successMessage = `Successfully submitted ${validUrls.length} URLs to ${successful.length} search engine(s)`;
  const failureMessage = failed.length > 0 ? ` Failed: ${failed.map(f => (f as PromiseRejectedResult).reason).join(', ')}` : '';

  return {
    success: true,
    message: successMessage + failureMessage,
    statusCode: 200
  };
}

/**
 * Submit a single URL to IndexNow
 * @param url - URL to submit
 * @param searchEngines - Array of search engines to submit to
 * @returns Promise<IndexNowResponse>
 */
export async function submitUrlToIndexNow(
  url: string,
  searchEngines: (keyof typeof INDEXNOW_ENDPOINTS)[] = ['bing']
): Promise<IndexNowResponse> {
  return submitToIndexNow([url], searchEngines);
}

/**
 * Submit WordPress blog post URL to IndexNow
 * @param slug - WordPress post slug
 * @param searchEngines - Array of search engines to submit to
 * @returns Promise<IndexNowResponse>
 */
export async function submitWordPressPostToIndexNow(
  slug: string,
  searchEngines: (keyof typeof INDEXNOW_ENDPOINTS)[] = ['bing']
): Promise<IndexNowResponse> {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  const url = `${baseUrl}/blog/${slug}`;
  return submitUrlToIndexNow(url, searchEngines);
}

/**
 * Submit WordPress category URL to IndexNow
 * @param slug - WordPress category slug
 * @param searchEngines - Array of search engines to submit to
 * @returns Promise<IndexNowResponse>
 */
export async function submitWordPressCategoryToIndexNow(
  slug: string,
  searchEngines: (keyof typeof INDEXNOW_ENDPOINTS)[] = ['bing']
): Promise<IndexNowResponse> {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  const url = `${baseUrl}/blog/category/${slug}`;
  return submitUrlToIndexNow(url, searchEngines);
}

/**
 * Submit WordPress tag URL to IndexNow
 * @param slug - WordPress tag slug
 * @param searchEngines - Array of search engines to submit to
 * @returns Promise<IndexNowResponse>
 */
export async function submitWordPressTagToIndexNow(
  slug: string,
  searchEngines: (keyof typeof INDEXNOW_ENDPOINTS)[] = ['bing']
): Promise<IndexNowResponse> {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  const url = `${baseUrl}/blog/tag/${slug}`;
  return submitUrlToIndexNow(url, searchEngines);
}

/**
 * Submit multiple WordPress URLs to IndexNow
 * @param urls - Array of WordPress URLs (posts, categories, tags)
 * @param searchEngines - Array of search engines to submit to
 * @returns Promise<IndexNowResponse>
 */
export async function submitWordPressUrlsToIndexNow(
  urls: string[],
  searchEngines: (keyof typeof INDEXNOW_ENDPOINTS)[] = ['bing']
): Promise<IndexNowResponse> {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;
  
  // Ensure URLs are absolute
  const absoluteUrls = urls.map(url => {
    if (url.startsWith('http')) {
      return url;
    }
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  });

  return submitToIndexNow(absoluteUrls, searchEngines);
}

/**
 * Get IndexNow configuration status
 * @returns Object with configuration status
 */
export async function getIndexNowConfig(): Promise<IndexNowConfig> {
  const key = process.env.NEXT_PUBLIC_INDEXNOW_KEY || process.env.INDEXNOW_KEY;
  const host = env.NEXT_PUBLIC_SITE_URL;
  
  const config: IndexNowConfig = {
    isConfigured: !!key,
    key: key ? `${key.substring(0, 8)}...` : 'Not set',
    host,
    keyLocation: key ? `${host}/${key}.txt` : null,
    endpoints: Object.keys(INDEXNOW_ENDPOINTS)
  };

  // Validate key file accessibility if key is configured
  if (key) {
    try {
      config.keyFileAccessible = await validateKeyFileAccessibility(key, host);
    } catch (error) {
      console.warn('Key file validation failed:', error);
      config.keyFileAccessible = false;
    }
  }

  return config;
}

/**
 * Validate IndexNow key format
 * @param key - IndexNow key to validate
 * @returns boolean
 */
export function validateIndexNowKey(key: string): boolean {
  // IndexNow keys should be 8-128 characters long and contain only alphanumeric characters
  return /^[a-zA-Z0-9]{8,128}$/.test(key);
} 