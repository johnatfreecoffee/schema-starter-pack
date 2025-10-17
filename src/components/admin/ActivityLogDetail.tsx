import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { User, Clock, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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

interface ActivityLogDetailProps {
  log: ActivityLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actionColors = {
  created: 'bg-green-500/10 text-green-500 border-green-500/20',
  updated: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  deleted: 'bg-red-500/10 text-red-500 border-red-500/20',
  status_changed: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  converted: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

export function ActivityLogDetail({ log, open, onOpenChange }: ActivityLogDetailProps) {
  if (!log) return null;

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Activity Log Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Summary */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Badge className={actionColors[log.action]}>
              {log.action.replace('_', ' ').toUpperCase()}
            </Badge>
            <div className="flex-1">
              <h3 className="font-semibold">
                {log.entity_type.charAt(0).toUpperCase() + log.entity_type.slice(1)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {log.entity_name || log.entity_id}
              </p>
            </div>
          </div>

          {/* User & Time Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Performed by</span>
              </div>
              <p className="font-medium">{log.user_name || log.user_email || 'Unknown User'}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Timestamp</span>
              </div>
              <p className="font-medium">{format(new Date(log.created_at), 'PPpp')}</p>
            </div>
          </div>

          {/* Changes */}
          {log.changes && Object.keys(log.changes).length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold">Changes Made</h3>
                <div className="space-y-3">
                  {Object.entries(log.changes).map(([field, change]) => (
                    <div key={field} className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Field</p>
                        <p className="font-medium">{field.replace(/_/g, ' ').toUpperCase()}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Old Value</p>
                          <p className="text-sm font-mono bg-background p-2 rounded border break-words">
                            {formatValue(change.old)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">New Value</p>
                          <p className="text-sm font-mono bg-background p-2 rounded border break-words">
                            {formatValue(change.new)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Additional Information</h3>
                <div className="bg-muted/30 p-3 rounded-lg">
                  <pre className="text-sm font-mono overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
