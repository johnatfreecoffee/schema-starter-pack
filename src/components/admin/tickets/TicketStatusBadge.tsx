import { Badge } from "@/components/ui/badge";
import { Circle, Clock, Pause, CheckCircle, XCircle } from "lucide-react";

type Status = 'new' | 'open' | 'pending' | 'resolved' | 'closed';

interface TicketStatusBadgeProps {
  status: Status;
  showIcon?: boolean;
}

const statusConfig = {
  new: {
    label: 'New',
    icon: Circle,
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  },
  open: {
    label: 'Open',
    icon: Clock,
    className: 'bg-green-100 text-green-800 hover:bg-green-200'
  },
  pending: {
    label: 'Pending',
    icon: Pause,
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle,
    className: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
  },
  closed: {
    label: 'Closed',
    icon: XCircle,
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }
};

export const TicketStatusBadge = ({ status, showIcon = true }: TicketStatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={config.className}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {config.label}
    </Badge>
  );
};
