import { Badge } from '@/components/ui/badge';

interface LeadStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig = {
  new: { 
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    text: 'New', 
    icon: '●' 
  },
  contacted: { 
    color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    text: 'Contacted', 
    icon: '●' 
  },
  qualified: { 
    color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    text: 'Qualified', 
    icon: '●' 
  },
  converted: { 
    color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    text: 'Converted', 
    icon: '✓' 
  },
  lost: { 
    color: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
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