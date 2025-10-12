import { Badge } from '@/components/ui/badge';

interface ReviewStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'archived';
}

export function ReviewStatusBadge({ status }: ReviewStatusBadgeProps) {
  const variants = {
    pending: 'default',
    approved: 'default',
    rejected: 'destructive',
    archived: 'secondary'
  } as const;

  const colors = {
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    archived: 'bg-gray-500'
  };

  return (
    <Badge variant={variants[status]} className={colors[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}