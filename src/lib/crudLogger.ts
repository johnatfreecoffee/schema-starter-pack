import { ActivityLogger } from './activityLogger';

interface LogParams {
  userId: string;
  entityType: 'lead' | 'account' | 'contact' | 'task' | 'appointment' | 'project' | 'quote' | 'invoice';
  entityId: string;
  entityName: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'converted';
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
}

export class CRUDLogger {
  static async logCreate(params: Omit<LogParams, 'action'>) {
    await ActivityLogger.log({ ...params, action: 'created' });
  }

  static async logUpdate(params: Omit<LogParams, 'action'> & { changes: Record<string, { old: any; new: any }> }) {
    if (Object.keys(params.changes).length === 0) return; // Don't log if nothing changed
    await ActivityLogger.log({ ...params, action: 'updated' });
  }

  static async logDelete(params: Omit<LogParams, 'action'>) {
    await ActivityLogger.log({ ...params, action: 'deleted' });
  }

  static async logStatusChange(
    params: Omit<LogParams, 'action' | 'changes'> & { oldStatus: string; newStatus: string }
  ) {
    const { oldStatus, newStatus, ...rest } = params;
    await ActivityLogger.log({
      ...rest,
      action: 'status_changed',
      changes: { status: { old: oldStatus, new: newStatus } }
    });
  }

  static async logConvert(params: Omit<LogParams, 'action'> & { convertedTo: string }) {
    const { convertedTo, ...rest } = params;
    await ActivityLogger.log({
      ...rest,
      action: 'converted',
      metadata: { convertedTo }
    });
  }

  static calculateChanges(original: any, updates: any): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};
    Object.keys(updates).forEach(key => {
      if (updates[key] !== original[key]) {
        changes[key] = { old: original[key], new: updates[key] };
      }
    });
    return changes;
  }
}
