import { Badge } from '@/components/ui/badge';

interface AccountStatusBadgeProps {
  status: 'active' | 'inactive' | 'archived';
}

const statusConfig = {
  active: { 
    color: 'bg-success/10 text-success border-success/20',
    icon: '●',
    text: 'Active' 
  },
  inactive: { 
    color: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
    icon: '●',
    text: 'Inactive' 
  },
  archived: { 
    color: 'bg-muted/50 text-muted-foreground border-muted',
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
