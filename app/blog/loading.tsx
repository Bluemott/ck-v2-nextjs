export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-[#f0f8ff] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="text-center mb-16 animate-pulse">
          <div className="h-24 w-96 bg-gray-200 rounded-lg mx-auto mb-6" />
          <div className="h-12 w-96 bg-gray-200 rounded-lg mx-auto mb-4" />
          <div className="h-6 w-64 bg-gray-200 rounded-lg mx-auto" />
        </div>

        {/* Main Content Skeleton */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Posts Grid Skeleton */}
          <div className="flex-1">
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-lg overflow-hidden break-inside-avoid mb-6 animate-pulse"
                >
                  <div className="w-full h-48 bg-gray-200" />
                  <div className="p-4 sm:p-6">
                    <div className="h-6 bg-gray-200 rounded mb-3" />
                    <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
                    <div className="space-y-2 mb-6">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-5/6" />
                      <div className="h-4 bg-gray-200 rounded w-4/6" />
                    </div>
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="w-full lg:w-80 space-y-8">
            {/* Search Skeleton */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
              <div className="h-12 bg-gray-200 rounded-lg" />
            </div>

            {/* Recent Posts Skeleton */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
              <div className="space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories Skeleton */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 animate-pulse">
              <div className="h-6 w-32 bg-gray-200 rounded mb-6" />
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

