import Link from 'next/link';
import { WPGraphQLPost } from '../lib/wpgraphql';
import { decodeHtmlEntities } from '../lib/wpgraphql';

interface PostNavigationProps {
  previousPost: WPGraphQLPost | null;
  nextPost: WPGraphQLPost | null;
}

export default function PostNavigation({ previousPost, nextPost }: PostNavigationProps) {
  return (
    <div className="space-y-4">
      {/* Next Post Button (on top) */}
      <div className="w-full">
        {nextPost ? (
          <Link
            href={`/blog/${nextPost.slug}`}
            className="group flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 w-full"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
                Next Post
              </p>
              <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors truncate">
                {decodeHtmlEntities(nextPost.title)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg 
                className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </div>
          </Link>
        ) : (
          <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed w-full">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-400">Next Post</p>
              <p className="text-sm font-medium text-gray-400">No next post</p>
            </div>
            <div className="flex-shrink-0">
              <svg 
                className="w-5 h-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Previous Post Button (on bottom) */}
      <div className="w-full">
        {previousPost ? (
          <Link
            href={`/blog/${previousPost.slug}`}
            className="group flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 w-full"
          >
            <div className="flex-shrink-0">
              <svg 
                className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
                Previous Post
              </p>
              <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors truncate">
                {decodeHtmlEntities(previousPost.title)}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed w-full">
            <div className="flex-shrink-0">
              <svg 
                className="w-5 h-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-400">Previous Post</p>
              <p className="text-sm font-medium text-gray-400">No previous post</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 