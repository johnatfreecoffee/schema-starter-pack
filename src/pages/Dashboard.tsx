import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardActivityWidget from '@/components/admin/DashboardActivityWidget';
import { ReviewsAnalyticsWidget } from '@/components/admin/ReviewsAnalyticsWidget';
import ReportWidget from '@/components/dashboard/ReportWidget';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

const Dashboard = () => {
  // Track page performance
  usePerformanceMonitor('Dashboard');
  
  const navigate = useNavigate();
  
  // Fetch pinned reports
  const { data: pinnedReports } = useQuery({
    queryKey: ['pinned-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('id, name')
        .eq('is_pinned', true)
        .order('pin_order')
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle>Leads</CardTitle>
              <CardDescription>Manage your incoming leads</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground mt-2">Active leads</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle>Accounts</CardTitle>
              <CardDescription>View and manage accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground mt-2">Total accounts</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Track active projects</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground mt-2">Active projects</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Manage your tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground mt-2">Pending tasks</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle>Quotes</CardTitle>
              <CardDescription>View quotes and estimates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">$0</p>
              <p className="text-sm text-muted-foreground mt-2">Total value</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Track invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">$0</p>
              <p className="text-sm text-muted-foreground mt-2">Outstanding</p>
            </CardContent>
          </Card>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <DashboardActivityWidget />
            <ReviewsAnalyticsWidget />
          </div>
        </div>

        {/* Pinned Reports Section */}
        {pinnedReports && pinnedReports.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Pinned Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pinnedReports.map((report) => (
                <ReportWidget
                  key={report.id}
                  reportId={report.id}
                  size="medium"
                />
              ))}
            </div>
          </div>
        )}
      </div>
  );
};

export default Dashboard;
