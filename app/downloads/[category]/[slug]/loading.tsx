export default function DownloadPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c5e8f9] to-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>

        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg mb-4" />
          <div className="h-6 w-96 bg-gray-200 rounded" />
        </div>

        {/* Image Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="w-full h-96 bg-gray-200 rounded-lg" />
        </div>

        {/* Content Skeleton */}
        <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse">
          <div className="space-y-4 mb-8">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>

          {/* Download Button Skeleton */}
          <div className="h-12 w-48 bg-gray-200 rounded-lg" />
        </div>

        {/* Related Downloads Skeleton */}
        <div className="mt-12 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="w-full h-32 bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

