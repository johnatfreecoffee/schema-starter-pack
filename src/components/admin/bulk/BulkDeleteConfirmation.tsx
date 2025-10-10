import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BulkDeleteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemCount: number;
  itemType: string;
  itemNames?: string[];
  onConfirm: () => Promise<void>;
  requireTyping?: boolean;
}

export function BulkDeleteConfirmation({
  open,
  onOpenChange,
  itemCount,
  itemType,
  itemNames = [],
  onConfirm,
  requireTyping = true,
}: BulkDeleteConfirmationProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
      setConfirmText('');
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const needsTyping = requireTyping && itemCount > 10;
  const canDelete = !needsTyping || confirmText === 'DELETE';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete {itemCount} {itemType}?</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              You are about to delete {itemCount} {itemType}.{' '}
              <span className="font-semibold text-destructive">
                This action cannot be undone.
              </span>
            </p>

            {itemNames.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Items to be deleted:</p>
                <ScrollArea className="h-32 rounded border bg-muted p-2">
                  <ul className="space-y-1 text-sm">
                    {itemNames.map((name, i) => (
                      <li key={i} className="truncate">
                        • {name}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            {needsTyping && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="confirm-delete">
                  Type <span className="font-mono font-bold">DELETE</span> to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                />
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setConfirmText('');
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete {itemCount} {itemType}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
