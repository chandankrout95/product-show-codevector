/**
 * Animated skeleton card for loading states.
 * Mimics the ProductCard layout with shimmer animation.
 */
function Skeleton() {
  return (
    <div className="rounded-xl border border-surface-600 bg-surface-800 p-5">
      {/* Title skeleton */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="skeleton-shimmer mb-2 h-4 w-3/4 rounded-md" />
          <div className="skeleton-shimmer h-4 w-1/2 rounded-md" />
        </div>
        <div className="skeleton-shimmer h-6 w-16 shrink-0 rounded-md" />
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between">
        <div className="skeleton-shimmer h-6 w-24 rounded-full" />
        <div className="skeleton-shimmer h-4 w-20 rounded-md" />
      </div>
    </div>
  );
}

export default Skeleton;
