import { Users, Phone, MapPin, Flag, CheckSquare, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EventTypeBadgeProps {
  type: string;
}

const eventTypeConfig = {
  meeting: {
    label: 'Meeting',
    icon: Users,
    className: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  call: {
    label: 'Call',
    icon: Phone,
    className: 'bg-green-500 hover:bg-green-600 text-white',
  },
  appointment: {
    label: 'Appointment',
    icon: MapPin,
    className: 'bg-purple-500 hover:bg-purple-600 text-white',
  },
  deadline: {
    label: 'Deadline',
    icon: Flag,
    className: 'bg-red-500 hover:bg-red-600 text-white',
  },
  task: {
    label: 'Task',
    icon: CheckSquare,
    className: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  custom: {
    label: 'Custom',
    icon: Calendar,
    className: 'bg-gray-500 hover:bg-gray-600 text-white',
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
