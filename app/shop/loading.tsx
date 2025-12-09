export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="text-center mb-12 animate-pulse">
          <div className="h-12 w-64 bg-gray-200 rounded-lg mx-auto mb-4" />
          <div className="h-6 w-96 bg-gray-200 rounded-lg mx-auto" />
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse"
            >
              <div className="w-full h-64 bg-gray-200" />
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-3" />
                <div className="h-5 w-24 bg-gray-200 rounded mb-4" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

