import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { MetricCard } from '@/components/analytics/MetricCard';
import { RevenueChart } from '@/components/analytics/RevenueChart';
import { LeadFunnelChart } from '@/components/analytics/LeadFunnelChart';
import { ProjectStatusChart } from '@/components/analytics/ProjectStatusChart';
import { TasksCompletedChart } from '@/components/analytics/TasksCompletedChart';
import { ActivityFeedWidget } from '@/components/analytics/ActivityFeedWidget';
import { DateRangeSelector } from '@/components/analytics/DateRangeSelector';
import { AnalyticsService, type AnalyticsMetrics } from '@/services/analyticsService';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, TrendingUp, Users, CheckSquare, FolderKanban } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { startOfDay, endOfDay, subDays } from 'date-fns';

const Analytics = () => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: startOfDay(subDays(new Date(), 30)),
    end: endOfDay(new Date()),
  });

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [currentMetrics, historical] = await Promise.all([
        AnalyticsService.getCurrentMetrics(dateRange),
        AnalyticsService.getHistoricalTrends(30),
      ]);
      setMetrics(currentMetrics);
      setHistoricalData(historical);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const handleDateRangeChange = (range: { start: Date; end: Date }) => {
    setDateRange(range);
  };

  const handleRefresh = () => {
    loadAnalytics();
    toast({
      title: 'Refreshed',
      description: 'Analytics data has been updated',
    });
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your analytics report is being generated',
    });
    // TODO: Implement actual export functionality
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-10 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!metrics) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">No analytics data available</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive insights across your CRM system
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="mb-8">
          <DateRangeSelector onChange={handleDateRangeChange} />
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={AnalyticsService.formatCurrency(metrics.financial.totalInvoicesValue)}
            icon={TrendingUp}
            colorClass="bg-green-100 text-green-600"
          />
          <MetricCard
            title="Active Projects"
            value={metrics.projects.active}
            icon={FolderKanban}
            colorClass="bg-blue-100 text-blue-600"
          />
          <MetricCard
            title="Open Leads"
            value={metrics.leads.total - metrics.leads.converted}
            icon={Users}
            colorClass="bg-purple-100 text-purple-600"
          />
          <MetricCard
            title="Pending Invoices"
            value={AnalyticsService.formatCurrency(metrics.financial.outstandingInvoices)}
            icon={CheckSquare}
            colorClass="bg-orange-100 text-orange-600"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RevenueChart data={historicalData} />
          <LeadFunnelChart data={metrics.leads.byStatus} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ProjectStatusChart data={metrics.projects.byStatus} />
          <TasksCompletedChart data={historicalData} />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Lead Conversion Rate"
            value={`${metrics.leads.conversionRate}%`}
            trend={5.2}
            icon={TrendingUp}
            colorClass="bg-primary/10 text-primary"
          />
          <MetricCard
            title="Tasks Completed"
            value={metrics.tasks.completed}
            icon={CheckSquare}
            colorClass="bg-secondary/10 text-secondary"
          />
          <MetricCard
            title="Overdue Tasks"
            value={metrics.tasks.overdue}
            icon={CheckSquare}
            colorClass="bg-red-100 text-red-600"
          />
          <MetricCard
            title="Customer Portal Logins"
            value={metrics.customer.totalLogins}
            icon={Users}
            colorClass="bg-accent/10 text-accent"
          />
        </div>

        {/* Activity Feed */}
        <ActivityFeedWidget activities={metrics.customer.recentActivity} />
      </div>
    </AdminLayout>
  );
};

export default Analytics;
