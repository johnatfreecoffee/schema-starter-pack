import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAllMetrics, trackPageLoad, clearMetrics } from '@/lib/performanceMetrics';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const PerformanceMetrics = () => {
  const [metrics, setMetrics] = useState(getAllMetrics());
  const [loading, setLoading] = useState(false);

  const refreshMetrics = () => {
    setLoading(true);
    setTimeout(() => {
      setMetrics(getAllMetrics());
      setLoading(false);
      toast.success('Metrics refreshed');
    }, 500);
  };

  const exportMetrics = () => {
    const csv = [
      ['Page', 'Average Load Time (ms)', 'Total Loads', 'Cache Rate'].join(','),
      ...Object.entries(metrics).map(([page, pageMetrics]) => {
        const avg = pageMetrics.reduce((sum, m) => sum + m.loadTime, 0) / pageMetrics.length;
        const cached = pageMetrics.filter(m => m.cached).length;
        const cacheRate = ((cached / pageMetrics.length) * 100).toFixed(1);
        return [page, avg.toFixed(0), pageMetrics.length, `${cacheRate}%`].join(',');
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Metrics exported');
  };

  const clearAllMetrics = () => {
    clearMetrics();
    setMetrics({});
    toast.success('All metrics cleared');
  };

  // Calculate aggregate stats
  const pageStats = Object.entries(metrics).map(([page, pageMetrics]) => {
    const avg = pageMetrics.reduce((sum, m) => sum + m.loadTime, 0) / pageMetrics.length;
    const cached = pageMetrics.filter(m => m.cached).length;
    const cacheRate = (cached / pageMetrics.length) * 100;
    return { page, avg, total: pageMetrics.length, cacheRate };
  });

  const sortedBySpeed = [...pageStats].sort((a, b) => b.avg - a.avg).slice(0, 10);
  
  // Overall average
  const overallAvg = pageStats.length > 0
    ? pageStats.reduce((sum, p) => sum + p.avg, 0) / pageStats.length
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Page load times and cache performance</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshMetrics}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportMetrics}
              disabled={pageStats.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pageStats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No performance data available yet.</p>
            <p className="text-sm mt-2">Visit some pages to start collecting metrics.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Average Load Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overallAvg.toFixed(0)}ms
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all pages
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pages Tracked</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {pageStats.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unique pages
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Loads</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {pageStats.reduce((sum, p) => sum + p.total, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Page views
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Slowest Pages Bar Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Slowest Pages</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sortedBySpeed}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="page" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis label={{ value: 'Load Time (ms)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="avg" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cache Performance */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Cache Performance</h3>
              <div className="space-y-3">
                {pageStats.slice(0, 10).map((stat) => (
                  <div key={stat.page} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm truncate">{stat.page}</p>
                      <p className="text-xs text-muted-foreground">
                        {stat.total} loads • {stat.avg.toFixed(0)}ms avg
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {stat.cacheRate.toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">cached</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={clearAllMetrics}
              className="w-full"
            >
              Clear All Metrics
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
