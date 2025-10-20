import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cacheService, CacheStats, DEFAULT_TTL, CacheItem } from '@/lib/cacheService';
import { warmCriticalCaches } from '@/lib/cacheInvalidation';
import { getAllMetrics, getAverageLoadTime, clearMetrics } from '@/lib/performanceMetrics';
import { toast } from 'sonner';
import { 
  Zap, 
  Database, 
  Trash2, 
  RefreshCw, 
  TrendingUp, 
  Clock,
  HardDrive,
  Activity,
  CheckCircle2,
  XCircle,
  Percent,
  BarChart
} from 'lucide-react';
import { format } from 'date-fns';

const Performance = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [cacheItems, setCacheItems] = useState<CacheItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [warming, setWarming] = useState(false);

  // Cache settings
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [autoWarmEnabled, setAutoWarmEnabled] = useState(true);
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [lazyLoadingEnabled, setLazyLoadingEnabled] = useState(true);

  useEffect(() => {
    loadCacheStats();
    loadCacheItems();
    
    // Refresh stats every 10 seconds
    const interval = setInterval(() => {
      loadCacheStats();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadCacheStats = async () => {
    const data = await cacheService.getStats();
    setStats(data);
  };

  const loadCacheItems = async () => {
    const items = await cacheService.getAllItems();
    setCacheItems(items);
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all cache? This will affect performance until caches are rebuilt.')) {
      return;
    }

    setLoading(true);
    try {
      await cacheService.clear();
      await loadCacheStats();
      await loadCacheItems();
      toast.success('All caches cleared successfully');
    } catch (error) {
      toast.error('Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const handleClearNamespace = async (namespace: string) => {
    if (!confirm(`Clear all "${namespace}" caches?`)) {
      return;
    }

    setLoading(true);
    try {
      await cacheService.deleteByNamespace(namespace);
      await loadCacheStats();
      await loadCacheItems();
      toast.success(`Cleared ${namespace} cache`);
    } catch (error) {
      toast.error('Failed to clear namespace cache');
    } finally {
      setLoading(false);
    }
  };

  const handleWarmCache = async () => {
    setWarming(true);
    try {
      await warmCriticalCaches();
      await loadCacheStats();
      await loadCacheItems();
      toast.success('Cache warmed successfully');
    } catch (error) {
      console.error('Cache warming error:', error);
      toast.error('Failed to warm cache');
    } finally {
      setWarming(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getPerformanceGrade = (hitRate: number) => {
    if (hitRate >= 90) return { grade: 'A', color: 'text-green-600' };
    if (hitRate >= 80) return { grade: 'B', color: 'text-blue-600' };
    if (hitRate >= 70) return { grade: 'C', color: 'text-yellow-600' };
    if (hitRate >= 60) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  const performance = stats ? getPerformanceGrade(stats.hitRate) : { grade: 'N/A', color: 'text-gray-600' };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">Performance & Cache</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and optimize application performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleWarmCache}
              disabled={warming}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${warming ? 'animate-spin' : ''}`} />
              {warming ? 'Warming...' : 'Warm Cache'}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClearAll}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Cache
            </Button>
          </div>
        </div>

        {/* Performance Score */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`text-6xl font-bold ${performance.color}`}>
                  {performance.grade}
                </div>
                <div>
                  <h3 className="text-2xl font-semibold">Performance Score</h3>
                  <p className="text-muted-foreground">
                    Based on cache hit rate: {stats?.hitRate.toFixed(2)}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Target: 80%+</div>
                <Progress 
                  value={stats?.hitRate || 0} 
                  className="w-48 h-3"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Cache Overview</TabsTrigger>
            <TabsTrigger value="page-metrics">Page Metrics</TabsTrigger>
            <TabsTrigger value="cache-items">Cache Items</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Cache Statistics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cache Hits</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.hits.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Successful cache retrievals
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cache Misses</CardTitle>
                  <XCircle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.misses.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cache not found
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
                  <Database className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalKeys.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cached items in memory
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <HardDrive className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatBytes(stats?.memoryUsage || 0)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cache storage size
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Cache by Namespace */}
            <Card>
              <CardHeader>
                <CardTitle>Cache by Namespace</CardTitle>
                <CardDescription>
                  Cache statistics organized by namespace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats && Object.entries(stats.namespaces).map(([namespace, data]) => (
                    <div key={namespace} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="font-mono">
                            {namespace}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {data.keys} items • {formatBytes(data.size)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          TTL: {DEFAULT_TTL[namespace as keyof typeof DEFAULT_TTL] || DEFAULT_TTL.default}s
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearNamespace(namespace)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  ))}
                  
                  {stats && Object.keys(stats.namespaces).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No cache data available. Try warming the cache.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="page-metrics" className="space-y-6">
            {/* Page Load Metrics */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pages Tracked</CardTitle>
                  <Activity className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.keys(getAllMetrics()).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unique pages monitored
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fast Pages</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.keys(getAllMetrics()).filter(p => {
                      const avg = getAverageLoadTime(p);
                      return avg !== null && avg < 500;
                    }).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Load time {'<'} 500ms
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Slow Pages</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.keys(getAllMetrics()).filter(p => {
                      const avg = getAverageLoadTime(p);
                      return avg !== null && avg >= 2000;
                    }).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Load time {'>'} 2000ms
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
                  <BarChart className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(() => {
                      const pageNames = Object.keys(getAllMetrics());
                      if (pageNames.length === 0) return '0';
                      const avg = Math.round(
                        pageNames.reduce((sum, p) => {
                          const pageAvg = getAverageLoadTime(p);
                          return sum + (pageAvg || 0);
                        }, 0) / pageNames.length
                      );
                      return avg;
                    })()}ms
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all pages
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Page Performance</CardTitle>
                    <CardDescription>
                      Load times for individual pages
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      clearMetrics();
                      toast.success('Metrics cleared');
                      window.location.reload();
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Metrics
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(getAllMetrics()).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No metrics yet. Navigate through the app to collect data.
                    </div>
                  ) : (
                    Object.entries(getAllMetrics()).map(([pageName, metrics]) => {
                      const avgTime = getAverageLoadTime(pageName);
                      const cacheHitRate = metrics
                        ? Math.round((metrics.filter(m => m.cached).length / metrics.length) * 100)
                        : 0;
                      
                      const getGrade = (time: number) => {
                        if (time < 500) return { grade: 'Excellent', color: 'text-green-600' };
                        if (time < 1000) return { grade: 'Good', color: 'text-blue-600' };
                        if (time < 2000) return { grade: 'Fair', color: 'text-yellow-600' };
                        return { grade: 'Needs Work', color: 'text-red-600' };
                      };
                      
                      const { grade, color } = getGrade(avgTime || 0);

                      return (
                        <div
                          key={pageName}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{pageName}</p>
                            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                              <span>{metrics?.length || 0} loads</span>
                              <span>•</span>
                              <span>{cacheHitRate}% cached</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{avgTime}ms</p>
                            <p className={`text-sm font-medium ${color}`}>{grade}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cache-items" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cached Items</CardTitle>
                <CardDescription>
                  All items currently in cache
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cacheItems.map((item, index) => {
                    const timeLeft = Math.max(0, item.expiresAt - Date.now());
                    const timeLeftSeconds = Math.floor(timeLeft / 1000);
                    const timeLeftMinutes = Math.floor(timeLeftSeconds / 60);
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-xs font-mono text-primary truncate">
                              {item.key}
                            </code>
                            <Badge variant="secondary" className="text-xs">
                              {formatBytes(item.size)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires in {timeLeftMinutes}m {timeLeftSeconds % 60}s
                            </span>
                            <span>
                              Created {format(new Date(item.createdAt), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            cacheService.delete(item.key);
                            loadCacheItems();
                            toast.success('Cache item deleted');
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}

                  {cacheItems.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No cached items found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cache Settings</CardTitle>
                <CardDescription>
                  Configure cache behavior and optimization settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Caching</Label>
                    <p className="text-sm text-muted-foreground">
                      Turn on/off all caching features
                    </p>
                  </div>
                  <Switch 
                    checked={cacheEnabled} 
                    onCheckedChange={setCacheEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Cache Warming</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically warm cache on startup
                    </p>
                  </div>
                  <Switch 
                    checked={autoWarmEnabled} 
                    onCheckedChange={setAutoWarmEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Response Compression</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable gzip/brotli compression for API responses
                    </p>
                  </div>
                  <Switch 
                    checked={compressionEnabled} 
                    onCheckedChange={setCompressionEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Image Lazy Loading</Label>
                    <p className="text-sm text-muted-foreground">
                      Lazy load images below the fold
                    </p>
                  </div>
                  <Switch 
                    checked={lazyLoadingEnabled} 
                    onCheckedChange={setLazyLoadingEnabled}
                  />
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={() => toast.success('Settings saved')}>
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Default TTL Values</CardTitle>
                <CardDescription>
                  Time-to-live for different cache namespaces (in seconds)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(DEFAULT_TTL).map(([namespace, ttl]) => (
                    <div key={namespace} className="flex items-center gap-4">
                      <Label className="w-32 font-mono">{namespace}</Label>
                      <Input 
                        type="number" 
                        value={ttl} 
                        className="w-32"
                        readOnly
                      />
                      <span className="text-sm text-muted-foreground">
                        ({Math.floor(ttl / 60)} minutes)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Performance;
