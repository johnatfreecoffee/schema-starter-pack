import { supabase } from '@/integrations/supabase/client';

export interface RestoreOptions {
  mode: 'replace' | 'merge';
  tables?: string[];
}

export interface BackupFile {
  version: string;
  timestamp: string;
  type: string;
  tables: Record<string, any[]>;
}

class RestoreService {
  async parseBackupFile(file: File): Promise<BackupFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const backup = JSON.parse(content);
          
          // Validate backup structure
          if (!backup.version || !backup.tables) {
            throw new Error('Invalid backup file format');
          }
          
          resolve(backup);
        } catch (error) {
          reject(new Error('Failed to parse backup file: ' + (error as Error).message));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read backup file'));
      reader.readAsText(file);
    });
  }

  async restoreFromBackup(backup: BackupFile, options: RestoreOptions): Promise<void> {
    const tablesToRestore = options.tables || Object.keys(backup.tables);
    
    try {
      for (const tableName of tablesToRestore) {
        const records = backup.tables[tableName];
        
        if (!records || records.length === 0) {
          console.log(`Skipping empty table: ${tableName}`);
          continue;
        }

        if (options.mode === 'replace') {
          // Delete existing records first
          const { error: deleteError } = await supabase
            .from(tableName as any)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

          if (deleteError) {
            console.error(`Error deleting from ${tableName}:`, deleteError);
            throw deleteError;
          }
        }

        // Insert records in batches
        const batchSize = 100;
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize);
          
          if (options.mode === 'merge') {
            // Use upsert for merge mode
            const { error: upsertError } = await supabase
              .from(tableName as any)
              .upsert(batch, { onConflict: 'id' });

            if (upsertError) {
              console.error(`Error upserting to ${tableName}:`, upsertError);
              throw upsertError;
            }
          } else {
            // Direct insert for replace mode
            const { error: insertError } = await supabase
              .from(tableName as any)
              .insert(batch);

            if (insertError) {
              console.error(`Error inserting to ${tableName}:`, insertError);
              throw insertError;
            }
          }
        }

        console.log(`Restored ${records.length} records to ${tableName}`);
      }
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  getBackupSummary(backup: BackupFile): { table: string; count: number }[] {
    return Object.entries(backup.tables).map(([table, records]) => ({
      table,
      count: records.length,
    }));
  }
}

export const restoreService = new RestoreService();
