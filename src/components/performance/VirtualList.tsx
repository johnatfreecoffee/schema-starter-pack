import { ReactNode } from 'react';
import { useVirtualList } from '@/hooks/useVirtualList';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  itemClassName?: string;
}

/**
 * Virtual scrolling list component for efficient rendering of large lists
 * Only renders visible items to improve performance
 */
export function VirtualList<T>({
  items,
  renderItem,
  estimateSize = 72,
  overscan = 5,
  className,
  itemClassName,
}: VirtualListProps<T>) {
  const { parentRef, virtualItems, totalSize } = useVirtualList({
    itemCount: items.length,
    estimateSize,
    overscan,
  });

  return (
    <div
      ref={parentRef as any}
      className={cn('h-full overflow-auto', className)}
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            className={cn('absolute top-0 left-0 w-full', itemClassName)}
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
