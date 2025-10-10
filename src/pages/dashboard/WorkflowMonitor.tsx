import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle, Clock, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const WorkflowMonitor = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workflowFilter, setWorkflowFilter] = useState<string>('all');

  const { data: workflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflows')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const { data: executions, isLoading, refetch } = useQuery({
    queryKey: ['workflow-executions', statusFilter, workflowFilter],
    queryFn: async () => {
      let query = supabase
        .from('workflow_executions')
        .select(`
          *,
          workflows(name)
        `)
        .order('started_at', { ascending: false })
        .limit(50);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      if (workflowFilter !== 'all') {
        query = query.eq('workflow_id', workflowFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['workflow-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('status')
        .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const total = data.length;
      const completed = data.filter(e => e.status === 'completed').length;
      const failed = data.filter(e => e.status === 'failed').length;
      const pending = data.filter(e => e.status === 'pending').length;
      const running = data.filter(e => e.status === 'running').length;

      return { total, completed, failed, pending, running };
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      completed: { variant: 'default', icon: CheckCircle2 },
      failed: { variant: 'destructive', icon: XCircle },
      pending: { variant: 'secondary', icon: Clock },
      running: { variant: 'outline', icon: Activity },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/automation/workflows')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Workflow Monitor</h1>
              <p className="text-muted-foreground">
                Real-time execution tracking and analytics
              </p>
            </div>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total (24h)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Failed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Running</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Success Rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.total > 0
                    ? Math.round((stats.completed / stats.total) * 100)
                    : 0}
                  %
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Workflows" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workflows</SelectItem>
                    {workflows?.map((workflow) => (
                      <SelectItem key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Executions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Executions</CardTitle>
            <CardDescription>Last 50 workflow executions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading executions...
              </div>
            ) : executions && executions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((execution: any) => {
                    const duration = execution.completed_at
                      ? Math.round(
                          (new Date(execution.completed_at).getTime() -
                            new Date(execution.started_at).getTime()) /
                            1000
                        )
                      : null;

                    return (
                      <TableRow key={execution.id}>
                        <TableCell className="font-medium">
                          {execution.workflows?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{execution.trigger_module}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(execution.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(execution.started_at), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell>
                          {duration !== null ? `${duration}s` : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-red-600">
                          {execution.error_message || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No executions found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default WorkflowMonitor;
