import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  count?: number;
  message?: string;
}

export const SystemHealthCheck = () => {
  const { data: healthChecks, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const checks: HealthCheck[] = [];

      // Check database connection
      try {
        const { error } = await supabase.from('company_settings').select('count').single();
        checks.push({
          name: 'Database Connection',
          status: error ? 'fail' : 'pass',
          message: error ? error.message : 'Connected'
        });
      } catch (e) {
        checks.push({ name: 'Database Connection', status: 'fail', message: 'Connection failed' });
      }

      // Count records in each table
      const tables = [
        'company_settings', 'services', 'service_areas', 'templates', 'generated_pages',
        'leads', 'accounts', 'contacts', 'tasks', 'calendar_events', 'projects',
        'quotes', 'invoices', 'user_roles'
      ] as const;

      for (const table of tables) {
        try {
          const { count, error } = await supabase.from(table as any).select('*', { count: 'exact', head: true });
          checks.push({
            name: `${table} records`,
            status: error ? 'fail' : (count === 0 ? 'warning' : 'pass'),
            count: count || 0,
            message: error?.message
          });
        } catch (e) {
          checks.push({ name: `${table} records`, status: 'fail', count: 0 });
        }
      }

      // Check email templates
      const { count: emailCount } = await supabase
        .from('email_templates')
        .select('*', { count: 'exact', head: true });
      checks.push({
        name: 'Email Templates',
        status: emailCount && emailCount > 0 ? 'pass' : 'warning',
        count: emailCount || 0,
        message: emailCount === 0 ? 'No email templates configured' : undefined
      });

      // Check auth status
      const { data: { session } } = await supabase.auth.getSession();
      checks.push({
        name: 'Authentication',
        status: session ? 'pass' : 'fail',
        message: session ? 'Authenticated' : 'Not authenticated'
      });

      return checks;
    }
  });

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    if (status === 'pass') return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (status === 'fail') return <XCircle className="h-5 w-5 text-red-600" />;
    return <AlertCircle className="h-5 w-5 text-yellow-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health Check</CardTitle>
        <CardDescription>Real-time status of all system components</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {healthChecks?.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <div>
                    <p className="font-medium">{check.name}</p>
                    {check.message && (
                      <p className="text-sm text-muted-foreground">{check.message}</p>
                    )}
                  </div>
                </div>
                {check.count !== undefined && (
                  <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {check.count} records
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};