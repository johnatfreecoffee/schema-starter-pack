import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: LucideIcon;
  colorClass?: string;
}

export function MetricCard({ title, value, trend, icon: Icon, colorClass = 'bg-primary/10 text-primary' }: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return <Minus className="h-4 w-4" />;
    if (trend > 0) return <ArrowUp className="h-4 w-4" />;
    return <ArrowDown className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (!trend || trend === 0) return 'text-muted-foreground';
    if (trend > 0) return 'text-green-600';
    return 'text-red-600';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="font-medium">
                  {Math.abs(trend)}% from last period
                </span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-full ${colorClass}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
