'use client';

import { useState, useEffect } from 'react';

interface SimpleImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  fallbackSrc?: string;
}

const SimpleImage = ({
  src,
  alt,
  width,
  height,
  fill,
  className = '',
  priority = false,
  objectFit = 'cover',
  fallbackSrc = '/images/placeholder.svg'
}: SimpleImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      setHasError(false); // Reset error state when trying fallback
    } else {
      setHasError(true); // Only set error if fallback also fails
    }
  };

  // Use effect to reset state when src changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setImgSrc(src);
  }, [src]);

  const imgStyle = fill 
    ? { 
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: objectFit
      } 
    : { 
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
        maxWidth: '100%',
        objectFit: objectFit
      };

  return (
    <div className={fill ? "relative w-full h-full" : "relative"}>
      {/* Loading placeholder */}
      {isLoading && (
        <div 
          className={`${fill ? 'absolute inset-0' : ''} bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
          style={fill ? {} : { width: width ? `${width}px` : '100%', height: height ? `${height}px` : '200px' }}
        >
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Actual image using standard HTML img tag */}
      <img
        src={imgSrc}
        alt={alt || ''}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        style={imgStyle}
        loading={priority ? 'eager' : 'lazy'}
      />

      {/* Error state */}
      {hasError && imgSrc === fallbackSrc && (
        <div 
          className={`${fill ? 'absolute inset-0' : ''} bg-gray-100 flex items-center justify-center ${className}`}
          style={fill ? {} : { width: width ? `${width}px` : '100%', height: height ? `${height}px` : '200px' }}
        >
          <div className="text-center text-gray-500">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs">Image not available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleImage;
