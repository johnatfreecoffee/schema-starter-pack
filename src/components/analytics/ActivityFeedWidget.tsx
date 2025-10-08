import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { 
  User, 
  Building2, 
  CheckSquare, 
  FolderKanban, 
  FileText, 
  CreditCard 
} from 'lucide-react';

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_name: string;
  created_at: string;
}

interface ActivityFeedWidgetProps {
  activities: Activity[];
}

const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case 'lead':
      return <User className="h-4 w-4" />;
    case 'account':
      return <Building2 className="h-4 w-4" />;
    case 'task':
      return <CheckSquare className="h-4 w-4" />;
    case 'project':
      return <FolderKanban className="h-4 w-4" />;
    case 'quote':
      return <FileText className="h-4 w-4" />;
    case 'invoice':
      return <CreditCard className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'created':
      return 'text-green-600 bg-green-50';
    case 'updated':
      return 'text-blue-600 bg-blue-50';
    case 'deleted':
      return 'text-red-600 bg-red-50';
    case 'status_changed':
      return 'text-orange-600 bg-orange-50';
    case 'converted':
      return 'text-purple-600 bg-purple-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export function ActivityFeedWidget({ activities }: ActivityFeedWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                    {getEntityIcon(activity.entity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium capitalize">{activity.action}</span>{' '}
                      <span className="text-muted-foreground">{activity.entity_type}</span>
                    </p>
                    <p className="text-sm font-medium truncate">{activity.entity_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
