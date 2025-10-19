import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface BulkConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalCount: number;
  action: string;
  onConfirm: () => void;
}

export function BulkConfirmationModal({
  open,
  onOpenChange,
  totalCount,
  action,
  onConfirm,
}: BulkConfirmationModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              You are about to <strong>{action}</strong> ALL <strong>{totalCount}</strong> items 
              matching your current filters.
            </p>
            <p className="text-amber-600 font-medium">
              This action will affect items not currently visible on screen.
            </p>
            <p>
              Do you want to continue?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Confirm
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
