import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LeadFunnelChartProps {
  data: { status: string; count: number }[];
}

export function LeadFunnelChart({ data }: LeadFunnelChartProps) {
  const statusOrder = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'];
  
  const sortedData = data
    .sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status))
    .map(item => ({
      ...item,
      status: item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' '),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="status" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
