export default function BlogPostLoading() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
          <div className="h-12 bg-gray-200 rounded-lg mb-4" />
          <div className="h-6 w-48 bg-gray-200 rounded" />
        </div>

        {/* Featured Image Skeleton */}
        <div className="mb-8 animate-pulse">
          <div className="w-full h-96 bg-gray-200 rounded-lg" />
        </div>

        {/* Content Skeleton */}
        <div className="prose max-w-none animate-pulse">
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </div>

        {/* Sidebar Skeleton */}
        <div className="mt-12 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

