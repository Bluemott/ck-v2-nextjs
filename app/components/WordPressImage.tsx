'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getFeaturedImageUrl, getFeaturedImageAlt, type WPGraphQLPost } from '../lib/api';

interface WordPressImageProps {
  post: WPGraphQLPost;
  size?: 'thumbnail' | 'medium' | 'large' | 'full';
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  alt?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

const WordPressImage = ({ 
  post, 
  size = 'medium', 
  className = '', 
  fill = false,
  width,
  height,
  priority = false,
  sizes,
  alt,
  objectFit = 'cover'
}: WordPressImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const imageUrl = getFeaturedImageUrl(post, size);
  const imageAlt = alt || getFeaturedImageAlt(post);

  // If no image URL or error occurred, show placeholder
  if (!imageUrl || imageError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
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
    setImageError(true);
    setImageLoading(false);
  };

  const handleLoad = () => {
    setImageLoading(false);
  };

  return (
    <>
      {fill ? (
        <>
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className={`object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
            sizes={sizes}
            priority={priority}
            onError={handleError}
            onLoad={handleLoad}
          />
          {/* Loading indicator */}
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            </div>
          )}
        </>
      ) : (
        <div className={`relative ${imageLoading ? 'bg-gray-200 animate-pulse' : ''} ${className}`}>
          <Image
            src={imageUrl}
            alt={imageAlt}
            width={width || 400}
            height={height || 300}
            className={`object-${objectFit} transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            sizes={sizes}
            priority={priority}
            onError={handleError}
            onLoad={handleLoad}
          />
          
          {/* Loading indicator */}
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default WordPressImage; 