import { useProducts } from './features/products/hooks/useProducts';
import ProductGrid from './features/products/components/ProductGrid';
import CategoryFilter from './features/products/components/CategoryFilter';
import ErrorState from './shared/components/ErrorState';

/**
 * Main application layout.
 * Premium dark-themed product browser with virtualized infinite scroll.
 */
function App() {
  const {
    products,
    hasMore,
    isLoading,
    isInitialLoad,
    error,
    category,
    estimatedTotal,
    loadMore,
    changeCategory,
    retry,
  } = useProducts();

  return (
    <div className="min-h-screen bg-surface-900">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-surface-700 bg-surface-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-400 shadow-lg shadow-accent-500/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Product Browser</h1>
              <p className="text-xs text-text-muted">
                Cursor-paginated · Virtualized
              </p>
            </div>
          </div>

          {/* Right side: stats + filter */}
          <div className="flex items-center gap-4">
            {/* Live loaded counter */}
            <div className="hidden items-center gap-2 rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 sm:flex">
              <span className="inline-block h-2 w-2 rounded-full bg-mint-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              <span className="text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">{products.length.toLocaleString()}</span>
                {estimatedTotal && (
                  <span> of ~{estimatedTotal.toLocaleString()}</span>
                )}
                {' '}loaded
              </span>
            </div>

            <CategoryFilter
              currentCategory={category}
              onCategoryChange={changeCategory}
            />
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        {error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : (
          <ProductGrid
            products={products}
            hasMore={hasMore}
            isLoading={isLoading}
            isInitialLoad={isInitialLoad}
            onLoadMore={loadMore}
          />
        )}
      </main>

      {/* ── Mobile stats bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-surface-700 bg-surface-900/90 px-4 py-2 backdrop-blur-lg sm:hidden">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-mint-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">{products.length.toLocaleString()}</span>
            {estimatedTotal && (
              <span> of ~{estimatedTotal.toLocaleString()}</span>
            )}
            {' '}products loaded
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
