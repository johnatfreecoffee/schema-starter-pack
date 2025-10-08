import { Badge } from '@/components/ui/badge';

type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired' | 'converted';

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
}

const QuoteStatusBadge = ({ status }: QuoteStatusBadgeProps) => {
  const statusConfig: Record<QuoteStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
    draft: { variant: 'secondary', label: 'Draft' },
    sent: { variant: 'default', label: 'Sent' },
    accepted: { variant: 'default', label: 'Accepted' },
    declined: { variant: 'destructive', label: 'Declined' },
    expired: { variant: 'outline', label: 'Expired' },
    converted: { variant: 'outline', label: 'Converted' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={
      status === 'accepted' ? 'bg-green-600 hover:bg-green-700' :
      status === 'expired' ? 'bg-orange-600 hover:bg-orange-700 text-white' :
      status === 'converted' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
      ''
    }>
      {config.label}
    </Badge>
  );
};

export default QuoteStatusBadge;