import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

export function useUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getFilters = useCallback(() => {
    const filters: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      try {
        // Try to parse JSON values
        filters[key] = JSON.parse(value);
      } catch {
        // If not JSON, use as string
        filters[key] = value;
      }
    });
    return filters;
  }, [searchParams]);

  const setFilters = useCallback((filters: Record<string, any>) => {
    const newParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        newParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    });
    setSearchParams(newParams);
  }, [setSearchParams]);

  const updateFilter = useCallback((key: string, value: any) => {
    const currentFilters = getFilters();
    if (value === null || value === undefined || value === '') {
      delete currentFilters[key];
    } else {
      currentFilters[key] = value;
    }
    setFilters(currentFilters);
  }, [getFilters, setFilters]);

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return {
    filters: getFilters(),
    setFilters,
    updateFilter,
    clearFilters,
  };
}
