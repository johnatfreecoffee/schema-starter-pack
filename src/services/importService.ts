import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';
import { CRUDLogger } from '@/lib/crudLogger';

interface ImportResult {
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

interface ColumnMapping {
  csvColumn: string;
  dbColumn: string;
}

export class ImportService {
  static parseCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }

  static async importLeads(
    data: any[],
    columnMappings: ColumnMapping[],
    options: {
      skipDuplicates: boolean;
      updateExisting: boolean;
    }
  ): Promise<ImportResult> {
    const result: ImportResult = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Process in batches of 100
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      for (let j = 0; j < batch.length; j++) {
        const rowIndex = i + j + 2; // +2 for header row and 0-indexing
        const row = batch[j];

        try {
          // Map CSV columns to DB columns
          const mappedData: any = {};
          columnMappings.forEach(({ csvColumn, dbColumn }) => {
            if (row[csvColumn] !== undefined && row[csvColumn] !== '') {
              mappedData[dbColumn] = row[csvColumn];
            }
          });

          // Validate required fields
          const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'street_address', 'city', 'state', 'zip', 'service_needed'];
          const missingFields = requiredFields.filter(field => !mappedData[field]);
          
          if (missingFields.length > 0) {
            result.errors.push({
              row: rowIndex,
              error: `Missing required fields: ${missingFields.join(', ')}`,
            });
            result.failed++;
            continue;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(mappedData.email)) {
            result.errors.push({
              row: rowIndex,
              error: 'Invalid email format',
            });
            result.failed++;
            continue;
          }

          // Check for duplicates
          if (options.skipDuplicates || options.updateExisting) {
            const { data: existing } = await supabase
              .from('leads')
              .select('id')
              .eq('email', mappedData.email)
              .maybeSingle();

            if (existing) {
              if (options.skipDuplicates) {
                result.successful++;
                continue;
              }
              if (options.updateExisting) {
                const { error } = await supabase
                  .from('leads')
                  .update(mappedData)
                  .eq('id', existing.id);

                if (error) throw error;

                await CRUDLogger.logUpdate({
                  userId: user.id,
                  entityType: 'lead',
                  entityId: existing.id,
                  entityName: `${mappedData.first_name} ${mappedData.last_name}`,
                  changes: { imported: { old: false, new: true } },
                });

                result.successful++;
                continue;
              }
            }
          }

          // Insert new record
          const { data: inserted, error } = await supabase
            .from('leads')
            .insert([mappedData])
            .select()
            .single();

          if (error) throw error;

          await CRUDLogger.logCreate({
            userId: user.id,
            entityType: 'lead',
            entityId: inserted.id,
            entityName: `${mappedData.first_name} ${mappedData.last_name}`,
            metadata: { imported: true },
          });

          result.successful++;
        } catch (error: any) {
          result.errors.push({
            row: rowIndex,
            error: error.message || 'Unknown error',
          });
          result.failed++;
        }
      }
    }

    return result;
  }

  static async importContacts(
    data: any[],
    columnMappings: ColumnMapping[],
    options: {
      skipDuplicates: boolean;
      updateExisting: boolean;
    }
  ): Promise<ImportResult> {
    const result: ImportResult = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      for (let j = 0; j < batch.length; j++) {
        const rowIndex = i + j + 2;
        const row = batch[j];

        try {
          const mappedData: any = {};
          columnMappings.forEach(({ csvColumn, dbColumn }) => {
            if (row[csvColumn] !== undefined && row[csvColumn] !== '') {
              mappedData[dbColumn] = row[csvColumn];
            }
          });

          // Validate required fields
          const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'account_id'];
          const missingFields = requiredFields.filter(field => !mappedData[field]);
          
          if (missingFields.length > 0) {
            result.errors.push({
              row: rowIndex,
              error: `Missing required fields: ${missingFields.join(', ')}`,
            });
            result.failed++;
            continue;
          }

          // Check for duplicates
          if (options.skipDuplicates || options.updateExisting) {
            const { data: existing } = await supabase
              .from('contacts')
              .select('id')
              .eq('email', mappedData.email)
              .eq('account_id', mappedData.account_id)
              .maybeSingle();

            if (existing) {
              if (options.skipDuplicates) {
                result.successful++;
                continue;
              }
              if (options.updateExisting) {
                const { error } = await supabase
                  .from('contacts')
                  .update(mappedData)
                  .eq('id', existing.id);

                if (error) throw error;

                await CRUDLogger.logUpdate({
                  userId: user.id,
                  entityType: 'account',
                  entityId: existing.id,
                  entityName: `${mappedData.first_name} ${mappedData.last_name}`,
                  changes: { imported: { old: false, new: true } },
                });

                result.successful++;
                continue;
              }
            }
          }

          const { data: inserted, error } = await supabase
            .from('contacts')
            .insert([mappedData])
            .select()
            .single();

          if (error) throw error;

          await CRUDLogger.logCreate({
            userId: user.id,
            entityType: 'account',
            entityId: inserted.id,
            entityName: `${mappedData.first_name} ${mappedData.last_name}`,
            metadata: { imported: true },
          });

          result.successful++;
        } catch (error: any) {
          result.errors.push({
            row: rowIndex,
            error: error.message || 'Unknown error',
          });
          result.failed++;
        }
      }
    }

    return result;
  }

  static async importAccounts(
    data: any[],
    columnMappings: ColumnMapping[],
    options: {
      skipDuplicates: boolean;
      updateExisting: boolean;
    }
  ): Promise<ImportResult> {
    const result: ImportResult = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      for (let j = 0; j < batch.length; j++) {
        const rowIndex = i + j + 2;
        const row = batch[j];

        try {
          const mappedData: any = {};
          columnMappings.forEach(({ csvColumn, dbColumn }) => {
            if (row[csvColumn] !== undefined && row[csvColumn] !== '') {
              mappedData[dbColumn] = row[csvColumn];
            }
          });

          // Validate required fields
          const requiredFields = ['account_name'];
          const missingFields = requiredFields.filter(field => !mappedData[field]);
          
          if (missingFields.length > 0) {
            result.errors.push({
              row: rowIndex,
              error: `Missing required fields: ${missingFields.join(', ')}`,
            });
            result.failed++;
            continue;
          }

          // Check for duplicates
          if (options.skipDuplicates || options.updateExisting) {
            const { data: existing } = await supabase
              .from('accounts')
              .select('id')
              .eq('account_name', mappedData.account_name)
              .maybeSingle();

            if (existing) {
              if (options.skipDuplicates) {
                result.successful++;
                continue;
              }
              if (options.updateExisting) {
                const { error } = await supabase
                  .from('accounts')
                  .update(mappedData)
                  .eq('id', existing.id);

                if (error) throw error;

                await CRUDLogger.logUpdate({
                  userId: user.id,
                  entityType: 'account',
                  entityId: existing.id,
                  entityName: mappedData.account_name,
                  changes: { imported: { old: false, new: true } },
                });

                result.successful++;
                continue;
              }
            }
          }

          const { data: inserted, error } = await supabase
            .from('accounts')
            .insert([mappedData])
            .select()
            .single();

          if (error) throw error;

          await CRUDLogger.logCreate({
            userId: user.id,
            entityType: 'account',
            entityId: inserted.id,
            entityName: mappedData.account_name,
            metadata: { imported: true },
          });

          result.successful++;
        } catch (error: any) {
          result.errors.push({
            row: rowIndex,
            error: error.message || 'Unknown error',
          });
          result.failed++;
        }
      }
    }

    return result;
  }

  static async saveImportHistory(
    module: string,
    filename: string,
    result: ImportResult,
    settings: any
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('import_history').insert({
      created_by: user.id,
      module,
      filename,
      total_rows: result.successful + result.failed,
      successful_rows: result.successful,
      failed_rows: result.failed,
      error_log: result.errors,
      settings,
    });
  }
}
