import { useEffect, useRef } from 'react';

/**
 * Invisible sentinel element that triggers pagination via IntersectionObserver.
 * When this element enters the viewport, it calls onIntersect to load more products.
 */
function LoadMoreSentinel({ onIntersect, isLoading }) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onIntersect();
        }
      },
      {
        rootMargin: '200px',  // trigger 200px before the element is visible
        threshold: 0,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [onIntersect, isLoading]);

  return (
    <div ref={sentinelRef} className="flex w-full items-center justify-center py-6">
      {isLoading && (
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-500 animate-pulse-glow" style={{ animationDelay: '0ms' }} />
            <span className="inline-block h-2 w-2 rounded-full bg-accent-500 animate-pulse-glow" style={{ animationDelay: '200ms' }} />
            <span className="inline-block h-2 w-2 rounded-full bg-accent-500 animate-pulse-glow" style={{ animationDelay: '400ms' }} />
          </div>
          <span className="text-sm text-text-muted">Loading more products…</span>
        </div>
      )}
    </div>
  );
}

export default LoadMoreSentinel;
