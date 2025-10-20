import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ActivityLogDetail } from './ActivityLogDetail';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Eye } from 'lucide-react';
import { useState } from 'react';

interface EntityActivityTabProps {
  entityType: string;
  entityId: string;
}

const actionColors = {
  created: 'bg-green-500/10 text-green-500 border-green-500/20',
  updated: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  deleted: 'bg-red-500/10 text-red-500 border-red-500/20',
  status_changed: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  converted: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

export function EntityActivityTab({ entityType, entityId }: EntityActivityTabProps) {
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['entity-activity', entityType, entityId],
    queryFn: async () => {
      // Fetch logs where this entity is the main subject OR the parent
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*, user_profiles:user_id(full_name, email)')
        .or(`and(entity_type.eq.${entityType},entity_id.eq.${entityId}),and(parent_entity_type.eq.${entityType},parent_entity_id.eq.${entityId})`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data.map((log: any) => ({
        ...log,
        user_name: log.user_profiles?.full_name,
        user_email: log.user_profiles?.email,
      }));
    }
  });

  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading activity...</div>;
  }

  if (logs.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No activity logged for this item yet.</div>;
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Changes</TableHead>
              <TableHead>Details</TableHead>
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
                  <Badge variant="outline" className={actionColors[log.action as keyof typeof actionColors]}>
                    {log.action.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {log.changes ? `${Object.keys(log.changes).length} field(s)` : 
                   log.old_values || log.new_values ? 'Updated' : 'N/A'}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => handleViewDetails(log)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ActivityLogDetail log={selectedLog} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );
}
