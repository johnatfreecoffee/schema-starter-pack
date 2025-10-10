import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WorkflowTriggerCard } from '@/components/admin/workflow/WorkflowTriggerCard';
import { WorkflowActionCard } from '@/components/admin/workflow/WorkflowActionCard';
import { WorkflowConditionBuilder } from '@/components/admin/workflow/WorkflowConditionBuilder';

interface WorkflowAction {
  id?: string;
  action_type: string;
  action_config: any;
  execution_order: number;
  delay_minutes: number;
}

const WorkflowBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = id !== 'new';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<string>('');
  const [triggerModule, setTriggerModule] = useState<string>('');
  const [triggerConditions, setTriggerConditions] = useState<any>(null);
  const [actions, setActions] = useState<WorkflowAction[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  // Load workflow if editing
  const { data: workflow } = useQuery({
    queryKey: ['workflow', id],
    queryFn: async () => {
      if (!isEditing) return null;

      const { data, error } = await supabase
        .from('workflows')
        .select(`
          *,
          workflow_actions(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
      setTriggerType(workflow.trigger_type);
      setTriggerModule(workflow.trigger_module || '');
      setTriggerConditions(workflow.trigger_conditions);
      setActions(
        workflow.workflow_actions?.map((a: any) => ({
          id: a.id,
          action_type: a.action_type,
          action_config: a.action_config,
          execution_order: a.execution_order,
          delay_minutes: a.delay_minutes,
        })) || []
      );
    }
  }, [workflow]);

  const saveWorkflowMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const workflowData = {
        name,
        description,
        trigger_type: triggerType as any,
        trigger_module: triggerModule || null,
        trigger_conditions: triggerConditions,
        created_by: user.id,
      };

      let workflowId = id;

      if (isEditing) {
        const { error } = await supabase
          .from('workflows')
          .update(workflowData)
          .eq('id', id);

        if (error) throw error;

        // Delete existing actions and recreate
        await supabase
          .from('workflow_actions')
          .delete()
          .eq('workflow_id', id);
      } else {
        const { data, error } = await supabase
          .from('workflows')
          .insert([workflowData])
          .select()
          .single();

        if (error) throw error;
        workflowId = data.id;
      }

      // Insert actions
      if (actions.length > 0) {
        const actionsData = actions.map((action, index) => ({
          workflow_id: workflowId,
          action_type: action.action_type as any,
          action_config: action.action_config,
          execution_order: index,
          delay_minutes: action.delay_minutes,
        }));

        const { error } = await supabase
          .from('workflow_actions')
          .insert(actionsData);

        if (error) throw error;
      }

      return workflowId;
    },
    onSuccess: (workflowId) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast({
        title: 'Workflow saved',
        description: 'Your workflow has been saved successfully',
      });
      navigate('/admin/automation/workflows');
    },
    onError: (error) => {
      toast({
        title: 'Error saving workflow',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addAction = () => {
    setActions([
      ...actions,
      {
        action_type: 'send_email',
        action_config: {},
        execution_order: actions.length,
        delay_minutes: 0,
      },
    ]);
  };

  const updateAction = (index: number, updatedAction: WorkflowAction) => {
    const newActions = [...actions];
    newActions[index] = updatedAction;
    setActions(newActions);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const canSave = name && triggerType && actions.length > 0;

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/automation/workflows')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              {isEditing ? 'Edit Workflow' : 'Create New Workflow'}
            </h1>
          </div>
          <Button
            onClick={() => saveWorkflowMutation.mutate()}
            disabled={!canSave || saveWorkflowMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Workflow
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[
            { num: 1, label: 'Basic Info' },
            { num: 2, label: 'Trigger' },
            { num: 3, label: 'Conditions' },
            { num: 4, label: 'Actions' },
          ].map((step, index) => (
            <div key={step.num} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.num
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-background text-muted-foreground'
                }`}
              >
                {step.num}
              </div>
              <span className="ml-2 text-sm font-medium">{step.label}</span>
              {index < 3 && (
                <div className="w-16 h-0.5 bg-muted mx-4"></div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {/* Step 1: Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Basic Information</CardTitle>
              <CardDescription>Give your workflow a name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Workflow Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., New Lead Auto-Response"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this workflow do?"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Choose Trigger */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Choose Trigger</CardTitle>
              <CardDescription>When should this workflow run?</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowTriggerCard
                triggerType={triggerType}
                triggerModule={triggerModule}
                onTriggerChange={(type, module) => {
                  setTriggerType(type);
                  setTriggerModule(module);
                  setCurrentStep(Math.max(currentStep, 2));
                }}
              />
            </CardContent>
          </Card>

          {/* Step 3: Set Conditions (Optional) */}
          {triggerType && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Set Conditions (Optional)</CardTitle>
                <CardDescription>
                  Add conditions to filter when this workflow runs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowConditionBuilder
                  module={triggerModule}
                  conditions={triggerConditions}
                  onConditionsChange={(conditions) => {
                    setTriggerConditions(conditions);
                    setCurrentStep(Math.max(currentStep, 3));
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Add Actions */}
          {triggerType && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Step 4: Add Actions</CardTitle>
                    <CardDescription>
                      What should happen when this workflow is triggered?
                    </CardDescription>
                  </div>
                  <Button onClick={addAction} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Action
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {actions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-4">No actions added yet</p>
                    <Button onClick={addAction} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Action
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {actions.map((action, index) => (
                      <div key={index} className="relative">
                        {index > 0 && (
                          <div className="absolute -top-4 left-8 w-0.5 h-4 bg-muted"></div>
                        )}
                        <WorkflowActionCard
                          action={action}
                          index={index}
                          onUpdate={(updated) => updateAction(index, updated)}
                          onRemove={() => removeAction(index)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default WorkflowBuilder;
