import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found - Cowboy Kimono',
  description:
    'The page you are looking for could not be found. Explore our handcrafted western fashion and blog.',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full space-y-8 text-center px-4">
        <div>
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Page Not Found
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            The page may have been moved, deleted, or the URL might be
            incorrect.
          </p>
        </div>

        {/* Popular Pages Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Popular Pages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/"
              className="p-3 rounded-md border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Home</div>
              <div className="text-sm text-gray-500">
                Our handcrafted western fashion
              </div>
            </Link>
            <Link
              href="/blog"
              className="p-3 rounded-md border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Blog</div>
              <div className="text-sm text-gray-500">
                Stories and inspiration
              </div>
            </Link>
            <Link
              href="/shop"
              className="p-3 rounded-md border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Shop</div>
              <div className="text-sm text-gray-500">Browse our collection</div>
            </Link>
            <Link
              href="/downloads"
              className="p-3 rounded-md border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Downloads</div>
              <div className="text-sm text-gray-500">
                Free templates and guides
              </div>
            </Link>
            <Link
              href="/about"
              className="p-3 rounded-md border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="font-medium text-gray-900">About</div>
              <div className="text-sm text-gray-500">Our story and mission</div>
            </Link>
            <Link
              href="/custom-kimonos"
              className="p-3 rounded-md border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Custom Kimonos</div>
              <div className="text-sm text-gray-500">Personalized designs</div>
            </Link>
          </div>
        </div>

        {/* Search Suggestion */}
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-4">
            Looking for something specific? Try searching our blog:
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Browse Blog Posts
          </Link>
        </div>

        {/* Contact Information */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Still can&apos;t find what you&apos;re looking for?{' '}
            <Link
              href="/about"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Contact us
            </Link>{' '}
            and we&apos;ll help you out.
          </p>
        </div>
      </div>
    </div>
  );
}
