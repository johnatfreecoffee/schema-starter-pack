import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onClearAll: () => void;
}

export function FilterPanel({ open, onClose, title, children, onClearAll }: FilterPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-96 flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {children}
        </ScrollArea>

        <div className="px-6 py-4 border-t flex gap-2">
          <Button variant="outline" onClick={onClearAll} className="flex-1">
            Clear All
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
