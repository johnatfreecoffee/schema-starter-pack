import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Pencil, Trash2, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ProjectStatusBadge from '@/components/admin/projects/ProjectStatusBadge';
import ProjectFilters from '@/components/admin/projects/ProjectFilters';
import ProjectForm from '@/components/admin/projects/ProjectForm';
import { ProjectAdvancedFilters } from '@/components/admin/projects/ProjectAdvancedFilters';
import { Progress } from '@/components/ui/progress';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { FilterChips } from '@/components/filters/FilterChips';
import { SavedViewsBar } from '@/components/filters/SavedViewsBar';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Projects = () => {
  const navigate = useNavigate();
  const { filters, setFilters, updateFilter, clearFilters } = useUrlFilters();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchProjects();
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      const { data } = await supabase.from('user_roles').select('user_id').in('role', ['admin', 'crm_user']);
      setUsers(data?.map((ur, idx) => ({ id: ur.user_id, name: `User ${idx + 1}` })) || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('projects')
        .select(`
          *,
          accounts (account_name)
        `)
        .order('created_at', { ascending: false });

      if (filters.status?.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId);
      }
      if (filters.assignedTo) {
        query = query.eq('project_manager', filters.assignedTo);
      }
      if (filters.startDateFrom) {
        query = query.gte('start_date', new Date(filters.startDateFrom).toISOString());
      }
      if (filters.budgetMin) {
        query = query.gte('budget', filters.budgetMin);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch tasks separately for each project to calculate progress
      const projectsWithProgress = await Promise.all((data || []).map(async (project) => {
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, status')
          .eq('related_to_type', 'project')
          .eq('related_to_id', project.id);

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
          return { ...project, progress: 0, taskCount: 0 };
        }

        const completedTasks = (tasks || []).filter((t: any) => t.status === 'completed').length;
        const progress = tasks && tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
        return { ...project, progress, taskCount: tasks?.length || 0 };
      }));

      setProjects(projectsWithProgress);
    } catch (error: any) {
      toast({ title: 'Error fetching projects', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;

      await supabase.from('activity_logs').insert({
        entity_type: 'project',
        entity_id: id,
        action: 'deleted',
        user_id: user?.id,
      });

      toast({ title: 'Project deleted successfully' });
      fetchProjects();
    } catch (error: any) {
      toast({ title: 'Error deleting project', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (project: any) => {
    setSelectedProject(project);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedProject(null);
  };

  const activeFilterCount = Object.keys(filters).filter(k => filters[k]).length;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <SavedViewsBar module="projects" currentFilters={filters} onViewSelect={setFilters} />
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-2">Manage customer projects and track progress</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFilterPanelOpen(true)}>
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>}
            </Button>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Project
            </Button>
          </div>
        </div>

        <FilterChips filters={filters} onRemove={(key) => updateFilter(key, null)} onClearAll={clearFilters} />

        {loading ? (
              <div className="text-center py-12">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No projects found
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Est. Completion</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <ProjectStatusBadge status={project.status} />
                        </TableCell>
                        <TableCell 
                          className="font-medium"
                          onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                        >
                          {project.project_name}
                        </TableCell>
                        <TableCell>
                          {project.accounts?.account_name}
                        </TableCell>
                        <TableCell>
                          {project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {project.estimated_completion ? new Date(project.estimated_completion).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={project.progress} className="w-16" />
                            <span className="text-sm text-muted-foreground">{project.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">•••</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/projects/${project.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(project)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(project.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </div>
          )}

        <ProjectForm isOpen={isFormOpen} onClose={handleFormClose} onSuccess={fetchProjects} project={selectedProject} />
        
        <FilterPanel open={filterPanelOpen} onClose={() => setFilterPanelOpen(false)} title="Filter Projects" onClearAll={clearFilters}>
          <ProjectAdvancedFilters values={filters} onChange={updateFilter} users={users} />
        </FilterPanel>
      </div>
    </AdminLayout>
  );
};

export default Projects;
