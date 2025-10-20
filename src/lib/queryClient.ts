import { QueryClient } from '@tanstack/react-query';

/**
 * Optimized QueryClient configuration for performance
 * Includes caching, stale time, and retry settings
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
      // Enable network mode for better offline support
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      // Enable network mode for mutations
      networkMode: 'online',
    },
  },
});
