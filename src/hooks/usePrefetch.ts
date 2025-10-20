import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook for prefetching data on hover or other interactions
 * Improves perceived performance by loading data before it's needed
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchQuery = useCallback(
    (queryKey: string[], queryFn: () => Promise<any>) => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
    [queryClient]
  );

  const prefetchOnHover = useCallback(
    (queryKey: string[], queryFn: () => Promise<any>) => {
      return {
        onMouseEnter: () => prefetchQuery(queryKey, queryFn),
        onFocus: () => prefetchQuery(queryKey, queryFn),
      };
    },
    [prefetchQuery]
  );

  return {
    prefetchQuery,
    prefetchOnHover,
  };
}
