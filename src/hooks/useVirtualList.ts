import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface UseVirtualListOptions {
  itemCount: number;
  estimateSize?: number;
  overscan?: number;
}

/**
 * Hook for virtual scrolling to handle large lists efficiently
 * Only renders items that are visible in the viewport
 */
export function useVirtualList<T = HTMLDivElement>({
  itemCount,
  estimateSize = 72,
  overscan = 5,
}: UseVirtualListOptions) {
  const parentRef = useRef<T>(null);

  const virtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => parentRef.current as any,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return {
    parentRef,
    virtualizer,
    virtualItems,
    totalSize,
  };
}
