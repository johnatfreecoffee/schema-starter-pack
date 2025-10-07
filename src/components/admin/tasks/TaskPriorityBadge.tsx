import { Badge } from "@/components/ui/badge";

interface TaskPriorityBadgeProps {
  priority: string;
}

const priorityConfig = {
  low: { 
    color: "bg-green-500/10 text-green-700 border-green-300", 
    text: "Low", 
    icon: "🟢" 
  },
  medium: { 
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-300", 
    text: "Medium", 
    icon: "🟡" 
  },
  high: { 
    color: "bg-red-500/10 text-red-700 border-red-300", 
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
