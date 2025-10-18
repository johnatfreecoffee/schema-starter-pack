import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FolderKanban, Calendar, FileText, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import ProjectStatusBadge from '@/components/admin/projects/ProjectStatusBadge';
import UpcomingAppointments from '@/components/customer/UpcomingAppointments';
import RecentPayments from '@/components/customer/RecentPayments';

const CustomerDashboard = () => {
  const [stats, setStats] = useState({
    activeProjects: 0,
    upcomingAppointments: 0,
    outstandingInvoices: 0,
    lastLogin: null as string | null,
  });
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get account for this user
      const { data: account } = await supabase
        .from('accounts')
        .select('id, portal_last_login')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!account) return;

      // Get active projects count
      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', account.id)
        .in('status', ['planning', 'active']);

      // Get upcoming appointments count
      const today = new Date().toISOString();
      const { count: appointmentsCount } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true })
        .eq('related_to_type', 'account')
        .eq('related_to_id', account.id)
        .gte('start_time', today);

      // Get outstanding invoices total
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('account_id', account.id)
        .in('status', ['pending', 'overdue'] as any);

      const outstandingTotal = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

      // Get recent projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setStats({
        activeProjects: projectsCount || 0,
        upcomingAppointments: appointmentsCount || 0,
        outstandingInvoices: outstandingTotal,
        lastLogin: account.portal_last_login,
      });

      setRecentProjects(projects || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold">Welcome Back!</h1>
          {stats.lastLogin && (
            <p className="text-muted-foreground mt-1">
              Last login: {format(new Date(stats.lastLogin), 'PPpp')}
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">Projects in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingAppointments}</div>
              <p className="text-xs text-muted-foreground">Scheduled events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.outstandingInvoices.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Amount due</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Login</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.lastLogin ? format(new Date(stats.lastLogin), 'MMM d, yyyy') : 'First time'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.lastLogin ? format(new Date(stats.lastLogin), 'h:mm a') : 'Welcome!'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Projects</CardTitle>
            <Link to="/customer/projects" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No projects yet</p>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{project.project_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.start_date ? format(new Date(project.start_date), 'MMM d, yyyy') : 'No start date'}
                      </p>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments Widget */}
        <UpcomingAppointments />

        {/* Recent Payments Widget */}
        <RecentPayments />
    </div>
  );
};

export default CustomerDashboard;
