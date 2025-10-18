import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Users } from 'lucide-react';

interface LeadSourceChartProps {
  data: Record<string, number>;
}

const COLORS = {
  'Website Form': 'hsl(var(--chart-1))',
  'Phone Call': 'hsl(var(--chart-2))',
  'Email': 'hsl(var(--chart-3))',
  'Referral': 'hsl(var(--chart-4))',
  'Other': 'hsl(var(--chart-5))',
};

export function LeadSourceChart({ data }: LeadSourceChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
    percentage: 0, // Will be calculated below
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  chartData.forEach(item => {
    item.percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
  });

  const isEmpty = total === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Leads by Source
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No lead source data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.Other} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value} leads`, 'Count']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => {
                  const item = chartData.find(d => d.name === value);
                  return `${value} (${item?.value || 0})`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
