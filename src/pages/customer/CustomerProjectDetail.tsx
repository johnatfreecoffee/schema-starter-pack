import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomerLayout from '@/components/layout/CustomerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, DollarSign, User } from 'lucide-react';
import { format } from 'date-fns';
import ProjectTimeline from '@/components/customer/ProjectTimeline';
import ProjectNotes from '@/components/customer/ProjectNotes';
import ProjectFiles from '@/components/customer/ProjectFiles';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import ProjectStatusBadge from '@/components/admin/projects/ProjectStatusBadge';

const CustomerProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectDetail();
  }, [id]);

  const fetchProjectDetail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!account) return;

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          accounts!inner(account_name),
          project_manager:users!projects_project_manager_fkey(first_name, last_name),
          created_by_user:users!projects_created_by_fkey(first_name, last_name)
        `)
        .eq('id', id)
        .eq('account_id', account.id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };


  const calculateProgress = (project: any) => {
    if (project.status === 'completed') return 100;
    if (project.status === 'cancelled') return 0;
    if (!project.start_date || !project.estimated_completion) return 0;

    const start = new Date(project.start_date).getTime();
    const end = new Date(project.estimated_completion).getTime();
    const now = Date.now();

    if (now < start) return 0;
    if (now > end) return 100;

    return Math.round(((now - start) / (end - start)) * 100);
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  if (!project) {
    return (
      <CustomerLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => navigate('/customer/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Project not found</p>
            </CardContent>
          </Card>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => navigate('/customer/projects')} className="cursor-pointer">
                Projects
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.project_name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/customer/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>

        {/* Project Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl">{project.project_name}</CardTitle>
                  <ProjectStatusBadge status={project.status} />
                </div>
                {project.description && (
                  <p className="text-muted-foreground">{project.description}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Project Progress</span>
                <span className="text-muted-foreground">{calculateProgress(project)}%</span>
              </div>
              <Progress value={calculateProgress(project)} className="h-3" />
            </div>

            {/* Key Info Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {project.start_date && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Start Date</span>
                  </div>
                  <p className="font-medium">{format(new Date(project.start_date), 'MMM d, yyyy')}</p>
                </div>
              )}
              {project.estimated_completion && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Target Completion</span>
                  </div>
                  <p className="font-medium">{format(new Date(project.estimated_completion), 'MMM d, yyyy')}</p>
                </div>
              )}
              {project.budget && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Budget</span>
                  </div>
                  <p className="font-medium">${project.budget.toLocaleString()}</p>
                </div>
              )}
              {project.project_manager && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Project Manager</span>
                  </div>
                  <p className="font-medium">
                    {project.project_manager.first_name} {project.project_manager.last_name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">
                    {project.description || 'No description provided'}
                  </p>
                </div>
                {project.budget && project.spent !== null && (
                  <div>
                    <h4 className="font-medium mb-2">Budget Overview</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Spent</span>
                        <span className="font-medium">${project.spent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-medium">${project.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className="font-medium">
                          ${(project.budget - project.spent).toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={(project.spent / project.budget) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <ProjectTimeline projectId={id!} />
          </TabsContent>

          <TabsContent value="updates">
            <ProjectNotes projectId={id!} />
          </TabsContent>

          <TabsContent value="files">
            <ProjectFiles projectId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </CustomerLayout>
  );
};

export default CustomerProjectDetail;
