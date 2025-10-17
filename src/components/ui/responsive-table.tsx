import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTableWrapper({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-md border overflow-x-auto">
        {children}
      </div>
    </div>
  );
}

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileCard({ children, className, onClick }: MobileCardProps) {
  return (
    <Card 
      className={cn(
        "p-4 mb-3 hover:shadow-md transition-shadow cursor-pointer w-full",
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

interface MobileCardFieldProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function MobileCardField({ label, value, className }: MobileCardFieldProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:justify-between sm:items-start py-2 border-b last:border-0 gap-1", className)}>
      <span className="text-sm font-medium text-muted-foreground sm:min-w-[100px]">{label}</span>
      <span className="text-sm sm:text-right sm:flex-1 break-words">{value}</span>
    </div>
  );
}

interface ResponsiveListProps {
  items: any[];
  renderCard: (item: any, index: number) => ReactNode;
  renderTable: () => ReactNode;
  emptyMessage?: string;
}

export function ResponsiveList({ items, renderCard, renderTable, emptyMessage = "No items found" }: ResponsiveListProps) {
  const isMobile = useIsMobile();

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3 w-full overflow-x-hidden px-1">
        {items.map((item, index) => renderCard(item, index))}
      </div>
    );
  }

  return renderTable();
}
