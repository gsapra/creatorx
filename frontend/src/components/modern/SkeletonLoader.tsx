interface SkeletonLoaderProps {
  variant?: 'card' | 'text' | 'circle' | 'stat' | 'list'
  count?: number
}

export default function SkeletonLoader({ variant = 'card', count = 1 }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4" />
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-full mb-1" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        )

      case 'stat':
        return (
          <div className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-20 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
        )

      case 'text':
        return (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        )

      case 'circle':
        return (
          <div className="flex items-center space-x-3 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        )

      case 'list':
        return (
          <div className="bg-white rounded-xl border border-gray-200 divide-y animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  )
}
