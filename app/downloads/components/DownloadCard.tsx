'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface DownloadCardProps {
  id: string;
  title: string;
  thumbnail: string;
  downloadUrl: string;
  description?: string;
  type?: string;
  format?: string;
  fileSize?: string;
  difficulty?: string;
  timeEstimate?: string;
  featured?: boolean;
  downloadCount?: number;
  category: string;
  slug: string;
  onDownload?: (_downloadId: string, _title: string) => void;
}

// Decode HTML entities like &#8217; to actual characters
function decodeHtmlEntities(text: string): string {
  if (typeof window !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }
  // Server-side fallback for common entities
  return text
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");
}

// Normalize thumbnail URL to ensure it's valid
function normalizeThumbnailUrl(url: string): string {
  if (!url || url === '/images/placeholder.svg') return url;
  
  // If it's already a full URL, ensure HTTPS
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  // If it's a relative URL from WordPress, add the domain
  if (url.startsWith('/wp-content/')) {
    return `https://api.cowboykimono.com${url}`;
  }
  
  return url;
}

export default function DownloadCard({
  id,
  title,
  thumbnail,
  downloadUrl,
  description,
  type,
  format,
  fileSize,
  difficulty,
  timeEstimate,
  category,
  slug,
  onDownload,
}: DownloadCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Decode title and normalize thumbnail
  const decodedTitle = decodeHtmlEntities(title);
  const normalizedThumbnail = normalizeThumbnailUrl(thumbnail);

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();

    // Track the download
    if (onDownload) {
      onDownload(id, title);
    }

    // Actually trigger the download
    if (downloadUrl && downloadUrl !== '#') {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = decodedTitle; // Set the filename for download
      link.target = '_blank'; // Open in new tab as fallback
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group">
      {/* Thumbnail */}
      <div className="aspect-[4/3] relative bg-gray-100 overflow-hidden">
        {!imageError && normalizedThumbnail && normalizedThumbnail !== '/images/placeholder.svg' ? (
          <Image
            src={normalizedThumbnail}
            alt={decodedTitle}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => setImageError(true)}
            unoptimized={normalizedThumbnail.includes('api.cowboykimono.com')}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-2xl font-medium">
              {type === 'blog-post' ? '📖' : '📄'}
            </span>
          </div>
        )}
        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-3">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-[#1e2939] transition-colors duration-300 serif">
          {decodedTitle}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* File Info */}
        <div className="flex flex-wrap gap-1">
          {format && (
            <span className="inline-flex items-center space-x-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
              <span>{format}</span>
            </span>
          )}
          {fileSize && (
            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
              {fileSize}
            </span>
          )}
          {difficulty && (
            <span
              className={`text-xs px-2 py-1 rounded ${getDifficultyColor(difficulty)}`}
            >
              {difficulty}
            </span>
          )}
          {timeEstimate && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
              {timeEstimate}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2 pt-3">
          {/* View Details Button - Only show for non-blog-post downloads */}
          {type !== 'blog-post' && (
            <Link
              href={`/downloads/${category}/${slug}`}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg transition-colors text-center"
            >
              View Details
            </Link>
          )}

          {/* Download/Read Button */}
          {downloadUrl && downloadUrl !== '#' ? (
            type === 'blog-post' ? (
              <Link
                href={downloadUrl}
                className="w-full bg-[#1e2939] hover:bg-[#2a3441] text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors text-center"
                onClick={() => {
                  if (onDownload) {
                    onDownload(id, title);
                  }
                }}
              >
                Read Post
              </Link>
            ) : (
              <button
                onClick={handleDownload}
                className="w-full bg-[#1e2939] hover:bg-[#2a3441] text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Download
              </button>
            )
          ) : (
            <div className="w-full bg-gray-300 text-gray-600 text-sm font-medium py-2 px-4 rounded-lg text-center">
              Coming Soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
