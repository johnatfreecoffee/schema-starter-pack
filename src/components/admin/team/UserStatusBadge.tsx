import { Badge } from '@/components/ui/badge';

interface UserStatusBadgeProps {
  status: 'active' | 'suspended' | 'invited';
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const config = {
    active: {
      label: 'Active',
      className: 'bg-green-100 text-green-700 hover:bg-green-100',
    },
    suspended: {
      label: 'Suspended',
      className: 'bg-red-100 text-red-700 hover:bg-red-100',
    },
    invited: {
      label: 'Invited',
      className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
    },
  };

  const { label, className } = config[status];

  return <Badge className={className}>{label}</Badge>;
}
