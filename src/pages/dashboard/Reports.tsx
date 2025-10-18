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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, BarChart3, LineChart, PieChart, Table as TableIcon, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { REPORT_TEMPLATES } from '@/data/reportTemplates';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileActionButton } from '@/components/ui/mobile-action-button';

const Reports = () => {
  const navigate = useNavigate();
  const { canCreate, hasAccess } = useUserPermissions('reports');
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();

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
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Create custom reports and visualize your CRM data
            </p>
          </div>
          {canCreate && !isMobile && (
            <Button onClick={() => navigate('/dashboard/reports/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Report
            </Button>
          )}
        </div>

        {/* Mobile Action Button */}
        {canCreate && (
          <MobileActionButton
            onClick={() => navigate('/dashboard/reports/new')}
            icon={<Plus className="h-5 w-5" />}
            label="Create New Report"
          />
        )}

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

        <Tabs defaultValue="my-reports" className="w-full">
          <TabsList>
            <TabsTrigger value="my-reports">My Reports</TabsTrigger>
            <TabsTrigger value="templates">
              <Sparkles className="mr-2 h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-reports" className="mt-6">
            {!filteredReports || filteredReports.length === 0 ? (
              <Card className="p-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first custom report or use a template to get started
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
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Pre-built Report Templates</h3>
              <p className="text-muted-foreground text-sm">
                Start with a template and customize it to fit your needs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {REPORT_TEMPLATES.map((template, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getVisualizationIcon(template.visualization_type)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`h-2 w-2 rounded-full ${getDataSourceColor(template.data_source)}`} />
                        <span className="text-xs text-muted-foreground capitalize">
                          {template.data_source}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={async () => {
                      if (!canCreate) {
                        toast.error('You do not have permission to create reports');
                        return;
                      }
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        const { data, error } = await supabase
                          .from('reports')
                          .insert({
                            ...template,
                            created_by: user?.id
                          })
                          .select()
                          .single();
                        
                        if (error) throw error;
                        toast.success('Template created successfully');
                        navigate(`/dashboard/reports/${data.id}`);
                      } catch (error) {
                        toast.error('Failed to create report from template');
                      }
                    }}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Use Template
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Reports;
