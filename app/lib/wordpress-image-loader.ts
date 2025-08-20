/**
 * Custom image loader for WordPress images
 * Prevents Next.js from adding suffixes like "-Long" to image URLs
 * Ensures direct access to WordPress API without CloudFront
 */

interface LoaderOptions {
  src: string;
  width: number;
  quality?: number;
}

export function wordpressImageLoader({
  src,
  width: _width,
  quality: _quality,
}: LoaderOptions): string {
  // If it's already a complete WordPress URL, return as-is
  if (src.startsWith('https://api.cowboykimono.com/wp-content/uploads/')) {
    return src;
  }

  // Remove any CloudFront URLs
  if (src.includes('cloudfront.net')) {
    const pathMatch = src.match(/\/wp-content\/uploads\/.*$/);
    if (pathMatch) {
      return `https://api.cowboykimono.com${pathMatch[0]}`;
    }
  }

  // Convert wp-origin URLs to api URLs
  if (src.includes('wp-origin.cowboykimono.com')) {
    return src.replace('wp-origin.cowboykimono.com', 'api.cowboykimono.com');
  }

  // If it's a relative WordPress upload path, make it absolute
  if (src.startsWith('/wp-content/uploads/')) {
    return `https://api.cowboykimono.com${src}`;
  }

  // For any other WordPress image, ensure direct API access
  if (src.includes('/wp-content/uploads/')) {
    const pathMatch = src.match(/\/wp-content\/uploads\/.*$/);
    if (pathMatch) {
      return `https://api.cowboykimono.com${pathMatch[0]}`;
    }
  }

  // Return original URL if not a WordPress image
  return src;
}

/**
 * Check if a URL is a WordPress image
 */
export function isWordPressImage(src: string): boolean {
  return (
    src.includes('/wp-content/uploads/') ||
    src.includes('api.cowboykimono.com') ||
    src.includes('wp-origin.cowboykimono.com')
  );
}
