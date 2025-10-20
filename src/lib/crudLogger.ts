import { supabase } from '@/integrations/supabase/client';

interface LogParams {
  userId: string;
  companyId?: string;
  entityType: 'lead' | 'account' | 'contact' | 'task' | 'appointment' | 'project' | 'quote' | 'invoice' | 'service' | 'service_area' | 'page' | 'template' | 'team_member' | 'note';
  entityId: string;
  entityName: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'converted';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
}

// Sensitive fields that should never be logged
const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'password_digest',
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'secret',
  'private_key',
  'credit_card',
  'ssn',
  'social_security',
  'cvv',
  'pin'
];

export class CRUDLogger {
  /**
   * Get client IP address (best effort in browser environment)
   */
  private static async getIpAddress(): Promise<string | null> {
    try {
      // In production, you might use a service like ipapi.co or have your backend provide this
      // For now, we'll return null and let the backend handle it via request headers
      return null;
    } catch (error) {
      console.error('Failed to get IP address:', error);
      return null;
    }
  }

  /**
   * Get user agent string
   */
  private static getUserAgent(): string {
    return navigator.userAgent || 'Unknown';
  }

  /**
   * Get company ID for the current user
   */
  private static async getCompanyId(userId: string): Promise<string | null> {
    try {
      // For now, return null as company_id is optional
      // In production, you would fetch this from user_profiles or company associations
      return null;
    } catch (error) {
      console.error('Failed to get company_id:', error);
      return null;
    }
  }

  /**
   * Filter out sensitive fields from an object
   */
  private static filterSensitiveFields(obj: Record<string, any>): Record<string, any> {
    const filtered: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();
      const isSensitive = SENSITIVE_FIELDS.some(field => keyLower.includes(field));
      
      if (!isSensitive) {
        filtered[key] = value;
      } else {
        filtered[key] = '[REDACTED]';
      }
    }
    
    return filtered;
  }

  /**
   * Calculate field-level changes between old and new values
   */
  static calculateChanges(
    oldValues: Record<string, any>,
    newValues: Record<string, any>
  ): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};

    // Check all fields in newValues
    for (const key of Object.keys(newValues)) {
      if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
        changes[key] = {
          old: oldValues[key],
          new: newValues[key]
        };
      }
    }

    return changes;
  }

  /**
   * Core logging function
   */
  private static async log(params: LogParams): Promise<void> {
    try {
      const ipAddress = await this.getIpAddress();
      const userAgent = this.getUserAgent();
      const companyId = params.companyId || await this.getCompanyId(params.userId);

      // Filter sensitive fields from old/new values
      const filteredOldValues = params.oldValues 
        ? this.filterSensitiveFields(params.oldValues)
        : null;
      
      const filteredNewValues = params.newValues 
        ? this.filterSensitiveFields(params.newValues)
        : null;

      // Also filter the changes object
      const filteredChanges = params.changes 
        ? Object.entries(params.changes).reduce((acc, [key, value]) => {
            const keyLower = key.toLowerCase();
            const isSensitive = SENSITIVE_FIELDS.some(field => keyLower.includes(field));
            
            if (!isSensitive) {
              acc[key] = value;
            } else {
              acc[key] = { old: '[REDACTED]', new: '[REDACTED]' };
            }
            return acc;
          }, {} as Record<string, any>)
        : null;

      const { error } = await supabase.from('activity_logs').insert({
        user_id: params.userId,
        company_id: companyId,
        entity_type: params.entityType,
        entity_id: params.entityId,
        entity_name: params.entityName,
        action: params.action,
        old_values: filteredOldValues,
        new_values: filteredNewValues,
        changes: filteredChanges, // Keep for backward compatibility
        metadata: params.metadata,
        ip_address: ipAddress,
        user_agent: userAgent
      });

      if (error) {
        console.error('Failed to log activity:', error);
        throw error;
      }
    } catch (error) {
      console.error('Activity logging error:', error);
      // Don't throw - we don't want logging failures to break the main flow
    }
  }

  /**
   * Log CREATE operation
   */
  static async logCreate(params: {
    userId: string;
    companyId?: string;
    entityType: LogParams['entityType'];
    entityId: string;
    entityName: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.log({
      ...params,
      action: 'created',
      newValues: params.metadata // Store creation data in newValues
    });
  }

  /**
   * Log UPDATE operation
   */
  static async logUpdate(params: {
    userId: string;
    companyId?: string;
    entityType: LogParams['entityType'];
    entityId: string;
    entityName: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    changes?: Record<string, { old: any; new: any }>;
    metadata?: Record<string, any>;
  }): Promise<void> {
    // Calculate changes if oldValues and newValues provided
    const changes = params.changes || 
      (params.oldValues && params.newValues ? this.calculateChanges(params.oldValues, params.newValues) : params.changes);
    
    // Don't log if nothing changed
    if (changes && Object.keys(changes).length === 0) return;
    
    await this.log({
      ...params,
      action: 'updated',
      changes,
      oldValues: params.oldValues,
      newValues: params.newValues
    });
  }

  /**
   * Log DELETE operation
   */
  static async logDelete(params: {
    userId: string;
    companyId?: string;
    entityType: LogParams['entityType'];
    entityId: string;
    entityName: string;
    oldValues?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.log({
      ...params,
      action: 'deleted',
      oldValues: params.oldValues // Store deleted record data
    });
  }

  /**
   * Log STATUS_CHANGED operation
   */
  static async logStatusChange(params: {
    userId: string;
    companyId?: string;
    entityType: LogParams['entityType'];
    entityId: string;
    entityName: string;
    oldStatus: string;
    newStatus: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.log({
      ...params,
      action: 'status_changed',
      oldValues: { status: params.oldStatus },
      newValues: { status: params.newStatus },
      changes: {
        status: {
          old: params.oldStatus,
          new: params.newStatus
        }
      }
    });
  }

  /**
   * Log CONVERTED operation (for leads)
   */
  static async logConvert(params: {
    userId: string;
    companyId?: string;
    entityType: LogParams['entityType'];
    entityId: string;
    entityName: string;
    convertedTo: string;
    convertedToId: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.log({
      ...params,
      action: 'converted',
      metadata: {
        ...params.metadata,
        converted_to: params.convertedTo,
        converted_to_id: params.convertedToId
      }
    });
  }
}
