'use client';

import Link from 'next/link';

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-9xl font-bold text-gray-300">500</h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Server Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Something went wrong on our end. Please try again.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try again
          </button>
          <div>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go back home
            </Link>
          </div>
        </div>
        <div className="mt-4">
          <Link
            href="/blog"
            className="text-indigo-600 hover:text-indigo-500 text-sm"
          >
            Browse our blog
          </Link>
        </div>
      </div>
    </div>
  );
}
