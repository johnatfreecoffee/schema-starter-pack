import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ProjectStatusBadge from '@/components/admin/projects/ProjectStatusBadge';
import ProjectForm from '@/components/admin/projects/ProjectForm';
import PhaseForm from '@/components/admin/projects/PhaseForm';
import TaskForm from '@/components/admin/tasks/TaskForm';
import TaskStatusBadge from '@/components/admin/tasks/TaskStatusBadge';
import TaskPriorityBadge from '@/components/admin/tasks/TaskPriorityBadge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import NotesSection from '@/components/admin/notes/NotesSection';
import ActivityFeed from '@/components/admin/ActivityFeed';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isPhaseFormOpen, setIsPhaseFormOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchUsers();
    }
  }, [id]);

  const fetchUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin', 'crm_user']);

      if (error) throw error;

      // This is a simplified version - in production you'd join with a users table
      setUsers([]);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      // Fetch project with account info
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          accounts (
            account_name,
            contacts (first_name, last_name, email, phone, is_primary)
          ),
          leads (first_name, last_name)
        `)
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('related_to_type', 'project')
        .eq('related_to_id', id)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch phases
      const { data: phasesData, error: phasesError } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', id)
        .order('phase_order');

      if (phasesError) throw phasesError;
      setPhases(phasesData || []);

      // Fetch calendar events
      const { data: eventsData, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('related_to_type', 'project')
        .eq('related_to_id', id)
        .order('start_time');

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Fetch activity
      const { data: activityData, error: activityError } = await supabase
        .from('activity_logs')
        .select('*')
        .or(`entity_id.eq.${id},parent_entity_id.eq.${id}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (activityError) throw activityError;
      setActivity(activityData || []);
    } catch (error: any) {
      toast({ title: 'Error loading project', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm('Delete this phase?')) return;

    try {
      const { error } = await supabase.from('project_phases').delete().eq('id', phaseId);
      if (error) throw error;
      toast({ title: 'Phase deleted' });
      fetchProjectDetails();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', taskId);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        entity_type: 'task',
        entity_id: taskId,
        action: 'updated',
        user_id: user?.id,
      });

      toast({ title: 'Task completed' });
      fetchProjectDetails();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading project...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Project not found</div>
        </div>
      </AdminLayout>
    );
  }

  const primaryContact = project.accounts?.contacts?.find((c: any) => c.is_primary) || project.accounts?.contacts?.[0];
  const progress = calculateProgress();

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard/projects')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{project.project_name}</h1>
            <div className="flex gap-2 items-center">
              <ProjectStatusBadge status={project.status} />
              <span className="text-muted-foreground">
                Account: <a href={`/dashboard/accounts/${project.account_id}`} className="text-primary hover:underline">
                  {project.accounts?.account_name}
                </a>
              </span>
              {project.source_lead_id && (
                <Badge variant="outline">
                  From Lead: {project.leads?.first_name} {project.leads?.last_name}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsEditFormOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress}%</div>
              <Progress value={progress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {tasks.filter(t => t.status === 'completed').length} of {tasks.length} tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project.start_date ? format(new Date(project.start_date), 'MMM d') : '-'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Est. completion: {project.estimated_completion ? format(new Date(project.estimated_completion), 'MMM d, yyyy') : 'Not set'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${project.budget ? project.budget.toLocaleString() : '-'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Spent: ${project.spent ? project.spent.toLocaleString() : '0'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {tasks.filter(t => t.status === 'pending').length} pending
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="calendar">Calendar ({events.length})</TabsTrigger>
            <TabsTrigger value="phases">Phases ({phases.length})</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="text-muted-foreground">{project.description || 'No description'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {project.status}
                  </div>
                  <div>
                    <span className="font-medium">Start Date:</span> {project.start_date || 'Not set'}
                  </div>
                  <div>
                    <span className="font-medium">Est. Completion:</span> {project.estimated_completion || 'Not set'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Account:</span> {project.accounts?.account_name}
                  </div>
                  {primaryContact && (
                    <>
                      <div>
                        <span className="font-medium">Primary Contact:</span> {primaryContact.first_name} {primaryContact.last_name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {primaryContact.email}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {primaryContact.phone}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Project Tasks</CardTitle>
                  <Button onClick={() => setIsTaskFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No tasks yet</div>
                ) : (
                  <div className="space-y-2">
                    {tasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={() => handleCompleteTask(task.id)}
                            className="h-4 w-4"
                          />
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="flex gap-2 mt-1">
                              <TaskStatusBadge status={task.status} />
                              <TaskPriorityBadge priority={task.priority} />
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No due date'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Project Events</CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No events scheduled</div>
                ) : (
                  <div className="space-y-2">
                    {events.map(event => (
                      <div key={event.id} className="p-3 border rounded-lg">
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(event.start_time), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phases">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Project Phases</CardTitle>
                  <Button onClick={() => { setSelectedPhase(null); setIsPhaseFormOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Phase
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {phases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No phases defined</div>
                ) : (
                  <div className="space-y-2">
                    {phases.map(phase => (
                      <div key={phase.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{phase.phase_name}</div>
                            <div className="text-sm text-muted-foreground">{phase.description}</div>
                            <Badge className="mt-2">{phase.status}</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedPhase(phase); setIsPhaseFormOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePhase(phase.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {(phase.start_date || phase.end_date) && (
                          <div className="text-xs text-muted-foreground mt-2">
                            {phase.start_date && `Start: ${format(new Date(phase.start_date), 'MMM d')}`}
                            {phase.start_date && phase.end_date && ' - '}
                            {phase.end_date && `End: ${format(new Date(phase.end_date), 'MMM d')}`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity History</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityFeed entityType="project" entityId={id!} limit={50} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <NotesSection entityType="project" entityId={id!} />
          </TabsContent>
        </Tabs>

        <ProjectForm
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          onSuccess={fetchProjectDetails}
          project={project}
        />

        <PhaseForm
          isOpen={isPhaseFormOpen}
          onClose={() => { setIsPhaseFormOpen(false); setSelectedPhase(null); }}
          onSuccess={fetchProjectDetails}
          projectId={id!}
          phase={selectedPhase}
        />

        <TaskForm
          open={isTaskFormOpen}
          onClose={() => setIsTaskFormOpen(false)}
          onSuccess={fetchProjectDetails}
          relatedTo={{ type: 'project', id: id!, name: project.project_name }}
          users={users}
          currentUserId={currentUserId}
        />
      </div>
    </AdminLayout>
  );
};

export default ProjectDetail;