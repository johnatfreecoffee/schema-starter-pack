import { Card } from '@/components/ui/card';
import { getAllMetrics, getAverageLoadTime, clearMetrics } from '@/lib/performanceMetrics';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Zap, TrendingUp, Clock, BarChart } from 'lucide-react';

export const PerformanceDashboard = () => {
  const allMetrics = getAllMetrics();
  const pageNames = Object.keys(allMetrics);

  const handleClearMetrics = () => {
    clearMetrics();
    toast.success('Performance metrics cleared');
    window.location.reload();
  };

  const getPerformanceGrade = (avgTime: number) => {
    if (avgTime < 500) return { grade: 'Excellent', color: 'text-green-600' };
    if (avgTime < 1000) return { grade: 'Good', color: 'text-blue-600' };
    if (avgTime < 2000) return { grade: 'Fair', color: 'text-yellow-600' };
    return { grade: 'Needs Work', color: 'text-red-600' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Performance Metrics</h2>
          <p className="text-muted-foreground">
            Monitor page load times and application performance
          </p>
        </div>
        <Button onClick={handleClearMetrics} variant="outline">
          Clear Metrics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pages Tracked</p>
              <p className="text-2xl font-bold">{pageNames.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fast Pages</p>
              <p className="text-2xl font-bold">
                {pageNames.filter(p => {
                  const avg = getAverageLoadTime(p);
                  return avg !== null && avg < 500;
                }).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slow Pages</p>
              <p className="text-2xl font-bold">
                {pageNames.filter(p => {
                  const avg = getAverageLoadTime(p);
                  return avg !== null && avg >= 2000;
                }).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <BarChart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Load Time</p>
              <p className="text-2xl font-bold">
                {pageNames.length > 0
                  ? Math.round(
                      pageNames.reduce((sum, p) => {
                        const avg = getAverageLoadTime(p);
                        return sum + (avg || 0);
                      }, 0) / pageNames.length
                    )
                  : 0}
                ms
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Page Performance</h3>
          <div className="space-y-3">
            {pageNames.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No performance data yet. Navigate through the app to collect metrics.
              </p>
            ) : (
              pageNames.map((pageName) => {
                const avgTime = getAverageLoadTime(pageName);
                const metrics = allMetrics[pageName];
                const { grade, color } = getPerformanceGrade(avgTime || 0);
                const cacheHitRate = metrics
                  ? Math.round(
                      (metrics.filter((m) => m.cached).length / metrics.length) * 100
                    )
                  : 0;

                return (
                  <div
                    key={pageName}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{pageName}</p>
                      <p className="text-sm text-muted-foreground">
                        {metrics?.length || 0} loads • {cacheHitRate}% cached
                      </p>
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
        </div>
      </Card>
    </div>
  );
};
