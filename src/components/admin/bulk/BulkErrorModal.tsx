import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BulkError {
  id: string;
  name?: string;
  error: string;
}

interface BulkErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: BulkError[];
  onExport: () => void;
}

export function BulkErrorModal({ open, onOpenChange, errors, onExport }: BulkErrorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <DialogTitle>Bulk Operation Errors</DialogTitle>
          </div>
          <DialogDescription>
            {errors.length} item{errors.length !== 1 ? 's' : ''} failed to process. Review the errors below.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.map((error) => (
                <TableRow key={error.id}>
                  <TableCell className="font-mono text-xs">{error.id.slice(0, 8)}...</TableCell>
                  <TableCell>{error.name || 'N/A'}</TableCell>
                  <TableCell className="text-destructive">{error.error}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Error Report
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
