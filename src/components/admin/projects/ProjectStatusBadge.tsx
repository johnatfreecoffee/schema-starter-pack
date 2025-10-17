import { Badge } from '@/components/ui/badge';

interface ProjectStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { className: string; text: string }> = {
  planning: { className: 'bg-primary/10 text-primary border-primary/20', text: 'Planning' },
  active: { className: 'bg-success/10 text-success border-success/20', text: 'Active' },
  completed: { className: 'bg-accent/10 text-accent-foreground border-accent/20', text: 'Completed' },
  on_hold: { className: 'bg-warning/10 text-warning border-warning/20', text: 'On Hold' },
  cancelled: { className: 'bg-destructive/10 text-destructive border-destructive/20', text: 'Cancelled' },
};

const ProjectStatusBadge = ({ status }: ProjectStatusBadgeProps) => {
  const config = statusConfig[status] || statusConfig.planning;
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.text}
    </Badge>
  );
};

export default ProjectStatusBadge;