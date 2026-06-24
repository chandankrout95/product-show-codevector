import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchProducts } from '../api/productApi';

/**
 * Custom hook managing cursor-based product pagination.
 *
 * Responsibilities:
 * - Accumulates products across pages
 * - Tracks cursor, loading, error, and hasMore state
 * - Cancels in-flight requests when category changes (AbortController)
 * - Resets state on category change
 */
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState(null);
  const [estimatedTotal, setEstimatedTotal] = useState(null);

  // AbortController ref — lets us cancel in-flight requests
  const abortControllerRef = useRef(null);

  // Track whether this is the initial load (no data yet)
  const isInitialLoad = products.length === 0 && isLoading;

  /**
   * Load the next page of products.
   */
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchProducts({
        cursor,
        limit: 40,
        category,
        signal: controller.signal,
      });

      // Guard against stale responses after abort
      if (controller.signal.aborted) return;

      setProducts((prev) => [...prev, ...result.data]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);

      if (result.estimatedTotal != null) {
        setEstimatedTotal(result.estimatedTotal);
      }
    } catch (err) {
      // Ignore abort errors — they're intentional
      if (err.name === 'AbortError' || err.name === 'CanceledError') return;
      setError(err.message || 'Failed to fetch products');
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [cursor, category, isLoading, hasMore]);

  /**
   * Change the category filter.
   * Resets cursor and product list, cancels in-flight requests.
   */
  const changeCategory = useCallback((newCategory) => {
    // Cancel in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setCategory(newCategory || null);
    setProducts([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    setIsLoading(false);
  }, []);

  /**
   * Retry after an error.
   */
  const retry = useCallback(() => {
    setError(null);
    // loadMore will be triggered by the effect below or manually
  }, []);

  // Auto-fetch the first page on mount and after category change
  useEffect(() => {
    // Small delay to batch with state resets from changeCategory
    const timer = setTimeout(() => {
      if (products.length === 0 && hasMore && !isLoading) {
        loadMore();
      }
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
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
  };
}
