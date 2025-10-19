import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReportChart } from '@/components/reports/ReportChart';
import { executeReport } from '@/lib/reportEngine';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ReportWidgetProps {
  reportId: string;
  size?: 'small' | 'medium' | 'large';
}

const ReportWidget = ({ reportId, size = 'medium' }: ReportWidgetProps) => {
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Fetch report config
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .maybeSingle();

      if (reportError) throw reportError;
      if (!reportData) throw new Error('Report not found');

      setReport(reportData);

      // Execute report
      const results = await executeReport({
        dataSource: reportData.data_source,
        selectedFields: reportData.selected_fields as string[],
        filters: reportData.filters as any[],
        grouping: reportData.grouping as any
      });

      setData(results);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error loading report widget:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(loadReportData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [reportId]);

  const sizeClasses = {
    small: 'h-48',
    medium: 'h-64',
    large: 'h-96'
  };

  if (loading && !report) {
    return (
      <Card className={`p-6 ${sizeClasses[size]} flex items-center justify-center`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (!report) return null;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold truncate">{report.name}</h3>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2 ml-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              loadReportData();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/dashboard/reports/${reportId}`)}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={sizeClasses[size]}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data.length > 0 ? (
          report.visualization_type === 'table' ? (
            <div className="overflow-auto h-full text-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {Object.keys(data[0]).map(key => (
                      <th key={key} className="text-left p-2 font-semibold text-xs">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b text-xs">
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="p-2">
                          {typeof val === 'number' ? val.toLocaleString() : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ReportChart
              type={report.visualization_type}
              data={data}
              config={report.chart_config}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No data available
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReportWidget;
