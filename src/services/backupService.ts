import { supabase } from '@/integrations/supabase/client';

export interface BackupOptions {
  type: 'full' | 'crm' | 'pages' | 'custom';
  tables?: string[];
}

export interface BackupMetadata {
  id: string;
  backup_type: string;
  file_size: number;
  status: string;
  tables_included: string[];
  record_counts: Record<string, number>;
  created_at: string;
  error_message?: string;
  restored_at?: string;
  restored_by?: string;
}

class BackupService {
  private readonly CRM_TABLES = [
    'leads',
    'accounts',
    'contacts',
    'projects',
    'tasks',
    'calendar_events',
    'quotes',
    'invoices',
    'quote_items',
    'invoice_items',
  ];

  private readonly PAGE_TABLES = [
    'services',
    'service_areas',
    'generated_pages',
    'static_pages',
    'page_templates',
    'page_seo',
  ];

  private readonly SETTINGS_TABLES = [
    'company_settings',
    'site_settings',
    'form_settings',
    'ai_training',
    'email_templates',
  ];

  async createBackup(options: BackupOptions): Promise<BackupMetadata> {
    const tables = this.getTablesForBackupType(options.type, options.tables);
    const backupData: Record<string, any[]> = {};
    const recordCounts: Record<string, number> = {};

    // Create backup record
    const { data: backup, error: backupError } = await supabase
      .from('backups')
      .insert({
        backup_type: options.type,
        tables_included: tables,
        status: 'in_progress',
      })
      .select()
      .single();

    if (backupError) throw backupError;

    try {
      // Fetch data from each table
      for (const table of tables) {
        const { data, error } = await supabase.from(table as any).select('*');
        
        if (error) {
          console.error(`Error backing up ${table}:`, error);
          continue;
        }

        backupData[table] = data || [];
        recordCounts[table] = data?.length || 0;
      }

      // Create backup file
      const backupJson = JSON.stringify({
        version: '1.0',
        timestamp: new Date().toISOString(),
        type: options.type,
        tables: backupData,
      });

      // Calculate size
      const fileSize = new Blob([backupJson]).size;

      // Update backup record with success
      const { data: updatedBackup, error: updateError } = await supabase
        .from('backups')
        .update({
          status: 'success',
          file_size: fileSize,
          record_counts: recordCounts,
        })
        .eq('id', backup.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Download backup file
      this.downloadBackupFile(backupJson, backup.id);

      return updatedBackup as BackupMetadata;
    } catch (error: any) {
      // Update backup record with failure
      await supabase
        .from('backups')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', backup.id);

      throw error;
    }
  }

  private getTablesForBackupType(type: string, customTables?: string[]): string[] {
    switch (type) {
      case 'full':
        return [...this.CRM_TABLES, ...this.PAGE_TABLES, ...this.SETTINGS_TABLES];
      case 'crm':
        return this.CRM_TABLES;
      case 'pages':
        return this.PAGE_TABLES;
      case 'custom':
        return customTables || [];
      default:
        return [];
    }
  }

  private downloadBackupFile(content: string, backupId: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${backupId}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async getBackupHistory(limit = 30): Promise<BackupMetadata[]> {
    const { data, error } = await supabase
      .from('backups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as BackupMetadata[];
  }

  async deleteBackup(backupId: string): Promise<void> {
    const { error } = await supabase.from('backups').delete().eq('id', backupId);
    if (error) throw error;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export const backupService = new BackupService();
