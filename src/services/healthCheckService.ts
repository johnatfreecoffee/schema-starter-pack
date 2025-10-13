import { supabase } from '@/integrations/supabase/client';

export interface HealthIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  table: string;
  description: string;
  count: number;
  affectedRecords?: any[];
}

export interface HealthReport {
  timestamp: string;
  totalIssues: number;
  issues: HealthIssue[];
}

class HealthCheckService {
  async runHealthCheck(): Promise<HealthReport> {
    const issues: HealthIssue[] = [];

    // Check for orphaned contacts (account deleted)
    const orphanedContacts = await this.checkOrphanedContacts();
    if (orphanedContacts) issues.push(orphanedContacts);

    // Check for orphaned tasks (related entity deleted)
    const orphanedTasks = await this.checkOrphanedTasks();
    if (orphanedTasks) issues.push(orphanedTasks);

    // Check for missing required fields in leads
    const invalidLeads = await this.checkInvalidLeads();
    if (invalidLeads) issues.push(invalidLeads);

    // Check for duplicate emails
    const duplicateEmails = await this.checkDuplicateEmails();
    if (duplicateEmails) issues.push(duplicateEmails);

    // Log health check
    await supabase.from('data_health_logs').insert({
      check_type: 'full',
      issues_found: issues.length,
      details: { issues } as any,
    });

    return {
      timestamp: new Date().toISOString(),
      totalIssues: issues.length,
      issues,
    };
  }

  private async checkOrphanedContacts(): Promise<HealthIssue | null> {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, account_id, first_name, last_name');

    if (!contacts) return null;

    const { data: accounts } = await supabase.from('accounts').select('id');
    const accountIds = new Set(accounts?.map((a) => a.id) || []);

    const orphaned = contacts.filter((c) => !accountIds.has(c.account_id));

    if (orphaned.length === 0) return null;

    return {
      type: 'orphaned_contacts',
      severity: 'medium',
      table: 'contacts',
      description: 'Contacts with deleted accounts',
      count: orphaned.length,
      affectedRecords: orphaned,
    };
  }

  private async checkOrphanedTasks(): Promise<HealthIssue | null> {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, related_to_type, related_to_id, title');

    if (!tasks) return null;

    const orphaned = [];

    for (const task of tasks) {
      if (!task.related_to_id || !task.related_to_type) continue;

      const tableName =
        task.related_to_type === 'account'
          ? 'accounts'
          : task.related_to_type === 'project'
          ? 'projects'
          : task.related_to_type === 'lead'
          ? 'leads'
          : null;

      if (!tableName) continue;

      const { data } = await supabase
        .from(tableName)
        .select('id')
        .eq('id', task.related_to_id)
        .single();

      if (!data) {
        orphaned.push(task);
      }
    }

    if (orphaned.length === 0) return null;

    return {
      type: 'orphaned_tasks',
      severity: 'low',
      table: 'tasks',
      description: 'Tasks linked to deleted records',
      count: orphaned.length,
      affectedRecords: orphaned,
    };
  }

  private async checkInvalidLeads(): Promise<HealthIssue | null> {
    const { data: leads } = await supabase
      .from('leads')
      .select('id, first_name, last_name, email, phone')
      .or('phone.is.null,email.is.null');

    if (!leads || leads.length === 0) return null;

    return {
      type: 'invalid_leads',
      severity: 'medium',
      table: 'leads',
      description: 'Leads missing required contact info',
      count: leads.length,
      affectedRecords: leads,
    };
  }

  private async checkDuplicateEmails(): Promise<HealthIssue | null> {
    const { data: leads } = await supabase.from('leads').select('email');

    if (!leads) return null;

    const emailCounts = new Map<string, number>();
    leads.forEach((lead) => {
      if (lead.email) {
        emailCounts.set(lead.email, (emailCounts.get(lead.email) || 0) + 1);
      }
    });

    const duplicates = Array.from(emailCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([email, count]) => ({ email, count }));

    if (duplicates.length === 0) return null;

    return {
      type: 'duplicate_emails',
      severity: 'low',
      table: 'leads',
      description: 'Duplicate email addresses found',
      count: duplicates.length,
      affectedRecords: duplicates,
    };
  }

  async getHealthHistory(limit = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('data_health_logs')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

export const healthCheckService = new HealthCheckService();
