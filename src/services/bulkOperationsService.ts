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

export type BulkSelectionMode = 'selected_ids' | 'all_matching';

interface BulkOperationParams {
  type: BulkOperationType;
  mode: BulkSelectionMode;
  itemIds?: string[];
  filters?: Record<string, any>;
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
    const { type, mode, itemIds, filters, module, changes, userId } = params;
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    if (mode === 'all_matching' && filters) {
      // Apply operation to all items matching filters
      try {
        let query = supabase.from(module as any).update(changes as any);
        
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });

        const { data, error } = await query.select('id');

        if (error) throw error;

        const affectedIds = data?.map((item: any) => item.id) || [];
        result.success = affectedIds.length;

        // Log activity for affected items (in batches to avoid overwhelming the system)
        for (let i = 0; i < affectedIds.length; i += this.BATCH_SIZE) {
          const batch = affectedIds.slice(i, i + this.BATCH_SIZE);
          await Promise.all(
            batch.map((itemId: string) =>
              ActivityLogger.log({
                userId,
                entityType: module as any,
                entityId: itemId,
                action: 'updated',
                changes: { bulk_operation: { old: null, new: type } },
                metadata: { bulk: true, mode: 'all_matching', changes },
              })
            )
          );
        }
      } catch (error: any) {
        result.failed = 1;
        result.errors.push({ id: 'bulk_all', error: error.message });
      }
    } else if (mode === 'selected_ids' && itemIds) {
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
    }

    return result;
  }

  static async bulkDelete(
    module: string,
    mode: BulkSelectionMode,
    itemIds?: string[],
    filters?: Record<string, any>,
    userId?: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    if (mode === 'all_matching' && filters) {
      // Delete all items matching filters
      try {
        let query = supabase.from(module as any).delete();
        
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });

        const { data, error } = await query.select('id');

        if (error) throw error;

        const deletedIds = data?.map((item: any) => item.id) || [];
        result.success = deletedIds.length;

        // Log deletions
        if (userId) {
          for (let i = 0; i < deletedIds.length; i += this.BATCH_SIZE) {
            const batch = deletedIds.slice(i, i + this.BATCH_SIZE);
            await Promise.all(
              batch.map((itemId: string) =>
                ActivityLogger.log({
                  userId,
                  entityType: module as any,
                  entityId: itemId,
                  action: 'deleted',
                  metadata: { bulk: true, mode: 'all_matching' },
                })
              )
            );
          }
        }
      } catch (error: any) {
        result.failed = 1;
        result.errors.push({ id: 'bulk_all', error: error.message });
      }
    } else if (mode === 'selected_ids' && itemIds) {
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
          if (userId) {
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
          }
        } catch (error: any) {
          result.failed += batch.length;
          batch.forEach(id => {
            result.errors.push({ id, error: error.message });
          });
        }
      }
    }

    return result;
  }

  static async bulkAssign(
    module: string,
    mode: BulkSelectionMode,
    assignedTo: string,
    userId: string,
    itemIds?: string[],
    filters?: Record<string, any>
  ): Promise<BulkOperationResult> {
    return this.performBulkOperation({
      type: 'assign',
      mode,
      itemIds,
      filters,
      module,
      changes: { assigned_to: assignedTo },
      userId,
    });
  }

  static async bulkStatusChange(
    module: string,
    mode: BulkSelectionMode,
    status: string,
    userId: string,
    itemIds?: string[],
    filters?: Record<string, any>
  ): Promise<BulkOperationResult> {
    return this.performBulkOperation({
      type: 'status_change',
      mode,
      itemIds,
      filters,
      module,
      changes: { status },
      userId,
    });
  }

  static async bulkExport(
    module: string,
    mode: BulkSelectionMode,
    itemIds?: string[],
    filters?: Record<string, any>,
    format: 'csv' | 'excel' = 'csv'
  ): Promise<void> {
    let query = supabase.from(module as any).select('*');

    if (mode === 'all_matching' && filters) {
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
    } else if (mode === 'selected_ids' && itemIds) {
      query = query.in('id', itemIds);
    }

    const { data, error } = await query;

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

  static async bulkTagsUpdate(
    module: string,
    selectionMode: BulkSelectionMode,
    tags: string[],
    tagMode: 'add' | 'replace',
    userId: string,
    itemIds?: string[],
    filters?: Record<string, any>
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Get items to update
    let targetIds: string[] = [];
    if (selectionMode === 'all_matching' && filters) {
      let query = supabase.from(module as any).select('id, tags');
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });
      const { data } = await query;
      targetIds = data?.map((item: any) => item.id) || [];
    } else if (selectionMode === 'selected_ids' && itemIds) {
      targetIds = itemIds;
    }

    for (let i = 0; i < targetIds.length; i += this.BATCH_SIZE) {
      const batch = targetIds.slice(i, i + this.BATCH_SIZE);
      
      try {
        for (const itemId of batch) {
          let newTags = tags;
          
          if (tagMode === 'add') {
            // Fetch current item
            const { data: currentItem, error: fetchError } = await supabase
              .from(module as any)
              .select('tags')
              .eq('id', itemId)
              .single();

            if (!fetchError && currentItem && 'tags' in currentItem && currentItem.tags && Array.isArray(currentItem.tags)) {
              // Add to existing tags
              const existingTags = currentItem.tags as string[];
              newTags = [...new Set([...existingTags, ...tags])];
            }
          }

          const { error } = await supabase
            .from(module as any)
            .update({ tags: newTags } as any)
            .eq('id', itemId);

          if (error) throw error;
        }

        result.success += batch.length;

        await Promise.all(
          batch.map(itemId =>
            ActivityLogger.log({
              userId,
              entityType: module as any,
              entityId: itemId,
              action: 'updated',
              changes: { tags: { old: null, new: tags } },
              metadata: { bulk: true, tag_mode: tagMode, selection_mode: selectionMode },
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

  static async bulkConvertLeads(
    leadIds: string[],
    accountStatus: string,
    deleteLeads: boolean,
    userId: string
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const leadId of leadIds) {
      try {
        // Fetch lead data
        const { data: lead, error: fetchError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (fetchError || !lead) throw new Error('Lead not found');

        // Create account
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .insert({
            account_name: `${lead.first_name} ${lead.last_name}`,
            status: accountStatus as any,
            notes: lead.project_details,
            source_lead_id: leadId,
          } as any)
          .select()
          .single();

        if (accountError || !account) throw new Error('Failed to create account');

        // Create contact
        const { error: contactError } = await supabase
          .from('contacts')
          .insert({
            account_id: account.id,
            first_name: lead.first_name,
            last_name: lead.last_name,
            email: lead.email,
            phone: lead.phone,
            is_primary: true,
          });

        if (contactError) throw new Error('Failed to create contact');

        // Create address
        const { error: addressError } = await supabase
          .from('addresses')
          .insert({
            entity_type: 'account',
            entity_id: account.id,
            account_id: account.id,
            street_1: lead.street_address,
            unit: lead.unit,
            city: lead.city,
            state: lead.state,
            zip: lead.zip,
            address_type: 'billing',
            is_primary: true,
          });

        if (addressError) throw new Error('Failed to create address');

        // Update lead status
        const { error: leadUpdateError } = await supabase
          .from('leads')
          .update({ status: 'converted', converted_account_id: account.id })
          .eq('id', leadId);

        if (leadUpdateError) throw new Error('Failed to update lead status');

        // Delete lead if requested
        if (deleteLeads) {
          const { error: deleteError } = await supabase
            .from('leads')
            .delete()
            .eq('id', leadId);

          if (deleteError) throw new Error('Failed to delete lead');
        }

        // Log activity
        await ActivityLogger.log({
          userId,
          entityType: 'lead',
          entityId: leadId,
          action: 'converted',
          metadata: { 
            bulk: true, 
            account_id: account.id,
            deleted: deleteLeads 
          },
        });

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({ id: leadId, error: error.message });
      }
    }

    return result;
  }
}
