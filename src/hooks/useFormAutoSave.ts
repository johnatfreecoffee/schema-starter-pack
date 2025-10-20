import { useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce';
import { toast } from 'sonner';

interface UseFormAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  storageKey?: string;
}

/**
 * Hook for auto-saving forms with debouncing and localStorage backup
 */
export function useFormAutoSave<T>({
  data,
  onSave,
  delay = 1000,
  storageKey,
}: UseFormAutoSaveOptions<T>) {
  const debouncedData = useDebounce(data, delay);
  const isFirstRender = useRef(true);
  const lastSavedData = useRef<T>(data);

  // Save to localStorage as backup
  useEffect(() => {
    if (storageKey && data) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    }
  }, [data, storageKey]);

  // Auto-save to server
  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Skip if data hasn't changed
    if (JSON.stringify(debouncedData) === JSON.stringify(lastSavedData.current)) {
      return;
    }

    const save = async () => {
      try {
        await onSave(debouncedData);
        lastSavedData.current = debouncedData;
        
        // Show subtle success indicator
        if (process.env.NODE_ENV === 'development') {
          console.log('Auto-saved');
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast.error('Failed to auto-save changes');
      }
    };

    save();
  }, [debouncedData, onSave]);

  // Load from localStorage
  const loadFromStorage = () => {
    if (!storageKey) return null;
    
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  };

  // Clear localStorage
  const clearStorage = () => {
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

  return {
    loadFromStorage,
    clearStorage,
  };
}
