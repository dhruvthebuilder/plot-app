export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Nav skeleton */}
      <div className="h-[52px] bg-surface border-b border-border flex items-center px-5 gap-3">
        <div className="w-20 h-5 bg-border rounded animate-pulse" />
        <div className="flex-1" />
        <div className="w-16 h-6 bg-border rounded-full animate-pulse" />
        <div className="w-20 h-7 bg-border rounded-[8px] animate-pulse" />
        <div className="w-24 h-7 bg-border rounded-[8px] animate-pulse" />
      </div>

      <div className="flex flex-1">
        {/* Sidebar skeleton */}
        <div className="w-[220px] min-w-[220px] bg-surface border-r border-border p-3.5 flex flex-col gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-9 bg-border rounded-[8px] animate-pulse" />
          ))}
          <div className="mt-auto pt-3">
            <div className="bg-bg rounded-[8px] p-2.5">
              <div className="w-16 h-2.5 bg-border rounded animate-pulse mb-2" />
              <div className="h-1 bg-border rounded-full" />
              <div className="w-12 h-2 bg-border rounded animate-pulse mt-1.5" />
            </div>
          </div>
        </div>

        {/* Main skeleton */}
        <div className="flex-1 p-7">
          <div className="flex items-center justify-between mb-6">
            <div className="w-40 h-7 bg-border rounded animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="w-24 h-4 bg-border rounded animate-pulse" />
              <div className="w-28 h-8 bg-border rounded-[8px] animate-pulse" />
            </div>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {/* New chart placeholder */}
            <div className="border-2 border-dashed border-border rounded-lg h-[210px] animate-pulse" />
            {/* Chart card skeletons */}
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="h-[130px] bg-border animate-pulse" />
                <div className="px-3.5 py-3 border-t border-border flex flex-col gap-1.5">
                  <div className="h-3.5 w-3/4 bg-border rounded animate-pulse" />
                  <div className="h-2.5 w-1/2 bg-border rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
