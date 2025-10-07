import { Badge } from '@/components/ui/badge';

interface AccountStatusBadgeProps {
  status: 'active' | 'inactive' | 'archived';
}

const statusConfig = {
  active: { 
    color: 'bg-green-500/10 text-green-700 border-green-200',
    icon: '●',
    text: 'Active' 
  },
  inactive: { 
    color: 'bg-gray-500/10 text-gray-700 border-gray-200',
    icon: '●',
    text: 'Inactive' 
  },
  archived: { 
    color: 'bg-slate-500/10 text-slate-700 border-slate-200',
    icon: '□',
    text: 'Archived' 
  }
};

export const AccountStatusBadge = ({ status }: AccountStatusBadgeProps) => {
  const config = statusConfig[status] || statusConfig.active;
  
  return (
    <Badge variant="outline" className={config.color}>
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </Badge>
  );
};
