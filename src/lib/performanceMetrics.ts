/**
 * Performance metrics tracking utilities
 * Tracks page load times, cache hits, and other performance indicators
 */

interface PageMetric {
  loadTime: number;
  timestamp: number;
  cached: boolean;
  pageName: string;
}

/**
 * Track page load time for performance monitoring
 */
export const trackPageLoad = (pageName: string, loadTime: number) => {
  try {
    const metrics = JSON.parse(localStorage.getItem('page_metrics') || '{}');
    
    if (!metrics[pageName]) {
      metrics[pageName] = [];
    }
    
    // Keep only last 10 loads per page
    metrics[pageName].push({
      loadTime,
      timestamp: Date.now(),
      cached: loadTime < 500, // Assume fast loads are from cache
    });
    
    if (metrics[pageName].length > 10) {
      metrics[pageName] = metrics[pageName].slice(-10);
    }
    
    localStorage.setItem('page_metrics', JSON.stringify(metrics));
  } catch (error) {
    console.error('Failed to track page load:', error);
  }
};

/**
 * Get average load time for a page
 */
export const getAverageLoadTime = (pageName: string): number | null => {
  try {
    const metrics = JSON.parse(localStorage.getItem('page_metrics') || '{}');
    const pageMetrics = metrics[pageName];
    
    if (!pageMetrics || pageMetrics.length === 0) {
      return null;
    }
    
    const total = pageMetrics.reduce((sum: number, m: PageMetric) => sum + m.loadTime, 0);
    return total / pageMetrics.length;
  } catch (error) {
    console.error('Failed to get average load time:', error);
    return null;
  }
};

/**
 * Get all performance metrics
 */
export const getAllMetrics = (): Record<string, PageMetric[]> => {
  try {
    return JSON.parse(localStorage.getItem('page_metrics') || '{}');
  } catch (error) {
    console.error('Failed to get metrics:', error);
    return {};
  }
};

/**
 * Clear all performance metrics
 */
export const clearMetrics = () => {
  try {
    localStorage.removeItem('page_metrics');
  } catch (error) {
    console.error('Failed to clear metrics:', error);
  }
};
