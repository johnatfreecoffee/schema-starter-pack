import { Badge } from '@/components/ui/badge';

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted';

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
}

const QuoteStatusBadge = ({ status }: QuoteStatusBadgeProps) => {
  const statusConfig: Record<QuoteStatus, { className: string, label: string }> = {
    draft: { className: 'bg-muted/50 text-muted-foreground border-muted', label: 'Draft' },
    sent: { className: 'bg-primary/10 text-primary border-primary/20', label: 'Sent' },
    accepted: { className: 'bg-success/10 text-success border-success/20', label: 'Accepted' },
    declined: { className: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Declined' },
    expired: { className: 'bg-warning/10 text-warning border-warning/20', label: 'Expired' },
    converted: { className: 'bg-accent/10 text-accent-foreground border-accent/20', label: 'Converted' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

export default QuoteStatusBadge;