import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BulkProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: string;
  total: number;
  completed: number;
  failed: number;
  errors?: Array<{ id: string; error: string }>;
  isComplete: boolean;
  onCancel?: () => void;
}

export function BulkProgressModal({
  open,
  onOpenChange,
  operation,
  total,
  completed,
  failed,
  errors = [],
  isComplete,
  onCancel,
}: BulkProgressModalProps) {
  const progress = (completed / total) * 100;
  const successful = completed - failed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {!isComplete && <Loader2 className="h-5 w-5 animate-spin" />}
            {isComplete && failed === 0 && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {isComplete && failed > 0 && (
              <AlertCircle className="h-5 w-5 text-amber-500" />
            )}
            {operation}
          </DialogTitle>
          <DialogDescription>
            {!isComplete && `Processing ${completed} of ${total} items...`}
            {isComplete && failed === 0 && `Successfully processed all ${total} items`}
            {isComplete && failed > 0 && `Completed with ${failed} error${failed > 1 ? 's' : ''}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{Math.round(progress)}%</span>
              <span>
                {completed}/{total}
              </span>
            </div>
          </div>

          {isComplete && (
            <div className="space-y-2 rounded-lg border bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Successful:</span>
                <span className="font-medium text-green-600">{successful}</span>
              </div>
              {failed > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failed:</span>
                  <span className="font-medium text-destructive">{failed}</span>
                </div>
              )}
            </div>
          )}

          {errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">
                Errors ({errors.length}):
              </p>
              <ScrollArea className="h-32 rounded border bg-muted p-2">
                <ul className="space-y-1 text-xs">
                  {errors.map((err, i) => (
                    <li key={i} className="truncate">
                      • {err.error}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {!isComplete && onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {isComplete && (
              <Button onClick={() => onOpenChange(false)}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
