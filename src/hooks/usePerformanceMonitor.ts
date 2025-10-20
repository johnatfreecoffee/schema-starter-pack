import { useEffect, useRef } from 'react';
import { trackPageLoad } from '@/lib/performanceMetrics';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
}

/**
 * Hook to monitor component performance
 * Tracks render time and page load metrics
 */
export function usePerformanceMonitor(componentName: string) {
  const mountTime = useRef(Date.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = Date.now() - mountTime.current;

    // Track initial render time
    if (renderCount.current === 1) {
      trackPageLoad(componentName, renderTime);
      
      // Log slow renders in development
      if (process.env.NODE_ENV === 'development' && renderTime > 1000) {
        console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`);
      }
    }

    return () => {
      // Cleanup on unmount
      if (renderCount.current === 1) {
        const totalTime = Date.now() - mountTime.current;
        if (process.env.NODE_ENV === 'development') {
          console.log(`${componentName} lifecycle: ${totalTime}ms`);
        }
      }
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    mountTime: mountTime.current,
  };
}

/**
 * Hook to track Web Vitals metrics
 */
export function useWebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Track Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        console.log('LCP:', lastEntry.startTime);
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // Browser doesn't support this metric
    }

    return () => observer.disconnect();
  }, []);
}
