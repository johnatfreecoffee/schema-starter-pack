import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info, Flag } from "lucide-react";

type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface TicketPriorityBadgeProps {
  priority: Priority;
  showIcon?: boolean;
}

const priorityConfig = {
  urgent: {
    label: 'Urgent',
    variant: 'destructive' as const,
    icon: AlertCircle,
    className: 'bg-red-500 text-white hover:bg-red-600'
  },
  high: {
    label: 'High',
    variant: 'default' as const,
    icon: AlertTriangle,
    className: 'bg-orange-500 text-white hover:bg-orange-600'
  },
  medium: {
    label: 'Medium',
    variant: 'secondary' as const,
    icon: Flag,
    className: 'bg-yellow-500 text-white hover:bg-yellow-600'
  },
  low: {
    label: 'Low',
    variant: 'outline' as const,
    icon: Info,
    className: 'bg-blue-500 text-white hover:bg-blue-600'
  }
};

export const TicketPriorityBadge = ({ priority, showIcon = true }: TicketPriorityBadgeProps) => {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  );
};
