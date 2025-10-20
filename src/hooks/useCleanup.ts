import { useEffect, useRef } from 'react';

/**
 * Hook for automatic cleanup of async operations
 * Prevents memory leaks by cancelling operations on unmount
 */
export function useCleanup() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  useEffect(() => {
    return () => {
      // Cancel all pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clear all timers
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();

      // Clear all intervals
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current.clear();
    };
  }, []);

  const getAbortSignal = () => {
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }
    return abortControllerRef.current.signal;
  };

  const registerTimer = (timer: NodeJS.Timeout) => {
    timersRef.current.add(timer);
    return timer;
  };

  const registerInterval = (interval: NodeJS.Timeout) => {
    intervalsRef.current.add(interval);
    return interval;
  };

  const clearTimer = (timer: NodeJS.Timeout) => {
    clearTimeout(timer);
    timersRef.current.delete(timer);
  };

  const clearIntervalRef = (interval: NodeJS.Timeout) => {
    clearInterval(interval);
    intervalsRef.current.delete(interval);
  };

  return {
    getAbortSignal,
    registerTimer,
    registerInterval,
    clearTimer,
    clearInterval: clearIntervalRef,
  };
}
