/*
 * usePagination Hook for Cursor-Based Pagination
 * File: client/src/hooks/usePagination.js
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import api, { unwrap } from '../api/client.js';

/**
 * Hook for managing cursor-based pagination
 * Handles deduplication, loading states, and error handling
 * 
 * @param {Function} fetchFn - Async function to fetch paginated data
 *   Should accept { limit, cursor } and return { items, pagination: { nextCursor, hasMore } }
 * @param {Object} options - Configuration options
 * @param {number} options.initialLimit - Items per page (default: 20)
 * @param {Function} options.onError - Error callback
 * @returns {Object} Pagination state and methods
 */
export function usePagination(fetchFn, options = {}) {
  const {
    initialLimit = options.limit ?? 20,
    onError = null,
  } = options;

  const getItemKey = (item) => String(item?._id || item?.id || '');

  const fetchPage = useCallback(async ({ limit, cursor, signal }) => {
    if (typeof fetchFn === 'function') {
      const result = await fetchFn({ limit, cursor, signal });
      return result?.data ? unwrap(result) : result;
    }

    if (typeof fetchFn === 'string' && fetchFn) {
      const response = await api.get(fetchFn, {
        params: { limit, cursor },
        signal,
      });
      return unwrap(response);
    }

    return { items: [], pagination: { hasMore: false, nextCursor: null } };
  }, [fetchFn]);

  // State management
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false); // Distinguish between initial load and pagination
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);

  // Track already fetched item IDs to prevent duplicates
  const itemIdsRef = useRef(new Set());
  const abortControllerRef = useRef(null);

  /**
   * Load initial page
   */
  const loadInitial = useCallback(async (forceRefresh = false) => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    
    if (forceRefresh) {
      setItems([]);
      itemIdsRef.current.clear();
    }

    try {
      const result = await fetchPage({ 
        limit: initialLimit,
        signal: abortControllerRef.current.signal 
      });
      
      const newItems = result.items || [];
      newItems.forEach((item) => itemIdsRef.current.add(getItemKey(item)));

      setItems(newItems);
      setNextCursor(result.pagination?.nextCursor || null);
      setHasMore(result.pagination?.hasMore ?? false);
      setError(null);
    } catch (err) {
      // Ignore abort errors
      if (err.name !== 'AbortError') {
        setError(err);
        if (onError) onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, initialLimit, onError]);

  /**
   * Load next page
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isFetching || isLoading) {
      return; // Guard: prevent concurrent requests
    }

    setIsFetching(true);
    setError(null);

    try {
      const result = await fetchPage({ 
        limit: initialLimit,
        cursor: nextCursor 
      });

      const newItems = result.items || [];
      
      // Deduplicate: filter out items we've already seen
      const dedupedItems = newItems.filter((item) => {
        const itemKey = getItemKey(item);
        if (!itemKey || itemIdsRef.current.has(itemKey)) {
          return false; // Skip duplicate
        }
        itemIdsRef.current.add(itemKey);
        return true;
      });

      // Append to existing items
      setItems(prev => [...prev, ...dedupedItems]);
      setNextCursor(result.pagination?.nextCursor || null);
      setHasMore(result.pagination?.hasMore ?? false);
      setError(null);
    } catch (err) {
      setError(err);
      if (onError) onError(err);
    } finally {
      setIsFetching(false);
    }
  }, [fetchFn, initialLimit, hasMore, nextCursor, isFetching, isLoading, onError]);

  /**
   * Prepend items (for real-time updates from WebSocket)
   */
  const prependItems = useCallback((newItems) => {
    setItems(prev => {
      // Deduplicate incoming items
      const dedupedItems = newItems.filter((item) => {
        const itemKey = getItemKey(item);
        if (!itemKey || itemIdsRef.current.has(itemKey)) {
          return false;
        }
        itemIdsRef.current.add(itemKey);
        return true;
      });

      if (dedupedItems.length === 0) return prev;
      return [...dedupedItems, ...prev];
    });
  }, []);

  /**
   * Append items (prepend to end for different data flows)
   */
  const appendItems = useCallback((newItems) => {
    setItems(prev => {
      const dedupedItems = newItems.filter((item) => {
        const itemKey = getItemKey(item);
        if (!itemKey || itemIdsRef.current.has(itemKey)) {
          return false;
        }
        itemIdsRef.current.add(itemKey);
        return true;
      });

      if (dedupedItems.length === 0) return prev;
      return [...prev, ...dedupedItems];
    });
  }, []);

  /**
   * Remove item by ID
   */
  const removeItem = useCallback((itemId) => {
    setItems((prev) => prev.filter((item) => getItemKey(item) !== String(itemId)));
    itemIdsRef.current.delete(String(itemId));
  }, []);

  /**
   * Update item by ID
   */
  const updateItem = useCallback((itemId, updates) => {
    setItems(prev =>
      prev.map((item) => 
        getItemKey(item) === String(itemId) 
          ? { ...item, ...updates }
          : item
      )
    );
  }, []);

  /**
   * Find item by ID
   */
  const findItem = useCallback((itemId) => {
    return items.find((item) => getItemKey(item) === String(itemId));
  }, [items]);

  /**
   * Clear all items and reset state
   */
  const clearItems = useCallback(() => {
    setItems([]);
    setNextCursor(null);
    setHasMore(true);
    setError(null);
    itemIdsRef.current.clear();
  }, []);

  /**
   * Retry failed operation
   */
  const retry = useCallback(async () => {
    if (items.length === 0) {
      await loadInitial();
    } else {
      await loadMore();
    }
  }, [items.length, loadInitial, loadMore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    items,
    isLoading,           // True while loading initial page
    isFetching,          // True while fetching more pages
    error,
    hasMore,
    nextCursor,
    
    // Methods
    loadInitial,
    loadMore,
    prependItems,
    appendItems,
    removeItem,
    updateItem,
    findItem,
    clearItems,
    retry,

    // Computed
    isEmpty: items.length === 0,
    isIdle: !isLoading && !isFetching,
  };
}

export default usePagination;
