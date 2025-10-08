import { Badge } from '@/components/ui/badge';

type InvoiceStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const InvoiceStatusBadge = ({ status }: InvoiceStatusBadgeProps) => {
  const statusConfig: Record<InvoiceStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
    pending: { variant: 'outline', label: 'Pending' },
    paid: { variant: 'default', label: 'Paid' },
    partial: { variant: 'default', label: 'Partial' },
    overdue: { variant: 'destructive', label: 'Overdue' },
    cancelled: { variant: 'secondary', label: 'Cancelled' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={
      status === 'paid' ? 'bg-green-600 hover:bg-green-700' :
      status === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
      status === 'partial' ? 'bg-blue-600 hover:bg-blue-700' :
      ''
    }>
      {config.label}
    </Badge>
  );
};

export default InvoiceStatusBadge;