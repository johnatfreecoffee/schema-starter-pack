import { Badge } from "@/components/ui/badge";

interface TaskStatusBadgeProps {
  status: string;
}

const statusConfig = {
  pending: { 
    color: "bg-primary/10 text-primary border-primary/20", 
    text: "Pending", 
    icon: "○" 
  },
  in_progress: { 
    color: "bg-accent/10 text-accent border-accent/20", 
    text: "In Progress", 
    icon: "◐" 
  },
  completed: { 
    color: "bg-success/10 text-success border-success/20", 
    text: "Completed", 
    icon: "✓" 
  },
  cancelled: { 
    color: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20", 
    text: "Cancelled", 
    icon: "×" 
  }
};

export default function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <Badge className={config.color} variant="outline">
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </Badge>
  );
}
