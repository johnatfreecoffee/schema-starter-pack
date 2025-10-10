import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface BulkConvertLeadsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onConfirm: (accountStatus: string, deleteLeads: boolean) => Promise<void>;
}

export function BulkConvertLeadsModal({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}: BulkConvertLeadsModalProps) {
  const [accountStatus, setAccountStatus] = useState('active');
  const [deleteLeads, setDeleteLeads] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(accountStatus, deleteLeads);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Leads to Accounts</DialogTitle>
          <DialogDescription>
            Converting {selectedCount} {selectedCount === 1 ? 'lead' : 'leads'} to accounts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Account Status</Label>
            <Select value={accountStatus} onValueChange={setAccountStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="delete"
              checked={deleteLeads}
              onCheckedChange={(checked) => setDeleteLeads(checked as boolean)}
            />
            <Label
              htmlFor="delete"
              className="text-sm font-normal cursor-pointer"
            >
              Delete original leads after conversion
            </Label>
          </div>

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            <strong>Preview:</strong> Will create {selectedCount} account{selectedCount !== 1 ? 's' : ''} + {selectedCount} contact{selectedCount !== 1 ? 's' : ''}
            {deleteLeads && ' and delete the original leads'}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Convert {selectedCount} Lead{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
