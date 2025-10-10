import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive';
  requireConfirmation?: boolean;
}

interface BulkActionsBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onAction: (actionId: string) => void;
  onClear: () => void;
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  actions,
  onAction,
  onClear,
  className,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg',
        'animate-in slide-in-from-bottom-5 duration-300',
        className
      )}
    >
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="font-medium text-sm md:text-base">
              {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-8 gap-1 ml-auto md:ml-0"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 w-full md:w-auto min-h-[44px]">
                Actions
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {actions.map((action, index) => (
                <div key={action.id}>
                  {index > 0 && action.variant === 'destructive' && (
                    <DropdownMenuSeparator />
                  )}
                  <DropdownMenuItem
                    onClick={() => onAction(action.id)}
                    className={cn(
                      'gap-2 min-h-[44px]',
                      action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </DropdownMenuItem>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
