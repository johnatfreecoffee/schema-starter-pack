import { Badge } from '@/components/ui/badge';

interface LeadStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig = {
  new: { 
    color: 'bg-primary/10 text-primary border-primary/20',
    text: 'New', 
    icon: '●' 
  },
  contacted: { 
    color: 'bg-warning/10 text-warning border-warning/20',
    text: 'Contacted', 
    icon: '●' 
  },
  qualified: { 
    color: 'bg-success/10 text-success border-success/20',
    text: 'Qualified', 
    icon: '●' 
  },
  converted: { 
    color: 'bg-accent/10 text-accent border-accent/20',
    text: 'Converted', 
    icon: '✓' 
  },
  lost: { 
    color: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
    text: 'Lost', 
    icon: '×' 
  },
};

export const LeadStatusBadge = ({ status, className }: LeadStatusBadgeProps) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;

  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${className}`}
    >
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </Badge>
  );
};