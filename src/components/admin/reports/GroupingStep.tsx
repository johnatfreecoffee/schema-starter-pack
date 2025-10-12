import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const AGGREGATION_TYPES = [
  { value: 'count', label: 'Count', description: 'Count number of records' },
  { value: 'sum', label: 'Sum', description: 'Sum of values' },
  { value: 'average', label: 'Average', description: 'Average of values' },
  { value: 'min', label: 'Minimum', description: 'Minimum value' },
  { value: 'max', label: 'Maximum', description: 'Maximum value' },
];

interface GroupingStepProps {
  config: { selected_fields: string[]; grouping: any };
  onUpdate: (updates: { grouping: any }) => void;
}

const GroupingStep = ({ config, onUpdate }: GroupingStepProps) => {
  const handleGroupingChange = (field: string, value: string) => {
    onUpdate({
      grouping: {
        ...config.grouping,
        [field]: value,
      },
    });
  };

  if (config.selected_fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please select fields first
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Grouping & Aggregation (Optional)</h2>
        <p className="text-muted-foreground">
          Group your data and apply aggregations for summary reports
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Group By Field</Label>
          <Select
            value={config.grouping?.field || ''}
            onValueChange={(value) => handleGroupingChange('field', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select field to group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {config.selected_fields.map((field) => (
                <SelectItem key={field} value={field}>
                  {field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Group records by this field value
          </p>
        </div>

        {config.grouping?.field && (
          <div>
            <Label>Aggregation Type</Label>
            <Select
              value={config.grouping?.aggregation_type || 'count'}
              onValueChange={(value) => handleGroupingChange('aggregation_type', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGGREGATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {config.grouping?.field && config.grouping?.aggregation_type && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Preview</h4>
            <p className="text-sm">
              Your report will show:{' '}
              <Badge variant="secondary" className="mx-1">
                {config.grouping.aggregation_type}
              </Badge>
              of records grouped by{' '}
              <Badge variant="secondary" className="mx-1">
                {config.grouping.field}
              </Badge>
            </p>
          </div>
        )}

        {!config.grouping?.field && (
          <div className="text-center py-6 text-muted-foreground">
            <p>No grouping applied. Your report will show individual records.</p>
            <p className="text-xs mt-2">Select a field above to group your data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupingStep;
