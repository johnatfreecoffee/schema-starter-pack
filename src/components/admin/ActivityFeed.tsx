import { useEffect, useState } from 'react';
import { ActivityLogger } from '@/lib/activityLogger';
import { Clock, Plus, Edit, Trash, ArrowRight, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface Activity {
  id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string;
  entity_name?: string | null;
  action: string;
  changes?: Record<string, { old: any; new: any }> | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

interface ActivityFeedProps {
  entityType?: string;
  entityId?: string;
  userId?: string;
  limit?: number;
  className?: string;
}

export default function ActivityFeed({ 
  entityType, 
  entityId, 
  userId, 
  limit = 50, 
  className = '' 
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    loadActivities();
  }, [entityType, entityId, userId]);

  const loadActivities = async () => {
    try {
      let data: Activity[] = [];
      if (entityType && entityId) {
        data = (await ActivityLogger.getEntityActivities(entityType, entityId, limit)) as unknown as Activity[];
      } else if (userId) {
        data = (await ActivityLogger.getUserActivities(userId, limit)) as unknown as Activity[];
      } else {
        data = (await ActivityLogger.getRecentActivities(limit)) as unknown as Activity[];
      }
      setActivities(data || []);

      // Fetch user details for all activities
      const userIds = [...new Set(
        data
          .map(a => a.user_id)
          .filter((id): id is string => typeof id === 'string' && id !== null)
      )];
      const users: Record<string, string> = {};
      
      // Get current user session to use email if they're the one doing the action
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      for (const uid of userIds) {
        if (currentUser && uid === currentUser.id) {
          users[uid] = currentUser.email || 'You';
        } else {
          users[uid] = 'User';
        }
      }
      setUserMap(users);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <Plus className="h-4 w-4 text-green-600" />;
      case 'updated': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'deleted': return <Trash className="h-4 w-4 text-red-600" />;
      case 'status_changed': return <ArrowRight className="h-4 w-4 text-yellow-600" />;
      case 'converted': return <CheckCircle className="h-4 w-4 text-purple-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatActivity = (activity: Activity) => {
    const userName = (activity.user_id && userMap[activity.user_id]) || 'Unknown user';
    const entityName = activity.entity_name || `${activity.entity_type} #${activity.entity_id.slice(0, 8)}`;
    
    let message = `${userName} ${activity.action} ${entityName}`;
    
    if (activity.action === 'updated' && activity.changes) {
      const changedFields = Object.keys(activity.changes).join(', ');
      message += ` (${changedFields})`;
    }
    
    if (activity.action === 'status_changed' && activity.changes?.status) {
      message = `${userName} changed status of ${entityName} from ${activity.changes.status.old} to ${activity.changes.status.new}`;
    }
    
    return message;
  };

  if (loading) {
    return <div className="animate-pulse">Loading activities...</div>;
  }

  if (activities.length === 0) {
    return <div className="text-muted-foreground text-center py-4">No activities yet</div>;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {activities.map((activity) => (
        <div 
          key={activity.id} 
          className="flex items-start space-x-3 p-3 bg-card rounded-lg border border-border hover:bg-accent/50 transition-colors"
        >
          <div className="mt-1">{getActionIcon(activity.action)}</div>
          <div className="flex-1">
            <p className="text-sm text-foreground">{formatActivity(activity)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
