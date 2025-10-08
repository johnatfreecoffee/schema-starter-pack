import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export interface AnalyticsMetrics {
  leads: {
    total: number;
    new: number;
    converted: number;
    conversionRate: number;
    byStatus: { status: string; count: number }[];
  };
  accounts: {
    total: number;
    new: number;
    active: number;
    withPortalAccess: number;
  };
  tasks: {
    total: number;
    completed: number;
    overdue: number;
    byPriority: { priority: string; count: number }[];
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    byStatus: { status: string; count: number }[];
  };
  financial: {
    totalQuotesValue: number;
    totalInvoicesValue: number;
    outstandingInvoices: number;
    paidInvoices: number;
  };
  customer: {
    totalLogins: number;
    activePortals: number;
    recentActivity: any[];
  };
}

export interface DateRange {
  start: Date;
  end: Date;
}

export class AnalyticsService {
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  static async getCurrentMetrics(dateRange?: DateRange): Promise<AnalyticsMetrics> {
    const start = dateRange?.start || startOfDay(new Date());
    const end = dateRange?.end || endOfDay(new Date());

    // Check cache first
    const cacheKey = `metrics_${format(start, 'yyyy-MM-dd')}_${format(end, 'yyyy-MM-dd')}`;
    const cached = await this.getCachedMetric(cacheKey);
    if (cached) return cached;

    // Calculate metrics in parallel for efficiency
    const [leads, accounts, tasks, projects, financial, customer] = await Promise.all([
      this.getLeadMetrics(start, end),
      this.getAccountMetrics(start, end),
      this.getTaskMetrics(start, end),
      this.getProjectMetrics(start, end),
      this.getFinancialMetrics(start, end),
      this.getCustomerMetrics(start, end),
    ]);

    const metrics: AnalyticsMetrics = {
      leads,
      accounts,
      tasks,
      projects,
      financial,
      customer,
    };

    // Cache for 5 minutes
    await this.cacheMetric(cacheKey, metrics, 5);
    return metrics;
  }

  static async getHistoricalTrends(days = 30) {
    const startDate = subDays(new Date(), days);
    
    const { data, error } = await supabase
      .from('analytics_snapshots')
      .select('*')
      .gte('snapshot_date', format(startDate, 'yyyy-MM-dd'))
      .order('snapshot_date', { ascending: true });

    if (error) {
      console.error('Error fetching historical trends:', error);
      return [];
    }

    return data || [];
  }

  private static async getLeadMetrics(start: Date, end: Date) {
    // Total leads
    const { count: total } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    // New leads in date range
    const { count: newLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    // Converted leads
    const { count: converted } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'converted')
      .gte('updated_at', start.toISOString())
      .lte('updated_at', end.toISOString());

    // Leads by status
    const { data: byStatus } = await supabase
      .from('leads')
      .select('status')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const statusCounts = byStatus?.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const conversionRate = newLeads ? ((converted || 0) / newLeads) * 100 : 0;

    return {
      total: total || 0,
      new: newLeads || 0,
      converted: converted || 0,
      conversionRate: Math.round(conversionRate * 100) / 100,
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    };
  }

  private static async getAccountMetrics(start: Date, end: Date) {
    // Total accounts
    const { count: total } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true });

    // New accounts in date range
    const { count: newAccounts } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    // Active accounts (status = 'active')
    const { count: active } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Accounts with portal access
    const { count: withPortalAccess } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('portal_enabled', true);

    return {
      total: total || 0,
      new: newAccounts || 0,
      active: active || 0,
      withPortalAccess: withPortalAccess || 0,
    };
  }

  private static async getTaskMetrics(start: Date, end: Date) {
    // Total tasks
    const { count: total } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    // Completed tasks in date range
    const { count: completed } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('completed_at', start.toISOString())
      .lte('completed_at', end.toISOString());

    // Overdue tasks
    const { count: overdue } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .lt('due_date', new Date().toISOString())
      .neq('status', 'completed');

    // Tasks by priority
    const { data: byPriority } = await supabase
      .from('tasks')
      .select('priority')
      .neq('status', 'completed');

    const priorityCounts = byPriority?.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      total: total || 0,
      completed: completed || 0,
      overdue: overdue || 0,
      byPriority: Object.entries(priorityCounts).map(([priority, count]) => ({ priority, count })),
    };
  }

  private static async getProjectMetrics(start: Date, end: Date) {
    // Total projects
    const { count: total } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    // Active projects
    const { count: active } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('status', ['planning', 'on_hold']);

    // Completed projects in date range
    const { count: completed } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('actual_completion', start.toISOString())
      .lte('actual_completion', end.toISOString());

    // Projects by status
    const { data: byStatus } = await supabase
      .from('projects')
      .select('status');

    const statusCounts = byStatus?.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      total: total || 0,
      active: active || 0,
      completed: completed || 0,
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    };
  }

  private static async getFinancialMetrics(start: Date, end: Date) {
    // Total quotes value
    const { data: quotes } = await supabase
      .from('quotes')
      .select('total_amount');
    const totalQuotesValue = quotes?.reduce((sum, q) => sum + (q.total_amount || 0), 0) || 0;

    // Total invoices value
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, status');
    const totalInvoicesValue = invoices?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0;

    // Outstanding invoices (unpaid)
    const outstandingInvoices = invoices?.reduce((sum, i) => {
      if (i.status === 'pending' || i.status === 'overdue') {
        return sum + (i.total_amount || 0);
      }
      return sum;
    }, 0) || 0;

    // Paid invoices
    const paidInvoices = invoices?.reduce((sum, i) => {
      if (i.status === 'paid') {
        return sum + (i.total_amount || 0);
      }
      return sum;
    }, 0) || 0;

    return {
      totalQuotesValue,
      totalInvoicesValue,
      outstandingInvoices,
      paidInvoices,
    };
  }

  private static async getCustomerMetrics(start: Date, end: Date) {
    // Count accounts with portal enabled
    const { count: activePortals } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('portal_enabled', true);

    // Count recent portal logins
    const { count: totalLogins } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .gte('portal_last_login', start.toISOString())
      .lte('portal_last_login', end.toISOString());

    // Get recent activity from activity_logs
    const { data: recentActivity } = await supabase
      .from('activity_logs')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      totalLogins: totalLogins || 0,
      activePortals: activePortals || 0,
      recentActivity: recentActivity || [],
    };
  }

  private static async getCachedMetric(key: string): Promise<AnalyticsMetrics | null> {
    const { data, error } = await supabase
      .from('analytics_cache')
      .select('metric_value, expires_at')
      .eq('metric_key', key)
      .single();

    if (error || !data) return null;

    // Check if cache is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null;
    }

    return data.metric_value as unknown as AnalyticsMetrics;
  }

  private static async cacheMetric(key: string, value: any, minutesToLive: number) {
    const expiresAt = new Date(Date.now() + minutesToLive * 60 * 1000);

    await supabase
      .from('analytics_cache')
      .upsert({
        metric_key: key,
        metric_value: value,
        calculated_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'metric_key'
      });
  }

  static async createDailySnapshot() {
    const today = new Date();
    const metrics = await this.getCurrentMetrics({
      start: startOfDay(today),
      end: endOfDay(today),
    });

    await supabase
      .from('analytics_snapshots')
      .upsert({
        snapshot_date: format(today, 'yyyy-MM-dd'),
        total_leads: metrics.leads.total,
        new_leads_today: metrics.leads.new,
        converted_leads_today: metrics.leads.converted,
        lead_conversion_rate: metrics.leads.conversionRate,
        total_accounts: metrics.accounts.total,
        new_accounts_today: metrics.accounts.new,
        active_accounts: metrics.accounts.active,
        total_tasks: metrics.tasks.total,
        completed_tasks_today: metrics.tasks.completed,
        overdue_tasks: metrics.tasks.overdue,
        total_projects: metrics.projects.total,
        active_projects: metrics.projects.active,
        completed_projects_today: metrics.projects.completed,
        total_quotes_value: metrics.financial.totalQuotesValue,
        total_invoices_value: metrics.financial.totalInvoicesValue,
        outstanding_invoices: metrics.financial.outstandingInvoices,
        customer_logins_today: metrics.customer.totalLogins,
      }, {
        onConflict: 'snapshot_date'
      });
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  }
}
