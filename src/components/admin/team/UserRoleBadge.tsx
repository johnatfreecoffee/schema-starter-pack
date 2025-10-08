import { Badge } from '@/components/ui/badge';

interface UserRoleBadgeProps {
  role: 'admin' | 'crm_user' | 'customer';
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const config = {
    admin: {
      label: 'Admin',
      className: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
    },
    crm_user: {
      label: 'CRM User',
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
    },
    customer: {
      label: 'Customer',
      className: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
    },
  };

  const { label, className } = config[role];

  return <Badge className={className}>{label}</Badge>;
}
