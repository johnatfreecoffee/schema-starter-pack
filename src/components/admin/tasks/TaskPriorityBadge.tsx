import { Badge } from "@/components/ui/badge";

interface TaskPriorityBadgeProps {
  priority: string;
}

const priorityConfig = {
  low: { 
    color: "bg-success/10 text-success border-success/20", 
    text: "Low", 
    icon: "🟢" 
  },
  medium: { 
    color: "bg-warning/10 text-warning border-warning/20", 
    text: "Medium", 
    icon: "🟡" 
  },
  high: { 
    color: "bg-destructive/10 text-destructive border-destructive/20", 
    text: "High", 
    icon: "🔴" 
  }
};

export default function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
  
  return (
    <Badge className={config.color} variant="outline">
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </Badge>
  );
}
