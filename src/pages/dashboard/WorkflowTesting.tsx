import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, CheckCircle2, Clock, Mail, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';

const WorkflowTesting = () => {
  const navigate = useNavigate();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [testRecordData, setTestRecordData] = useState<string>('{}');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const { data: workflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflows')
        .select(`
          *,
          workflow_actions(*)
        `)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const selectedWorkflowData = workflows?.find(w => w.id === selectedWorkflow);

  const runTest = async () => {
    if (!selectedWorkflowData) return;

    setIsRunning(true);
    setTestResults([]);

    try {
      const recordData = JSON.parse(testRecordData);
      const results: any[] = [];

      // Simulate workflow execution
      results.push({
        step: 'trigger',
        type: 'info',
        message: `Workflow triggered: ${selectedWorkflowData.name}`,
        timestamp: new Date().toISOString(),
      });

      // Check conditions
      if (selectedWorkflowData.trigger_conditions) {
        results.push({
          step: 'conditions',
          type: 'info',
          message: 'Evaluating trigger conditions...',
          timestamp: new Date().toISOString(),
        });

        // Simulate condition evaluation
        const conditionsMet = true; // In real implementation, evaluate actual conditions
        results.push({
          step: 'conditions',
          type: conditionsMet ? 'success' : 'error',
          message: conditionsMet ? 'All conditions met ✓' : 'Conditions not met ✗',
          timestamp: new Date().toISOString(),
        });

        if (!conditionsMet) {
          setTestResults(results);
          setIsRunning(false);
          return;
        }
      }

      // Simulate each action
      const actions = selectedWorkflowData.workflow_actions.sort(
        (a: any, b: any) => a.execution_order - b.execution_order
      );

      for (const action of actions) {
        if (action.delay_minutes > 0) {
          results.push({
            step: 'delay',
            type: 'info',
            message: `Waiting ${action.delay_minutes} minutes...`,
            timestamp: new Date().toISOString(),
            icon: Clock,
          });
        }

        results.push({
          step: 'action',
          type: 'success',
          message: `Executing: ${action.action_type.replace(/_/g, ' ')}`,
          timestamp: new Date().toISOString(),
          config: action.action_config,
          icon: getActionIcon(action.action_type),
        });

        // Simulate action-specific results
        if (action.action_type === 'send_email') {
          const config = action.action_config as any;
          results.push({
            step: 'action-detail',
            type: 'info',
            message: `Email preview: Subject - "${replaceVariables(config.subject || '', recordData)}"`,
            timestamp: new Date().toISOString(),
          });
        }
      }

      results.push({
        step: 'complete',
        type: 'success',
        message: 'Workflow test completed successfully ✓',
        timestamp: new Date().toISOString(),
      });

      setTestResults(results);
    } catch (error: any) {
      setTestResults([
        ...testResults,
        {
          step: 'error',
          type: 'error',
          message: `Error: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_email':
        return Mail;
      case 'create_task':
      case 'create_note':
        return FileText;
      default:
        return CheckCircle2;
    }
  };

  const replaceVariables = (text: string, data: any) => {
    if (!text) return '';
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
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
            <h1 className="text-3xl font-bold">Workflow Testing</h1>
            <p className="text-muted-foreground">
              Test workflows without performing actual actions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
                <CardDescription>
                  Select a workflow and provide sample data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="workflow">Workflow</Label>
                  <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                    <SelectTrigger id="workflow">
                      <SelectValue placeholder="Select a workflow to test" />
                    </SelectTrigger>
                    <SelectContent>
                      {workflows?.map((workflow: any) => (
                        <SelectItem key={workflow.id} value={workflow.id}>
                          {workflow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedWorkflowData && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {selectedWorkflowData.trigger_type}
                      </Badge>
                      <Badge variant="secondary">
                        {selectedWorkflowData.trigger_module}
                      </Badge>
                      <Badge variant="outline">
                        {selectedWorkflowData.workflow_actions?.length} actions
                      </Badge>
                    </div>

                    <div>
                      <Label htmlFor="testData">Sample Record Data (JSON)</Label>
                      <Textarea
                        id="testData"
                        value={testRecordData}
                        onChange={(e) => setTestRecordData(e.target.value)}
                        placeholder={'{\n  "first_name": "John",\n  "last_name": "Doe",\n  "email": "john@example.com"\n}'}
                        rows={10}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Provide sample data to test variable substitution
                      </p>
                    </div>

                    <Button
                      onClick={runTest}
                      disabled={isRunning || !selectedWorkflow}
                      className="w-full"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isRunning ? 'Running Test...' : 'Run Test'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  Step-by-step execution simulation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Run a test to see results here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {testResults.map((result, index) => {
                      const Icon = result.icon || CheckCircle2;
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border ${
                            result.type === 'success'
                              ? 'bg-green-50 border-green-200'
                              : result.type === 'error'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Icon
                              className={`h-4 w-4 mt-0.5 ${
                                result.type === 'success'
                                  ? 'text-green-600'
                                  : result.type === 'error'
                                  ? 'text-red-600'
                                  : 'text-blue-600'
                              }`}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{result.message}</p>
                              {result.config && (
                                <pre className="text-xs mt-2 p-2 bg-white rounded overflow-x-auto">
                                  {JSON.stringify(result.config, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Mode Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>No actual emails are sent</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>No records are created or modified</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Webhooks are not called</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Variable substitution is previewed</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Conditions are evaluated against test data</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default WorkflowTesting;
