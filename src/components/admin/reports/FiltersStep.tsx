import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'between', label: 'Between' },
];

interface Filter {
  field: string;
  operator: string;
  value: string;
}

interface FiltersStepProps {
  config: { data_source: string; selected_fields: string[]; filters: Filter[] };
  onUpdate: (updates: { filters: Filter[] }) => void;
}

const FiltersStep = ({ config, onUpdate }: FiltersStepProps) => {
  const [newFilter, setNewFilter] = useState<Filter>({
    field: '',
    operator: 'equals',
    value: '',
  });

  const handleAddFilter = () => {
    if (newFilter.field && newFilter.value) {
      onUpdate({ filters: [...config.filters, newFilter] });
      setNewFilter({ field: '', operator: 'equals', value: '' });
    }
  };

  const handleRemoveFilter = (index: number) => {
    onUpdate({ filters: config.filters.filter((_, i) => i !== index) });
  };

  if (!config.data_source || config.selected_fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please select data source and fields first
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Add Filters (Optional)</h2>
        <p className="text-muted-foreground">
          Filter your data to show only what you need
        </p>
      </div>

      {/* Existing Filters */}
      {config.filters.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Active Filters:</h3>
          {config.filters.map((filter, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Badge variant="secondary">{filter.field}</Badge>
              <span className="text-sm text-muted-foreground">{filter.operator}</span>
              <Badge>{filter.value}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFilter(index)}
                className="ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Filter */}
      <div className="p-4 border rounded-lg space-y-4">
        <h3 className="text-sm font-medium">Add New Filter:</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select
              value={newFilter.field}
              onValueChange={(value) => setNewFilter({ ...newFilter, field: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {config.selected_fields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={newFilter.operator}
              onValueChange={(value) => setNewFilter({ ...newFilter, operator: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Input
              placeholder="Value"
              value={newFilter.value}
              onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
            />
          </div>
        </div>

        <Button onClick={handleAddFilter} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Filter
        </Button>
      </div>

      {config.filters.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No filters added yet. Click "Add Filter" to start filtering your data.
        </p>
      )}
    </div>
  );
};

export default FiltersStep;
