import { Skeleton } from "./atoms/Skeleton";

export function DashboardSkeleton() {
  return (
    <div>
      {/* KPI Skeletons */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white/70 dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Main Content Skeletons */}
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Fleet Status Skeleton */}
        <div className="bg-white/70 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white/70 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-0">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 border-b border-slate-50 dark:border-slate-800/50 last:border-0"
              >
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
