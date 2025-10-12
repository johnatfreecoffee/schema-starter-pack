import { Badge } from '@/components/ui/badge';
import { BarChart3, LineChart, PieChart, Table } from 'lucide-react';

interface ReportPreviewProps {
  config: {
    data_source: string;
    selected_fields: string[];
    filters: any[];
    grouping: any;
    visualization_type: string;
  };
}

const ReportPreview = ({ config }: ReportPreviewProps) => {
  const getVisualizationIcon = () => {
    switch (config.visualization_type) {
      case 'bar': return <BarChart3 className="h-6 w-6 text-primary" />;
      case 'line': return <LineChart className="h-6 w-6 text-primary" />;
      case 'pie': return <PieChart className="h-6 w-6 text-primary" />;
      default: return <Table className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <div className="space-y-4 text-sm">
      {config.data_source ? (
        <>
          <div>
            <h4 className="font-medium mb-2">Data Source</h4>
            <Badge variant="secondary" className="capitalize">
              {config.data_source}
            </Badge>
          </div>

          {config.selected_fields.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Fields ({config.selected_fields.length})</h4>
              <div className="flex flex-wrap gap-1">
                {config.selected_fields.slice(0, 3).map((field) => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {field}
                  </Badge>
                ))}
                {config.selected_fields.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{config.selected_fields.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {config.filters.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Filters</h4>
              <Badge variant="secondary">{config.filters.length} active</Badge>
            </div>
          )}

          {config.grouping?.field && (
            <div>
              <h4 className="font-medium mb-2">Grouping</h4>
              <p className="text-muted-foreground">
                {config.grouping.aggregation_type || 'count'} by {config.grouping.field}
              </p>
            </div>
          )}

          {config.visualization_type && (
            <div>
              <h4 className="font-medium mb-2">Visualization</h4>
              <div className="flex items-center gap-2">
                {getVisualizationIcon()}
                <span className="capitalize">{config.visualization_type}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>Configure your report</p>
          <p className="text-xs mt-2">Preview will appear here</p>
        </div>
      )}
    </div>
  );
};

export default ReportPreview;
