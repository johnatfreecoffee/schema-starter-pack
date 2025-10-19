import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Eye, Pencil, Trash2, Filter, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ProjectStatusBadge from '@/components/admin/projects/ProjectStatusBadge';
import ProjectFilters from '@/components/admin/projects/ProjectFilters';
import ProjectForm from '@/components/admin/projects/ProjectForm';
import { ProjectAdvancedFilters } from '@/components/admin/projects/ProjectAdvancedFilters';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveList, MobileCard, MobileCardField } from '@/components/ui/responsive-table';
import { MobileActionButton } from '@/components/ui/mobile-action-button';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { FilterChips } from '@/components/filters/FilterChips';
import { SavedViewsBar } from '@/components/filters/SavedViewsBar';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { ExportButton } from '@/components/admin/ExportButton';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { BulkActionsBar } from '@/components/admin/bulk/BulkActionsBar';
import { BulkOperationModal } from '@/components/admin/bulk/BulkOperationModal';
import { BulkDeleteConfirmation } from '@/components/admin/bulk/BulkDeleteConfirmation';
import { BulkOperationsService } from '@/services/bulkOperationsService';
import { useBulkUndo } from '@/hooks/useBulkUndo';
import { BulkUndoToast } from '@/components/admin/bulk/BulkUndoToast';
import { useUserRole } from '@/hooks/useUserRole';
import { BulkSelectAllBanner } from '@/components/admin/bulk/BulkSelectAllBanner';
import { BulkConfirmationModal } from '@/components/admin/bulk/BulkConfirmationModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CRUDLogger } from '@/lib/crudLogger';
import { workflowService } from '@/services/workflowService';

const Projects = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { filters, setFilters, updateFilter, clearFilters } = useUrlFilters();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);

  const bulk = useBulkSelection(projects);
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  
  const { role: userRole } = useUserRole();
  const { undoState, saveUndoState, performUndo } = useBulkUndo();

  const [confirmBulkAction, setConfirmBulkAction] = useState<{
    open: boolean;
    action: string;
    callback: () => void;
  } | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const getCurrentFilters = () => {
    const currentFilters: Record<string, any> = {};
    if (filters.status) currentFilters.status = filters.status;
    if (filters.type) currentFilters.type = filters.type;
    if (filters.assignedTo) currentFilters.assigned_to = filters.assignedTo;
    return Object.keys(currentFilters).length > 0 ? currentFilters : undefined;
  };

  useEffect(() => {
    fetchProjects();
    loadUsers();
  }, [filters]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        bulk.selectAll();
      }
      if (e.key === 'Escape' && bulk.selectedCount > 0) {
        bulk.deselectAll();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projects, bulk.selectedCount]);

  const loadUsers = async () => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('user_id, roles(name)')
        .in('roles.name', ['Admin','Super Admin','CRM User','Sales Manager','Technician','Office Staff','Read-Only User']);
      
      setUsers(data?.map((ur: any, idx: number) => ({ id: ur.user_id, name: `User ${idx + 1}` })) || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]); // Set empty array on error to prevent loops
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProjects([]);
        return;
      }
      
      let query = supabase
        .from('projects')
        .select(`
          *,
          accounts (account_name)
        `, { count: 'exact' }) as any;
      
      query = query.order('created_at', { ascending: false });

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

      const { data, error, count } = await query;

      if (error) throw error;
      setTotalCount(count || 0);

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
      console.error('Error fetching projects:', error);
      toast({ title: 'Error fetching projects', description: error.message, variant: 'destructive' });
      setProjects([]); // Set empty array on error to prevent loops
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const project = projects.find(p => p.id === id);
      const projectName = project?.project_name || 'Unknown';
      
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;

      await CRUDLogger.logDelete({
        userId: user.id,
        entityType: 'project',
        entityId: id,
        entityName: projectName
      });

      // Trigger workflow for record deletion
      try {
        await workflowService.triggerWorkflows({
          workflow_id: '',
          trigger_record_id: id,
          trigger_module: 'projects',
          trigger_data: {
            ...project,
            entity_type: 'project',
          },
        });
      } catch (workflowError) {
        console.error('⚠️ Workflow trigger failed (non-critical):', workflowError);
      }

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

  const handleBulkAction = async (actionId: string) => {
    if (actionId === 'delete') {
      setBulkDeleteOpen(true);
    } else {
      setBulkAction(actionId);
    }
  };

  const handleBulkDelete = async () => {
    const performDelete = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const filters = bulk.isAllMatchingSelected ? getCurrentFilters() : undefined;
      await BulkOperationsService.bulkDelete('projects', bulk.selectionMode, Array.from(bulk.selectedIds), filters, user.id);
      toast({ title: 'Success', description: `Deleted ${bulk.selectedCount} projects` });
      bulk.deselectAll();
      fetchProjects();
      setBulkDeleteOpen(false);
    };

    if (bulk.isAllMatchingSelected) {
      setConfirmBulkAction({
        open: true,
        action: 'permanently delete',
        callback: performDelete
      });
    } else {
      await performDelete();
    }
  };

  const handleBulkStatusChange = async (formData: Record<string, any>) => {
    const performAction = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save previous values for undo
      const previousValues = projects
        .filter(p => bulk.selectedIds.has(p.id))
        .map(p => ({ id: p.id, status: p.status }));

      const filters = bulk.isAllMatchingSelected ? getCurrentFilters() : undefined;
      await BulkOperationsService.bulkStatusChange('projects', bulk.selectionMode, formData.status, user.id, Array.from(bulk.selectedIds), filters);
      
      saveUndoState({
        operation: 'status',
        module: 'projects',
        itemIds: Array.from(bulk.selectedIds),
        previousValues,
        timestamp: new Date(),
      });

      toast({ title: 'Success', description: `Updated status for ${bulk.selectedCount} projects` });
      bulk.deselectAll();
      fetchProjects();
    };

    if (bulk.isAllMatchingSelected) {
      setConfirmBulkAction({
        open: true,
        action: `change status to "${formData.status}" for`,
        callback: performAction
      });
    } else {
      await performAction();
    }
  };

  const canBulkDelete = userRole === 'Super Admin' || userRole === 'Admin';

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-full overflow-x-hidden">
        <SavedViewsBar module="projects" currentFilters={filters} onViewSelect={setFilters} />
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate">Projects</h1>
            <p className="text-muted-foreground mt-2">Manage customer projects and track progress</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setFilterPanelOpen(true)} className="min-h-[44px]">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>}
            </Button>
            <ExportButton
              data={projects}
              moduleName="projects"
              filters={filters}
              isFiltered={activeFilterCount > 0}
              filteredCount={projects.length}
            />
            {!isMobile && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Project
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Action Button */}
        <MobileActionButton
          onClick={() => setIsFormOpen(true)}
          icon={<Plus className="h-5 w-5" />}
          label="Create New Project"
        />

        <FilterChips filters={filters} onRemove={(key) => updateFilter(key, null)} onClearAll={clearFilters} />

        {bulk.isAllSelected && !bulk.isAllMatchingSelected && totalCount > projects.length && (
          <BulkSelectAllBanner
            visibleCount={projects.length}
            totalCount={totalCount}
            isAllMatchingSelected={bulk.isAllMatchingSelected}
            onSelectAllMatching={() => bulk.selectAllMatching(totalCount)}
            onClear={bulk.deselectAll}
          />
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : (
          <ResponsiveList
            items={projects}
            emptyMessage="No projects found"
            renderCard={(project) => (
              <MobileCard
                key={project.id}
                onClick={() => navigate(`/dashboard/projects/${project.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={bulk.isSelected(project.id)}
                      onCheckedChange={() => bulk.toggleItem(project.id)}
                      className="mr-3"
                    />
                    <h3 className="font-semibold text-lg inline">{project.project_name}</h3>
                  </div>
                  <ProjectStatusBadge status={project.status} />
                </div>

                <MobileCardField
                  label="Account"
                  value={<span>{project.accounts?.account_name}</span>}
                />

                <MobileCardField
                  label="Start Date"
                  value={<span>{project.start_date ? new Date(project.start_date).toLocaleDateString() : '—'}</span>}
                />

                <MobileCardField
                  label="Est. Completion"
                  value={<span>{project.estimated_completion ? new Date(project.estimated_completion).toLocaleDateString() : '—'}</span>}
                />

                <MobileCardField
                  label="Budget"
                  value={<span className="font-semibold">${project.budget?.toLocaleString() || 0}</span>}
                />

                <MobileCardField
                  label="Progress"
                  value={
                    <div className="flex items-center gap-2 w-full">
                      <Progress value={project.progress} className="flex-1" />
                      <span className="text-sm font-medium">{project.progress}%</span>
                    </div>
                  }
                />

                <div className="flex gap-2 mt-4 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(project)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </MobileCard>
            )}
            renderTable={() => (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={bulk.isAllSelected}
                          onCheckedChange={() => bulk.toggleAll(projects)}
                        />
                      </TableHead>
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
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={bulk.isSelected(project.id)}
                            onCheckedChange={() => bulk.toggleItem(project.id)}
                          />
                        </TableCell>
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
          />
        )}

        <MobileActionButton
          onClick={() => setIsFormOpen(true)}
          icon={<Plus className="h-5 w-5" />}
          label="Create New Project"
        />

        <ProjectForm isOpen={isFormOpen} onClose={handleFormClose} onSuccess={fetchProjects} project={selectedProject} />
        
        <FilterPanel open={filterPanelOpen} onClose={() => setFilterPanelOpen(false)} title="Filter Projects" onClearAll={clearFilters}>
          <ProjectAdvancedFilters values={filters} onChange={updateFilter} users={users} />
        </FilterPanel>

        <BulkActionsBar
          selectedCount={bulk.selectedCount}
          onClear={bulk.deselectAll}
          actions={[
            { id: 'status', label: 'Change Status', icon: <Badge className="h-4 w-4" /> },
            { id: 'assign', label: 'Assign Manager', icon: <UserPlus className="h-4 w-4" /> },
            ...(canBulkDelete ? [{ id: 'delete', label: 'Delete', icon: <Trash2 className="h-4 w-4" />, variant: 'destructive' as const }] : []),
          ]}
          onAction={handleBulkAction}
        />

        <BulkOperationModal
          open={bulkAction === 'status'}
          onOpenChange={(open) => !open && setBulkAction(null)}
          title="Change Status"
          description="Update status for selected projects"
          selectedCount={bulk.selectedCount}
          onConfirm={handleBulkStatusChange}
          fields={[
            { name: 'status', label: 'New Status', type: 'select', required: true, options: [
              { value: 'planning', label: 'Planning' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'on_hold', label: 'On Hold' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
          ]}
        />

        <BulkDeleteConfirmation
          open={bulkDeleteOpen}
          onOpenChange={setBulkDeleteOpen}
          itemCount={bulk.selectedCount}
          itemType="projects"
          itemNames={bulk.selectedItems.map(p => p.project_name)}
          onConfirm={handleBulkDelete}
        />

        <BulkConfirmationModal
          open={confirmBulkAction?.open || false}
          onOpenChange={(open) => !open && setConfirmBulkAction(null)}
          totalCount={bulk.selectedCount}
          action={confirmBulkAction?.action || ''}
          onConfirm={() => {
            confirmBulkAction?.callback();
            setConfirmBulkAction(null);
          }}
        />

        {undoState && (
          <BulkUndoToast
            count={undoState.itemIds.length}
            onUndo={async () => {
              await performUndo();
              fetchProjects();
            }}
          />
        )}
      </div>
  );
};

export default Projects;
