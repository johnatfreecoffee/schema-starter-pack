import { useState, useCallback } from 'react';

export type BulkSelectionMode = 'selected_ids' | 'all_matching';

export interface BulkSelectionState<T extends { id: string }> {
  selectedIds: Set<string>;
  selectedItems: T[];
  isAllSelected: boolean;
  isAllMatchingSelected: boolean;
  selectionMode: BulkSelectionMode;
  selectAll: () => void;
  deselectAll: () => void;
  toggleItem: (id: string) => void;
  toggleAll: (items: T[]) => void;
  isSelected: (id: string) => boolean;
  selectedCount: number;
  selectAllMatching: (totalCount: number) => void;
  totalMatchingCount: number;
}

export function useBulkSelection<T extends { id: string }>(
  items: T[]
): BulkSelectionState<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<BulkSelectionMode>('selected_ids');
  const [totalMatchingCount, setTotalMatchingCount] = useState(0);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)));
    setSelectionMode('selected_ids');
    setTotalMatchingCount(0);
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode('selected_ids');
    setTotalMatchingCount(0);
  }, []);

  const selectAllMatching = useCallback((totalCount: number) => {
    setSelectionMode('all_matching');
    setTotalMatchingCount(totalCount);
    setSelectedIds(new Set(items.map(item => item.id))); // Keep visible items selected for UI
  }, [items]);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback((currentItems: T[]) => {
    const allCurrentSelected = currentItems.every(item => selectedIds.has(item.id));
    if (allCurrentSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        currentItems.forEach(item => next.delete(item.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        currentItems.forEach(item => next.add(item.id));
        return next;
      });
    }
  }, [selectedIds]);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const selectedItems = items.filter(item => selectedIds.has(item.id));
  const isAllSelected = items.length > 0 && items.every(item => selectedIds.has(item.id));
  const isAllMatchingSelected = selectionMode === 'all_matching';
  const selectedCount = isAllMatchingSelected ? totalMatchingCount : selectedIds.size;

  return {
    selectedIds,
    selectedItems,
    isAllSelected,
    isAllMatchingSelected,
    selectionMode,
    selectAll,
    deselectAll,
    toggleItem,
    toggleAll,
    isSelected,
    selectedCount,
    selectAllMatching,
    totalMatchingCount,
  };
}
