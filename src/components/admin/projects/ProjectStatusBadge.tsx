import { Badge } from '@/components/ui/badge';

interface ProjectStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { color: string; text: string; icon: string }> = {
  planning: { color: 'bg-blue-500', text: 'Planning', icon: '📋' },
  active: { color: 'bg-green-500', text: 'Active', icon: '🚀' },
  completed: { color: 'bg-purple-500', text: 'Completed', icon: '✅' },
  on_hold: { color: 'bg-yellow-500', text: 'On Hold', icon: '⏸️' },
  cancelled: { color: 'bg-gray-500', text: 'Cancelled', icon: '❌' },
};

const ProjectStatusBadge = ({ status }: ProjectStatusBadgeProps) => {
  const config = statusConfig[status] || statusConfig.planning;
  
  return (
    <Badge className={`${config.color} text-white`}>
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </Badge>
  );
};

export default ProjectStatusBadge;