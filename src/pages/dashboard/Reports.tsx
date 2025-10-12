import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, BarChart3, LineChart, PieChart, Table as TableIcon, Clock } from 'lucide-react';
import { toast } from 'sonner';

const Reports = () => {
  const navigate = useNavigate();
  const { canCreate, hasAccess } = useUserPermissions('reports');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredReports = reports?.filter(report =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.data_source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case 'bar': return <BarChart3 className="h-5 w-5" />;
      case 'line': return <LineChart className="h-5 w-5" />;
      case 'pie': return <PieChart className="h-5 w-5" />;
      default: return <TableIcon className="h-5 w-5" />;
    }
  };

  const getDataSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      leads: 'bg-blue-500',
      accounts: 'bg-green-500',
      contacts: 'bg-purple-500',
      projects: 'bg-orange-500',
      tasks: 'bg-yellow-500',
      quotes: 'bg-cyan-500',
      invoices: 'bg-red-500',
    };
    return colors[source] || 'bg-gray-500';
  };

  if (!hasAccess) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">You don't have permission to access reports.</p>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Create custom reports and visualize your CRM data
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => navigate('/dashboard/reports/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Report
            </Button>
          )}
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {!filteredReports || filteredReports.length === 0 ? (
          <Card className="p-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first custom report to start analyzing your CRM data
            </p>
            {canCreate && (
              <Button onClick={() => navigate('/dashboard/reports/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Report
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Card
                key={report.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/dashboard/reports/${report.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getVisualizationIcon(report.visualization_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{report.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`h-2 w-2 rounded-full ${getDataSourceColor(report.data_source)}`} />
                        <span className="text-xs text-muted-foreground capitalize">
                          {report.data_source}
                        </span>
                      </div>
                    </div>
                  </div>
                  {report.is_scheduled && (
                    <Badge variant="secondary" className="ml-2">
                      <Clock className="mr-1 h-3 w-3" />
                      Scheduled
                    </Badge>
                  )}
                </div>

                {report.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {report.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                  <span>
                    Created by admin
                  </span>
                  <span>
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Reports;
