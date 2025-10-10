import { supabase } from '@/integrations/supabase/client';
import { ActivityLogger } from '@/lib/activityLogger';

export type BulkOperationType = 
  | 'status_change'
  | 'assign'
  | 'delete'
  | 'export'
  | 'add_tags'
  | 'priority_change'
  | 'date_change';

interface BulkOperationParams {
  type: BulkOperationType;
  itemIds: string[];
  module: string;
  changes: Record<string, any>;
  userId: string;
}

interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

export class BulkOperationsService {
  private static BATCH_SIZE = 100;

  static async performBulkOperation(
    params: BulkOperationParams
  ): Promise<BulkOperationResult> {
    const { type, itemIds, module, changes, userId } = params;
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Process in batches
    for (let i = 0; i < itemIds.length; i += this.BATCH_SIZE) {
      const batch = itemIds.slice(i, i + this.BATCH_SIZE);
      
      try {
        const { error } = await supabase
          .from(module as any)
          .update(changes as any)
          .in('id', batch);

        if (error) throw error;

        result.success += batch.length;

        // Log activity for each item
        await Promise.all(
          batch.map(itemId =>
            ActivityLogger.log({
              userId,
              entityType: module as any,
              entityId: itemId,
              action: 'updated',
              changes: { bulk_operation: { old: null, new: type } },
              metadata: { bulk: true, batch_size: batch.length, changes },
            })
          )
        );
      } catch (error: any) {
        result.failed += batch.length;
        batch.forEach(id => {
          result.errors.push({ id, error: error.message });
        });
      }
    }

    return result;
  }

  static async bulkDelete(
    module: string,
    itemIds: string[],
    userId: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < itemIds.length; i += this.BATCH_SIZE) {
      const batch = itemIds.slice(i, i + this.BATCH_SIZE);
      
      try {
        const { error } = await supabase
          .from(module as any)
          .delete()
          .in('id', batch);

        if (error) throw error;

        result.success += batch.length;

        // Log deletions
        await Promise.all(
          batch.map(itemId =>
            ActivityLogger.log({
              userId,
              entityType: module as any,
              entityId: itemId,
              action: 'deleted',
              metadata: { bulk: true },
            })
          )
        );
      } catch (error: any) {
        result.failed += batch.length;
        batch.forEach(id => {
          result.errors.push({ id, error: error.message });
        });
      }
    }

    return result;
  }

  static async bulkAssign(
    module: string,
    itemIds: string[],
    assignedTo: string,
    userId: string
  ): Promise<BulkOperationResult> {
    return this.performBulkOperation({
      type: 'assign',
      itemIds,
      module,
      changes: { assigned_to: assignedTo },
      userId,
    });
  }

  static async bulkStatusChange(
    module: string,
    itemIds: string[],
    status: string,
    userId: string
  ): Promise<BulkOperationResult> {
    return this.performBulkOperation({
      type: 'status_change',
      itemIds,
      module,
      changes: { status },
      userId,
    });
  }

  static async bulkExport(
    module: string,
    itemIds: string[],
    format: 'csv' | 'excel' = 'csv'
  ): Promise<void> {
    // Fetch all selected items
    const { data, error } = await supabase
      .from(module as any)
      .select('*')
      .in('id', itemIds);

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('No data to export');

    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      ),
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `${module}_bulk_export_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
