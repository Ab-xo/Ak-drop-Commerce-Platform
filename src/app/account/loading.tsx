import { ProfileSkeleton } from "@/components/ui/LoadingSpinner";

export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 pt-28 pb-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Header Skeleton */}
        <div className="glass-card p-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary/20 rounded-2xl animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-primary/20 rounded w-64 animate-pulse" />
              <div className="h-4 bg-secondary/50 rounded w-48 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 bg-green-500/20 rounded-full w-24 animate-pulse" />
                <div className="h-6 bg-primary/20 rounded-full w-20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-secondary/50 rounded w-20 animate-pulse" />
                  <div className="h-8 bg-primary/20 rounded w-16 animate-pulse" />
                  <div className="h-3 bg-secondary/30 rounded w-24 animate-pulse" />
                </div>
                <div className="w-10 h-10 bg-primary/20 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Tab Content Skeleton */}
        <div className="glass-card">
          {/* Tab Bar Skeleton */}
          <div className="flex border-b border-border bg-background/30 p-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex-1 p-4">
                <div className="h-4 bg-secondary/50 rounded w-16 mx-auto animate-pulse" />
              </div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="p-8">
            <ProfileSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}