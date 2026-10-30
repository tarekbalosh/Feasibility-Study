import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { FilterValues, FilterValue, DateRangeValue } from '@/components/ui/filters/types';

export interface UseFilterParamsOptions {
  // Query param key used for search (default: 'q')
  searchKey?: string;
  // Param keys to preserve when clearing filters (e.g. route ids like 'id')
  preserveKeys?: string[];
}

export function useFilterParams(options: UseFilterParamsOptions = {}) {
  const router = useRouter();
  const searchKey = options.searchKey || 'q';
  const preserveKeys = options.preserveKeys || ['id'];

  // Current search value from URL
  const searchValue = useMemo(() => {
    const q = router.query[searchKey] || router.query.search;
    return typeof q === 'string' ? q : '';
  }, [router.query, searchKey]);

  // Update a single or multiple filter values in URL
  const updateFilters = useCallback(
    (updates: Record<string, FilterValue>) => {
      const nextQuery: Record<string, any> = { ...router.query };

      for (const [key, val] of Object.entries(updates)) {
        if (
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0)
        ) {
          delete nextQuery[key];
        } else if (Array.isArray(val)) {
          nextQuery[key] = val.join(',');
        } else if (typeof val === 'object' && ('from' in val || 'to' in val)) {
          const range = val as DateRangeValue;
          if (range.from) nextQuery[`${key}From`] = range.from;
          else delete nextQuery[`${key}From`];

          if (range.to) nextQuery[`${key}To`] = range.to;
          else delete nextQuery[`${key}To`];
        } else {
          nextQuery[key] = String(val);
        }
      }

      // Reset page to 1 on filter changes if page exists in query
      if (!('page' in updates) && 'page' in nextQuery) {
        delete nextQuery.page;
      }

      router.push(
        {
          pathname: router.pathname,
          query: nextQuery,
        },
        undefined,
        { shallow: true }
      );
    },
    [router]
  );

  // Update a single filter key
  const setFilter = useCallback(
    (key: string, val: FilterValue) => {
      updateFilters({ [key]: val });
    },
    [updateFilters]
  );

  // Update search query
  const setSearch = useCallback(
    (q: string) => {
      updateFilters({ [searchKey]: q });
    },
    [updateFilters, searchKey]
  );

  // Clear all filters except preserved keys (like route params)
  const clearAllFilters = useCallback(() => {
    const nextQuery: Record<string, any> = {};
    preserveKeys.forEach((k) => {
      if (router.query[k] !== undefined) {
        nextQuery[k] = router.query[k];
      }
    });

    router.push(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      { shallow: true }
    );
  }, [router, preserveKeys]);

  return {
    router,
    query: router.query,
    searchValue,
    setSearch,
    setFilter,
    updateFilters,
    clearAllFilters,
  };
}

export default useFilterParams;
