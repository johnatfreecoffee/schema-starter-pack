import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Workflow, Plus, Play, Pause, Trash2, Edit, Copy, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const Workflows = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflows')
        .select(`
          *,
          workflow_actions(count),
          workflow_executions(
            id,
            status,
            completed_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('workflows')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: 'Workflow updated',
        description: 'Workflow status changed successfully',
      });
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: 'Workflow deleted',
        description: 'Workflow has been removed',
      });
    },
  });

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      record_created: 'Record Created',
      record_updated: 'Record Updated',
      field_changed: 'Field Changed',
      time_based: 'Time-Based',
      form_submitted: 'Form Submitted',
    };
    return labels[triggerType] || triggerType;
  };

  const getExecutionStats = (executions: any[]) => {
    if (!executions || executions.length === 0) {
      return { total: 0, success: 0, failed: 0 };
    }

    const total = executions.length;
    const success = executions.filter(e => e.status === 'completed').length;
    const failed = executions.filter(e => e.status === 'failed').length;

    return { total, success, failed };
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Workflow Automation</h1>
            <p className="text-muted-foreground">
              Create automated workflows to streamline your business processes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/automation/testing')}
            >
              <Play className="mr-2 h-4 w-4" />
              Test
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/automation/monitor')}
            >
              <Activity className="mr-2 h-4 w-4" />
              Monitor
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/automation/templates')}
            >
              Templates
            </Button>
            <Button onClick={() => navigate('/admin/automation/workflows/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : workflows && workflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow: any) => {
              const stats = getExecutionStats(workflow.workflow_executions);
              const lastRun = workflow.workflow_executions?.[0]?.completed_at;

              return (
                <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{workflow.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {workflow.description || 'No description'}
                        </CardDescription>
                      </div>
                      <Switch
                        checked={workflow.is_active}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({
                            id: workflow.id,
                            isActive: checked,
                          })
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getTriggerLabel(workflow.trigger_type)}
                        </Badge>
                        {workflow.trigger_module && (
                          <Badge variant="secondary">
                            {workflow.trigger_module}
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Actions:</span>
                          <span className="font-medium">
                            {workflow.workflow_actions?.[0]?.count || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Executions:</span>
                          <span className="font-medium">{stats.total}</span>
                        </div>
                        {stats.total > 0 && (
                          <div className="flex justify-between">
                            <span>Success Rate:</span>
                            <span className="font-medium text-green-600">
                              {Math.round((stats.success / stats.total) * 100)}%
                            </span>
                          </div>
                        )}
                        {lastRun && (
                          <div className="flex justify-between">
                            <span>Last Run:</span>
                            <span className="font-medium">
                              {formatDistanceToNow(new Date(lastRun), { addSuffix: true })}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/automation/workflows/${workflow.id}`)}
                          className="flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Copy workflow
                            toast({
                              title: 'Coming soon',
                              description: 'Workflow duplication feature',
                            });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteWorkflowMutation.mutate(workflow.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first workflow to automate repetitive tasks
              </p>
              <Button onClick={() => navigate('/admin/automation/workflows/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Workflow
              </Button>
            </CardContent>
           </Card>
         )}
       </div>
     );
   };
   
   export default Workflows;
