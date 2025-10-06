import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error logging out');
    } else {
      toast.success('Logged out successfully');
      navigate('/auth');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {session?.user?.email}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

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
    </div>
  );
};

export default Dashboard;
