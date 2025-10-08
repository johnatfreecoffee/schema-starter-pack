import ActivityFeed from './ActivityFeed';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardActivityWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2 text-primary" />
          Recent Activity
          <span className="text-sm text-muted-foreground ml-auto font-normal">Last 24 hours</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityFeed limit={10} className="max-h-96 overflow-y-auto" />
      </CardContent>
    </Card>
  );
}
