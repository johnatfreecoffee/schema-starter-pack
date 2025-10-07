import { Badge } from "@/components/ui/badge";

interface TaskStatusBadgeProps {
  status: string;
}

const statusConfig = {
  pending: { 
    color: "bg-blue-500/10 text-blue-700 border-blue-300", 
    text: "Pending", 
    icon: "○" 
  },
  in_progress: { 
    color: "bg-purple-500/10 text-purple-700 border-purple-300", 
    text: "In Progress", 
    icon: "◐" 
  },
  completed: { 
    color: "bg-green-500/10 text-green-700 border-green-300", 
    text: "Completed", 
    icon: "✓" 
  },
  cancelled: { 
    color: "bg-gray-500/10 text-gray-700 border-gray-300", 
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
