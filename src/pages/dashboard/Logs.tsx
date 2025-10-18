import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityLogFilters } from '@/components/admin/ActivityLogFilters';
import { ActivityLogDetail } from '@/components/admin/ActivityLogDetail';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Loader2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface ActivityLog {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'converted';
  changes: Record<string, { old: any; new: any }> | null;
  metadata: Record<string, any> | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

const actionColors = {
  created: 'bg-green-500/10 text-green-500 border-green-500/20',
  updated: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  deleted: 'bg-red-500/10 text-red-500 border-red-500/20',
  status_changed: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  converted: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

const Logs = () => {
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState('all');
  const [action, setAction] = useState('all');
  const [userId, setUserId] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pageSize, setPageSize] = useState('25');
  const [page, setPage] = useState(1);

  // Fetch users for filter
  const { data: users = [] } = useQuery({
    queryKey: ['log-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .order('full_name');
      if (error) throw error;
      return data.map((u) => ({ id: u.id, name: u.full_name || u.email }));
    },
  });

  // Fetch activity logs
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['activity-logs', search, entityType, action, userId, dateRange, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('activity_logs')
        .select('*, user_profiles:user_id(full_name, email)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * parseInt(pageSize), page * parseInt(pageSize) - 1);

      if (search) {
        query = query.or(`entity_name.ilike.%${search}%,entity_id.ilike.%${search}%`);
      }

      if (entityType !== 'all') {
        query = query.eq('entity_type', entityType);
      }

      if (action !== 'all') {
        query = query.eq('action', action as any);
      }

      if (userId !== 'all') {
        query = query.eq('user_id', userId);
      }

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }

      if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', toDate.toISOString());
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const logs = data.map((log: any) => ({
        ...log,
        user_name: log.user_profiles?.full_name,
        user_email: log.user_profiles?.email,
      }));

      return { logs, count: count || 0 };
    },
  });

  const logs = logsData?.logs || [];
  const totalCount = logsData?.count || 0;
  const totalPages = Math.ceil(totalCount / parseInt(pageSize));

  const handleViewDetails = (log: ActivityLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-full overflow-x-hidden">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 truncate">Activity Logs</h1>
          <p className="text-muted-foreground">
            Complete audit trail of all system activities
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
            <CardDescription>
              {totalCount} total log {totalCount === 1 ? 'entry' : 'entries'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ActivityLogFilters
              search={search}
              onSearchChange={setSearch}
              entityType={entityType}
              onEntityTypeChange={setEntityType}
              action={action}
              onActionChange={setAction}
              userId={userId}
              onUserIdChange={setUserId}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              users={users}
            />

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No activity logs found</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity Type</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Changes</TableHead>
                        <TableHead className="w-[100px]">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.user_name || log.user_email || 'System'}
                          </TableCell>
                          <TableCell>
                            <Badge className={actionColors[log.action]}>
                              {log.action.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{log.entity_type}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {log.entity_name || log.entity_id}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.changes ? `${Object.keys(log.changes).length} field(s)` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select value={pageSize} onValueChange={(v) => { setPageSize(v); setPage(1); }}>
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages || 1}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                      >
                        First
                      </Button>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ActivityLogDetail
        log={selectedLog}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </AdminLayout>
  );
};

export default Logs;
