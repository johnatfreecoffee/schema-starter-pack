import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { cacheService } from '@/lib/cacheService';

interface UseCachedQueryOptions<TData> extends Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'> {
  queryKey: string[];
  queryFn: () => Promise<TData>;
  cacheKey: string;
  cacheTTL?: number;
  bypassCache?: boolean;
}

/**
 * Enhanced useQuery hook with caching layer
 * First checks cache, then falls back to query
 */
export function useCachedQuery<TData>({
  queryKey,
  queryFn,
  cacheKey,
  cacheTTL,
  bypassCache = false,
  ...options
}: UseCachedQueryOptions<TData>) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Check cache first unless bypassed
      if (!bypassCache) {
        const cached = await cacheService.get(cacheKey);
        if (cached !== null) {
          return cached as TData;
        }
      }

      // Fetch from query
      const data = await queryFn();

      // Store in cache
      if (data) {
        await cacheService.set(cacheKey, data, cacheTTL);
      }

      return data;
    },
    ...options,
  });
}
