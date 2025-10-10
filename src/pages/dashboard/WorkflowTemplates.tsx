import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { workflowTemplates } from '@/data/workflowTemplates';

const WorkflowTemplates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);

  const createFromTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const template = workflowTemplates.find(t => t.id === templateId);
      if (!template) throw new Error('Template not found');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('workflows')
        .insert([{
          name: template.name,
          description: template.description,
          trigger_type: template.trigger_type as any,
          trigger_module: template.trigger_module,
          trigger_conditions: template.trigger_conditions,
          created_by: user.id,
          is_active: false, // Start inactive so user can review
        }])
        .select()
        .single();

      if (workflowError) throw workflowError;

      // Create actions
      const actionsData = template.actions.map(action => ({
        workflow_id: workflow.id,
        action_type: action.action_type as any,
        action_config: action.action_config,
        execution_order: action.execution_order,
        delay_minutes: action.delay_minutes,
      }));

      const { error: actionsError } = await supabase
        .from('workflow_actions')
        .insert(actionsData);

      if (actionsError) throw actionsError;

      return workflow.id;
    },
    onSuccess: (workflowId) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: 'Template created',
        description: 'Workflow created from template. Review and activate when ready.',
      });
      navigate(`/admin/automation/workflows/${workflowId}`);
    },
    onError: (error) => {
      toast({
        title: 'Error creating workflow',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setLoadingTemplateId(null);
    },
  });

  const handleUseTemplate = (templateId: string) => {
    setLoadingTemplateId(templateId);
    createFromTemplateMutation.mutate(templateId);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/automation/workflows')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workflows
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Workflow Templates</h1>
            <p className="text-muted-foreground">
              Start with pre-built workflows designed for common business processes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workflowTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {template.trigger_type.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="secondary">{template.trigger_module}</Badge>
                    <Badge variant="outline">{template.actions.length} actions</Badge>
                  </div>

                  <div className="text-sm space-y-2">
                    <div className="font-semibold text-muted-foreground">Actions:</div>
                    <ul className="space-y-1">
                      {template.actions.slice(0, 3).map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">
                            {action.action_type.replace(/_/g, ' ')}
                            {action.delay_minutes > 0 &&
                              ` (after ${action.delay_minutes} min)`}
                          </span>
                        </li>
                      ))}
                      {template.actions.length > 3 && (
                        <li className="text-xs text-muted-foreground ml-6">
                          +{template.actions.length - 3} more actions
                        </li>
                      )}
                    </ul>
                  </div>

                  <Button
                    onClick={() => handleUseTemplate(template.id)}
                    disabled={loadingTemplateId === template.id}
                    className="w-full"
                  >
                    {loadingTemplateId === template.id
                      ? 'Creating...'
                      : 'Use This Template'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need a Custom Workflow?</CardTitle>
            <CardDescription>
              Can't find what you're looking for? Create a custom workflow from scratch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/automation/workflows/new')}
            >
              Create Custom Workflow
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default WorkflowTemplates;
