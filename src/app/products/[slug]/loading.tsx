export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center space-x-2">
          <div className="h-4 w-10 rounded bg-earth-700"  />
          <div className="h-4 w-2 rounded bg-earth-700"  />
          <div className="h-4 w-16 rounded bg-earth-700"  />
          <div className="h-4 w-2 rounded bg-earth-700"  />
          <div className="h-4 w-32 rounded bg-earth-700"  />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image skeleton */}
          <div className="aspect-square rounded bg-earth-800"  />

          {/* Info skeleton */}
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded bg-earth-700"  />
            <div className="h-6 w-1/4 rounded bg-earth-700"  />
            <div className="h-4 w-full rounded bg-earth-700"  />
            <div className="h-4 w-5/6 rounded bg-earth-700"  />
            <div className="h-4 w-4/6 rounded bg-earth-700"  />
            <div className="h-12 w-full rounded bg-earth-700"  />
          </div>
        </div>
      </div>
    </div>
  )
}
