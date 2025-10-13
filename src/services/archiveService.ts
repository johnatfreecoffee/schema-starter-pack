import { supabase } from '@/integrations/supabase/client';

export interface ArchiveRule {
  id: string;
  module: string;
  days_threshold: number;
  auto_archive: boolean;
}

class ArchiveService {
  async getArchiveRules(): Promise<ArchiveRule[]> {
    const { data, error } = await supabase
      .from('archive_rules')
      .select('*')
      .order('module');

    if (error) throw error;
    return data as ArchiveRule[];
  }

  async saveArchiveRule(rule: Partial<ArchiveRule>): Promise<void> {
    if (rule.id) {
      const { error } = await supabase
        .from('archive_rules')
        .update({
          days_threshold: rule.days_threshold,
          auto_archive: rule.auto_archive,
        })
        .eq('id', rule.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('archive_rules').insert({
        module: rule.module,
        days_threshold: rule.days_threshold,
        auto_archive: rule.auto_archive,
      });

      if (error) throw error;
    }
  }

  async archiveRecords(module: string, olderThan: Date): Promise<number> {
    // Get records to archive
    const { data: records, error: fetchError } = await supabase
      .from(module as any)
      .select('*')
      .lt('updated_at', olderThan.toISOString());

    if (fetchError) throw fetchError;
    if (!records || records.length === 0) return 0;

    // Move to archived_data
    const archiveRecords = records.map((record: any) => ({
      original_table: module,
      original_id: record.id,
      data: record,
    }));

    const { error: insertError } = await supabase
      .from('archived_data')
      .insert(archiveRecords);

    if (insertError) throw insertError;

    // Delete from original table
    const recordIds = records.map((r: any) => r.id);
    const { error: deleteError } = await supabase
      .from(module as any)
      .delete()
      .in('id', recordIds);

    if (deleteError) throw deleteError;

    return records.length;
  }

  async getArchivedData(module?: string, limit = 100): Promise<any[]> {
    let query = supabase
      .from('archived_data')
      .select('*')
      .order('archived_at', { ascending: false })
      .limit(limit);

    if (module) {
      query = query.eq('original_table', module);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async unarchiveRecord(archiveId: string): Promise<void> {
    // Get archived record
    const { data: archived, error: fetchError } = await supabase
      .from('archived_data')
      .select('*')
      .eq('id', archiveId)
      .single();

    if (fetchError) throw fetchError;
    if (!archived) throw new Error('Archived record not found');

    // Restore to original table
    const { error: insertError } = await supabase
      .from(archived.original_table as any)
      .insert(archived.data as any);

    if (insertError) throw insertError;

    // Remove from archive
    const { error: deleteError } = await supabase
      .from('archived_data')
      .delete()
      .eq('id', archiveId);

    if (deleteError) throw deleteError;
  }
}

export const archiveService = new ArchiveService();
