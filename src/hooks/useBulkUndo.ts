import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UndoState {
  operation: 'status' | 'assignment' | 'edit';
  module: string;
  itemIds: string[];
  previousValues: Record<string, any>[];
  timestamp: Date;
}

export function useBulkUndo() {
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Clear undo state after 10 seconds
  useEffect(() => {
    if (undoState && !undoTimeout) {
      const timeout = setTimeout(() => {
        setUndoState(null);
        setUndoTimeout(null);
      }, 10000);
      setUndoTimeout(timeout);
    }

    return () => {
      if (undoTimeout) {
        clearTimeout(undoTimeout);
      }
    };
  }, [undoState]);

  const saveUndoState = useCallback((state: UndoState) => {
    // Clear any existing timeout
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
    setUndoState(state);
  }, [undoTimeout]);

  const performUndo = useCallback(async () => {
    if (!undoState) return;

    try {
      // Restore previous values for each item
      for (let i = 0; i < undoState.itemIds.length; i++) {
        const itemId = undoState.itemIds[i];
        const previousValue = undoState.previousValues[i];

        await supabase
          .from(undoState.module as any)
          .update(previousValue)
          .eq('id', itemId);
      }

      toast({
        title: 'Success',
        description: 'Operation reversed successfully',
      });

      // Clear undo state
      setUndoState(null);
      if (undoTimeout) {
        clearTimeout(undoTimeout);
        setUndoTimeout(null);
      }

      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to undo operation',
        variant: 'destructive',
      });
      return false;
    }
  }, [undoState, undoTimeout, toast]);

  const clearUndo = useCallback(() => {
    setUndoState(null);
    if (undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
    }
  }, [undoTimeout]);

  return {
    undoState,
    saveUndoState,
    performUndo,
    clearUndo,
  };
}
