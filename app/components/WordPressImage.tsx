'use client';

import { useEffect, useState } from 'react';
import {
  fetchMediaById,
  getFeaturedImageAlt,
  getFeaturedImageUrl,
  type BlogPost,
} from '../lib/api';
import OptimizedImage from './OptimizedImage';

interface WordPressImageProps {
  post: BlogPost;
  size?: 'thumbnail' | 'medium' | 'large' | 'full';
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  alt?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const WordPressImage = ({
  post,
  className = '',
  fill = false,
  width,
  height,
  priority = false,
  sizes,
  alt,
  objectFit = 'cover',
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
}: WordPressImageProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageAlt, setImageAlt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const extractImageData = async () => {
      if (!post || !post.id) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);

        // First try to get image from embedded data
        let url = getFeaturedImageUrl(post);
        let altText = alt || getFeaturedImageAlt(post);

        // If no URL but post has featured_media ID, try to fetch it
        if (!url && post.featured_media && post.featured_media > 0) {
          try {
            const mediaData = await fetchMediaById(post.featured_media);
            if (mediaData && mediaData.source_url) {
              url = mediaData.source_url;
              altText = mediaData.alt_text || post.title?.rendered || '';
            }
          } catch (error) {
            console.error(
              'WordPressImage - Failed to fetch media data:',
              error
            );
          }
        }

        // Validate image URL
        if (!url || typeof url !== 'string' || url.trim() === '') {
          console.warn('WordPressImage - No valid image URL found:', {
            postId: post.id,
            postTitle: post.title?.rendered,
            imageUrl: url,
          });
          setHasError(true);
        } else {
          setImageUrl(url);
          setImageAlt(altText);
        }
      } catch (error) {
        console.error('WordPressImage - Error extracting image data:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    extractImageData();
  }, [post, alt]);

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={{
          minHeight: fill ? '100%' : height || 300,
          width: fill ? '100%' : width || 'auto',
        }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  // If no image URL or error occurred, show placeholder
  if (!imageUrl || hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{
          minHeight: fill ? '100%' : height || 300,
          width: fill ? '100%' : width || 'auto',
        }}
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const handleError = () => {
    console.warn('WordPressImage - Image failed to load:', {
      imageUrl,
      postId: post?.id,
      postTitle: post?.title?.rendered,
    });
    setHasError(true);
    onError?.();
  };

  const handleLoad = () => {
    onLoad?.();
  };

  return (
    <OptimizedImage
      src={imageUrl}
      alt={imageAlt}
      width={width || 400}
      height={height || 300}
      className={className}
      fill={fill}
      priority={priority}
      sizes={sizes}
      objectFit={objectFit}
      quality={quality}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};

export default WordPressImage;
