import { supabase } from '@/integrations/supabase/client';

interface LogActivity {
  userId: string;
  entityType: 'lead' | 'account' | 'contact' | 'task' | 'appointment' | 'project' | 'quote' | 'invoice';
  entityId: string;
  entityName?: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'converted';
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
}

export class ActivityLogger {
  static async log(activity: LogActivity) {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert([{
          user_id: activity.userId,
          entity_type: activity.entityType,
          entity_id: activity.entityId,
          entity_name: activity.entityName || null,
          action: activity.action as any,
          changes: activity.changes || null,
          metadata: activity.metadata || null
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't throw - logging should not break the main operation
    }
  }

  static async getEntityActivities(entityType: string, entityId: string, limit = 50) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getUserActivities(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getRecentActivities(limit = 100) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
