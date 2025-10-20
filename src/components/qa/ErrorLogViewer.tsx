import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Download, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const ErrorLogViewer = () => {
  const [errorType, setErrorType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7days');
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const queryClient = useQueryClient();

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case '24hours':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return null;
    }
  };

  const { data: errorLogs, isLoading } = useQuery({
    queryKey: ['error-logs', errorType, dateRange, page],
    queryFn: async () => {
      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .eq('entity_type', 'system')
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      if (errorType !== 'all') {
        query = query.eq('entity_type', errorType);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return { logs: data || [], total: count || 0 };
    }
  });

  const clearOldErrorsMutation = useMutation({
    mutationFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('entity_type', 'system')
        .lt('created_at', thirtyDaysAgo);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Old errors cleared successfully');
      queryClient.invalidateQueries({ queryKey: ['error-logs'] });
    },
    onError: () => {
      toast.error('Failed to clear old errors');
    }
  });

  const exportErrorLog = () => {
    if (!errorLogs?.logs.length) {
      toast.error('No errors to export');
      return;
    }

    const csv = [
      ['Timestamp', 'Type', 'Entity', 'Action', 'User ID', 'Metadata'].join(','),
      ...errorLogs.logs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.entity_type,
        log.entity_name || 'N/A',
        log.action,
        log.user_id || 'System',
        JSON.stringify(log.metadata || {})
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Error log exported');
  };

  const getSeverityBadge = (action: string) => {
    if (action === 'error') {
      return <Badge variant="destructive">Critical</Badge>;
    }
    return <Badge variant="default" className="bg-yellow-500">Warning</Badge>;
  };

  const totalPages = Math.ceil((errorLogs?.total || 0) / pageSize);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Error Log Viewer</CardTitle>
            <CardDescription>Recent system errors and warnings</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportErrorLog}
              disabled={!errorLogs?.logs.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearOldErrorsMutation.mutate()}
              disabled={clearOldErrorsMutation.isPending}
            >
              {clearOldErrorsMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clear Old
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Error Type</label>
            <Select value={errorType} onValueChange={setErrorType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="page">Page Generation</SelectItem>
                <SelectItem value="user">User Action</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24hours">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : errorLogs?.logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No errors found</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errorLogs?.logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{getSeverityBadge(log.action)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="capitalize">{log.entity_type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.entity_name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm max-w-md truncate">
                        {JSON.stringify(log.metadata || {})}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to{' '}
                  {Math.min(page * pageSize, errorLogs?.total || 0)} of{' '}
                  {errorLogs?.total || 0} errors
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
