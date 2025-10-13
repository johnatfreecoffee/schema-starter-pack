// Cache Service with namespace support and TTL management
import { supabase } from '@/integrations/supabase/client';

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
  namespaces: {
    [namespace: string]: {
      keys: number;
      size: number;
      lastAccess: string;
    };
  };
}

export interface CacheItem {
  key: string;
  value: any;
  expiresAt: number;
  createdAt: number;
  namespace: string;
  size: number;
}

// Default TTL values (in seconds)
export const DEFAULT_TTL = {
  'pages': 3600,        // 1 hour - generated/static pages
  'services': 3600,     // 1 hour - service lists
  'areas': 3600,        // 1 hour - service area lists
  'templates': 3600,    // 1 hour - template metadata
  'settings': 86400,    // 24 hours - company/site settings
  'crm': 900,           // 15 minutes - CRM dashboard
  'query': 300,         // 5 minutes - query results
  'default': 1800,      // 30 minutes - fallback
};

class CacheService {
  private cache: Map<string, CacheItem> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
  };

  // Get item from cache
  async get(key: string): Promise<any | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.value;
  }

  // Set item in cache
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const namespace = this.getNamespace(key);
    const defaultTTL = DEFAULT_TTL[namespace as keyof typeof DEFAULT_TTL] || DEFAULT_TTL.default;
    const expiresIn = (ttl || defaultTTL) * 1000; // Convert to milliseconds
    
    const serialized = JSON.stringify(value);
    const size = new Blob([serialized]).size;

    const item: CacheItem = {
      key,
      value,
      expiresAt: Date.now() + expiresIn,
      createdAt: Date.now(),
      namespace,
      size,
    };

    this.cache.set(key, item);
  }

  // Delete specific key
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  // Delete all keys in a namespace
  async deleteByNamespace(namespace: string): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (item.namespace === namespace) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Clear all cache
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  // Get cache statistics
  async getStats(): Promise<CacheStats> {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    const namespaces: CacheStats['namespaces'] = {};
    let totalSize = 0;

    for (const [key, item] of this.cache.entries()) {
      const ns = item.namespace;
      
      if (!namespaces[ns]) {
        namespaces[ns] = {
          keys: 0,
          size: 0,
          lastAccess: new Date(item.createdAt).toISOString(),
        };
      }

      namespaces[ns].keys++;
      namespaces[ns].size += item.size;
      totalSize += item.size;
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalKeys: this.cache.size,
      memoryUsage: totalSize,
      namespaces,
    };
  }

  // Get all cache items (for admin display)
  async getAllItems(): Promise<CacheItem[]> {
    const items: CacheItem[] = [];
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      // Filter out expired items
      if (item.expiresAt > now) {
        items.push(item);
      }
    }

    return items.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Warm cache with critical data
  async warmCache(): Promise<void> {
    console.log('Warming cache with critical data...');

    try {
      // Warm company settings
      try {
        const companyResult = await supabase
          .from('company_settings')
          .select('*')
          .limit(1)
          .single();
        
        if (companyResult.data) {
          await this.set('settings:company', companyResult.data);
        }
      } catch (error) {
        console.warn('Could not warm company settings cache');
      }

      // Warm static pages menu
      try {
        const pagesResult = await supabase
          .from('static_pages')
          .select('id, title, slug, display_order')
          .eq('show_in_menu', true)
          .eq('status', true)
          .order('display_order');
        
        if (pagesResult.data) {
          await this.set('pages:static:menu', pagesResult.data);
        }
      } catch (error) {
        console.warn('Could not warm static pages cache');
      }

      console.log('Cache warming complete');
    } catch (error) {
      console.error('Error warming cache:', error);
    }
  }

  // Helper to extract namespace from key
  private getNamespace(key: string): string {
    const parts = key.split(':');
    return parts.length > 0 ? parts[0] : 'default';
  }

  // Clean up expired items
  async cleanup(): Promise<number> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt <= now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(k => this.cache.delete(k));
    return keysToDelete.length;
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Auto-cleanup expired items every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheService.cleanup().then(count => {
      if (count > 0) {
        console.log(`Cleaned up ${count} expired cache items`);
      }
    });
  }, 5 * 60 * 1000);
}

// Helper functions for common cache operations
export const CacheHelper = {
  // Page caching helpers
  async getPageCache(pageId: string, type: 'static' | 'generated' = 'static'): Promise<any | null> {
    return cacheService.get(`pages:${type}:${pageId}`);
  },
  
  async setPageCache(pageId: string, content: any, type: 'static' | 'generated' = 'static'): Promise<void> {
    return cacheService.set(`pages:${type}:${pageId}`, content);
  },
  
  async invalidatePage(pageId: string, type: 'static' | 'generated' = 'static'): Promise<void> {
    return cacheService.delete(`pages:${type}:${pageId}`);
  },
  
  // Service page caching
  async getServicePage(serviceId: string, areaId: string): Promise<any | null> {
    return cacheService.get(`pages:service:${serviceId}:area:${areaId}`);
  },
  
  async setServicePage(serviceId: string, areaId: string, content: any): Promise<void> {
    return cacheService.set(`pages:service:${serviceId}:area:${areaId}`, content);
  },
  
  async invalidateServicePages(serviceId: string): Promise<void> {
    return cacheService.deleteByNamespace(`pages:service:${serviceId}`);
  },
  
  // Query result caching
  async getQueryCache(queryName: string, params: any = {}): Promise<any | null> {
    const paramString = JSON.stringify(params);
    return cacheService.get(`query:${queryName}:${paramString}`);
  },
  
  async setQueryCache(queryName: string, params: any = {}, data: any, ttl?: number): Promise<void> {
    const paramString = JSON.stringify(params);
    return cacheService.set(`query:${queryName}:${paramString}`, data, ttl);
  },
  
  // Settings caching
  async getSettings(type: 'company' | 'site'): Promise<any | null> {
    return cacheService.get(`settings:${type}`);
  },
  
  async setSettings(type: 'company' | 'site', data: any): Promise<void> {
    return cacheService.set(`settings:${type}`, data);
  },
  
  async invalidateAllPages(): Promise<void> {
    return cacheService.deleteByNamespace('pages');
  }
};
