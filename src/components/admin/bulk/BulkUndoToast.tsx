import { Button } from '@/components/ui/button';
import { Undo2 } from 'lucide-react';

interface BulkUndoToastProps {
  count: number;
  onUndo: () => void;
}

export function BulkUndoToast({ count, onUndo }: BulkUndoToastProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>✓ {count} items updated successfully</span>
      <Button
        size="sm"
        variant="outline"
        onClick={onUndo}
        className="gap-1"
      >
        <Undo2 className="h-3 w-3" />
        Undo
      </Button>
    </div>
  );
}
