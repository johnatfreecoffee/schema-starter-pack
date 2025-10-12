import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface ReportChartProps {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: any[];
  config?: any;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function ReportChart({ type, data, config }: ReportChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        No data available for this report
      </div>
    );
  }

  const dataKey = config?.dataKey || 'value';
  const nameKey = config?.nameKey || Object.keys(data[0])[0];

  switch (type) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={nameKey} className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Legend />
            <Bar dataKey={dataKey} fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'line':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={nameKey} className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );

    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'area':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={nameKey} className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Legend />
            <Area type="monotone" dataKey={dataKey} stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      );

    default:
      return null;
  }
}
