import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const FIELD_DEFINITIONS: Record<string, Array<{ value: string; label: string; type: string }>> = {
  leads: [
    { value: 'first_name', label: 'First Name', type: 'text' },
    { value: 'last_name', label: 'Last Name', type: 'text' },
    { value: 'email', label: 'Email', type: 'text' },
    { value: 'phone', label: 'Phone', type: 'text' },
    { value: 'service_needed', label: 'Service Needed', type: 'text' },
    { value: 'status', label: 'Status', type: 'text' },
    { value: 'source', label: 'Source', type: 'text' },
    { value: 'city', label: 'City', type: 'text' },
    { value: 'state', label: 'State', type: 'text' },
    { value: 'created_at', label: 'Created Date', type: 'date' },
  ],
  accounts: [
    { value: 'account_name', label: 'Account Name', type: 'text' },
    { value: 'industry', label: 'Industry', type: 'text' },
    { value: 'status', label: 'Status', type: 'text' },
    { value: 'website', label: 'Website', type: 'text' },
    { value: 'created_at', label: 'Created Date', type: 'date' },
  ],
  contacts: [
    { value: 'first_name', label: 'First Name', type: 'text' },
    { value: 'last_name', label: 'Last Name', type: 'text' },
    { value: 'email', label: 'Email', type: 'text' },
    { value: 'phone', label: 'Phone', type: 'text' },
    { value: 'title', label: 'Title', type: 'text' },
    { value: 'department', label: 'Department', type: 'text' },
    { value: 'is_primary', label: 'Is Primary', type: 'boolean' },
    { value: 'created_at', label: 'Created Date', type: 'date' },
  ],
  projects: [
    { value: 'project_name', label: 'Project Name', type: 'text' },
    { value: 'status', label: 'Status', type: 'text' },
    { value: 'budget', label: 'Budget', type: 'number' },
    { value: 'spent', label: 'Spent', type: 'number' },
    { value: 'start_date', label: 'Start Date', type: 'date' },
    { value: 'estimated_completion', label: 'Estimated Completion', type: 'date' },
    { value: 'actual_completion', label: 'Actual Completion', type: 'date' },
    { value: 'created_at', label: 'Created Date', type: 'date' },
  ],
  tasks: [
    { value: 'title', label: 'Title', type: 'text' },
    { value: 'status', label: 'Status', type: 'text' },
    { value: 'priority', label: 'Priority', type: 'text' },
    { value: 'due_date', label: 'Due Date', type: 'date' },
    { value: 'completed_at', label: 'Completed Date', type: 'date' },
    { value: 'created_at', label: 'Created Date', type: 'date' },
  ],
  quotes: [
    { value: 'quote_number', label: 'Quote Number', type: 'text' },
    { value: 'status', label: 'Status', type: 'text' },
    { value: 'total_amount', label: 'Total Amount', type: 'number' },
    { value: 'created_at', label: 'Created Date', type: 'date' },
    { value: 'last_sent_at', label: 'Last Sent Date', type: 'date' },
  ],
  invoices: [
    { value: 'invoice_number', label: 'Invoice Number', type: 'text' },
    { value: 'status', label: 'Status', type: 'text' },
    { value: 'total_amount', label: 'Total Amount', type: 'number' },
    { value: 'due_date', label: 'Due Date', type: 'date' },
    { value: 'created_at', label: 'Created Date', type: 'date' },
  ],
};

interface FieldSelectionStepProps {
  config: { data_source: string; selected_fields: string[] };
  onUpdate: (updates: { selected_fields: string[] }) => void;
}

const FieldSelectionStep = ({ config, onUpdate }: FieldSelectionStepProps) => {
  const fields = FIELD_DEFINITIONS[config.data_source] || [];

  const handleFieldToggle = (fieldValue: string) => {
    const newFields = config.selected_fields.includes(fieldValue)
      ? config.selected_fields.filter(f => f !== fieldValue)
      : [...config.selected_fields, fieldValue];
    onUpdate({ selected_fields: newFields });
  };

  const handleSelectAll = () => {
    if (config.selected_fields.length === fields.length) {
      onUpdate({ selected_fields: [] });
    } else {
      onUpdate({ selected_fields: fields.map(f => f.value) });
    }
  };

  if (!config.data_source) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please select a data source first
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-2">Select Fields</h2>
          <p className="text-muted-foreground">
            Choose which fields to include in your report
          </p>
        </div>
        <Badge variant="secondary">
          {config.selected_fields.length} selected
        </Badge>
      </div>

      <div className="flex items-center space-x-2 py-2 border-b">
        <Checkbox
          id="select-all"
          checked={config.selected_fields.length === fields.length}
          onCheckedChange={handleSelectAll}
        />
        <Label htmlFor="select-all" className="font-semibold cursor-pointer">
          Select All Fields
        </Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {fields.map((field) => (
          <div key={field.value} className="flex items-center space-x-2">
            <Checkbox
              id={field.value}
              checked={config.selected_fields.includes(field.value)}
              onCheckedChange={() => handleFieldToggle(field.value)}
            />
            <Label htmlFor={field.value} className="cursor-pointer flex-1">
              {field.label}
              <span className="ml-2 text-xs text-muted-foreground">
                ({field.type})
              </span>
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldSelectionStep;
