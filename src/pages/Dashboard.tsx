import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardActivityWidget from '@/components/admin/DashboardActivityWidget';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  
  return (
    <AdminLayout>
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

          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/invoices')}>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Track invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">$0</p>
              <p className="text-sm text-muted-foreground mt-2">Outstanding</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/admin/automation/workflows')}>
            <CardHeader>
              <CardTitle>Workflows</CardTitle>
              <CardDescription>Automate your processes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground mt-2">Active workflows</p>
            </CardContent>
          </Card>
            </div>
          </div>

          <div className="lg:col-span-1">
            <DashboardActivityWidget />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
