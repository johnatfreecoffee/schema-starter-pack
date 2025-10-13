import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, FileText, Users, Briefcase } from 'lucide-react';

const StorageTab = () => {
  // Mock data - in production, fetch from API
  const storageData = {
    total: 2.3,
    breakdown: [
      { name: 'Pages & Templates', size: 800, icon: FileText },
      { name: 'Leads & CRM', size: 450, icon: Users },
      { name: 'Projects', size: 340, icon: Briefcase },
      { name: 'System Data', size: 710, icon: Database },
    ],
  };

  const formatSize = (mb: number) => {
    if (mb >= 1000) {
      return `${(mb / 1000).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Storage Overview</CardTitle>
          <CardDescription>Total database usage and breakdown by module</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-8 bg-muted rounded-lg">
            <div className="text-4xl font-bold">{storageData.total} GB</div>
            <div className="text-muted-foreground mt-2">Total Database Size</div>
          </div>

          <div className="space-y-3">
            {storageData.breakdown.map((item) => {
              const Icon = item.icon;
              const percentage = ((item.size / (storageData.total * 1000)) * 100).toFixed(1);
              
              return (
                <div key={item.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <Badge variant="outline">{formatSize(item.size)}</Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{percentage}% of total</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storage Recommendations</CardTitle>
          <CardDescription>Ways to optimize your database storage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 border rounded-lg">
            <div className="font-medium">Archive old data</div>
            <div className="text-sm text-muted-foreground mt-1">
              Move inactive leads and completed projects to archive (estimated: ~200 MB savings)
            </div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="font-medium">Clear old activity logs</div>
            <div className="text-sm text-muted-foreground mt-1">
              Delete activity logs older than 90 days (estimated: ~120 MB savings)
            </div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="font-medium">Optimize images</div>
            <div className="text-sm text-muted-foreground mt-1">
              Compress uploaded images and remove unused media files
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageTab;
