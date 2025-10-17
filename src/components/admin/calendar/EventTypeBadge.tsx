import { Users, Phone, MapPin, Flag, CheckSquare, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EventTypeBadgeProps {
  type: string;
}

const eventTypeConfig = {
  meeting: {
    label: 'Meeting',
    icon: Users,
    className: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  call: {
    label: 'Call',
    icon: Phone,
    className: 'bg-success text-success-foreground hover:bg-success/90',
  },
  appointment: {
    label: 'Appointment',
    icon: MapPin,
    className: 'bg-accent text-accent-foreground hover:bg-accent/90',
  },
  deadline: {
    label: 'Deadline',
    icon: Flag,
    className: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
  task: {
    label: 'Task',
    icon: CheckSquare,
    className: 'bg-warning text-warning-foreground hover:bg-warning/90',
  },
  custom: {
    label: 'Custom',
    icon: Calendar,
    className: 'bg-muted text-muted-foreground hover:bg-muted/90',
  },
};

export const EventTypeBadge = ({ type }: EventTypeBadgeProps) => {
  const config = eventTypeConfig[type as keyof typeof eventTypeConfig] || eventTypeConfig.custom;
  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};
