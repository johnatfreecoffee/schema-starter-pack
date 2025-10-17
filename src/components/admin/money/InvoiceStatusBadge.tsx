import { Badge } from '@/components/ui/badge';

type InvoiceStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const InvoiceStatusBadge = ({ status }: InvoiceStatusBadgeProps) => {
  const statusConfig: Record<InvoiceStatus, { className: string, label: string }> = {
    pending: { className: 'bg-warning/10 text-warning border-warning/20', label: 'Pending' },
    paid: { className: 'bg-success/10 text-success border-success/20', label: 'Paid' },
    partial: { className: 'bg-primary/10 text-primary border-primary/20', label: 'Partial' },
    overdue: { className: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Overdue' },
    cancelled: { className: 'bg-muted/50 text-muted-foreground border-muted', label: 'Cancelled' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

export default InvoiceStatusBadge;