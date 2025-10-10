import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface Condition {
  field: string;
  operator: string;
  value: string;
  logic?: 'AND' | 'OR';
}

interface WorkflowConditionBuilderProps {
  module: string;
  conditions: any;
  onConditionsChange: (conditions: any) => void;
}

const operators = [
  { id: 'equals', label: 'Equals' },
  { id: 'not_equals', label: 'Does Not Equal' },
  { id: 'contains', label: 'Contains' },
  { id: 'not_contains', label: 'Does Not Contain' },
  { id: 'greater_than', label: 'Greater Than' },
  { id: 'less_than', label: 'Less Than' },
  { id: 'is_empty', label: 'Is Empty' },
  { id: 'is_not_empty', label: 'Is Not Empty' },
];

// Sample fields - in production, these would be fetched based on the module
const getFieldsForModule = (module: string) => {
  const commonFields = [
    { id: 'status', label: 'Status', type: 'text' },
    { id: 'created_at', label: 'Created Date', type: 'date' },
    { id: 'updated_at', label: 'Updated Date', type: 'date' },
  ];

  const moduleSpecificFields: Record<string, any[]> = {
    leads: [
      { id: 'source', label: 'Lead Source', type: 'text' },
      { id: 'service_needed', label: 'Service Needed', type: 'text' },
      { id: 'is_emergency', label: 'Is Emergency', type: 'boolean' },
      { id: 'city', label: 'City', type: 'text' },
      { id: 'state', label: 'State', type: 'text' },
    ],
    accounts: [
      { id: 'account_name', label: 'Account Name', type: 'text' },
      { id: 'industry', label: 'Industry', type: 'text' },
      { id: 'website', label: 'Website', type: 'text' },
    ],
    projects: [
      { id: 'project_name', label: 'Project Name', type: 'text' },
      { id: 'budget', label: 'Budget', type: 'number' },
      { id: 'start_date', label: 'Start Date', type: 'date' },
    ],
  };

  return [...commonFields, ...(moduleSpecificFields[module] || [])];
};

export const WorkflowConditionBuilder = ({
  module,
  conditions,
  onConditionsChange,
}: WorkflowConditionBuilderProps) => {
  const [localConditions, setLocalConditions] = useState<Condition[]>(
    conditions?.conditions || []
  );

  const fields = getFieldsForModule(module);

  const addCondition = () => {
    const newConditions: Condition[] = [
      ...localConditions,
      {
        field: fields[0]?.id || '',
        operator: 'equals',
        value: '',
        logic: (localConditions.length > 0 ? 'AND' : undefined) as 'AND' | 'OR' | undefined,
      },
    ];
    setLocalConditions(newConditions);
    onConditionsChange({ conditions: newConditions });
  };

  const updateCondition = (index: number, updates: Partial<Condition>) => {
    const newConditions = [...localConditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setLocalConditions(newConditions);
    onConditionsChange({ conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    const newConditions = localConditions.filter((_, i) => i !== index);
    setLocalConditions(newConditions);
    onConditionsChange({ conditions: newConditions });
  };

  if (!module) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please select a trigger module first
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {localConditions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No conditions added. This workflow will run for all records.
          </p>
          <Button onClick={addCondition} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
        </div>
      ) : (
        <>
          {localConditions.map((condition, index) => (
            <div key={index} className="space-y-2">
              {index > 0 && (
                <div className="flex items-center gap-2">
                  <Select
                    value={condition.logic || 'AND'}
                    onValueChange={(value: 'AND' | 'OR') =>
                      updateCondition(index, { logic: value })
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1 h-px bg-border"></div>
                </div>
              )}

              <div className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor={`field-${index}`} className="text-xs">
                      Field
                    </Label>
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(index, { field: value })}
                    >
                      <SelectTrigger id={`field-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`operator-${index}`} className="text-xs">
                      Operator
                    </Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(index, { operator: value })}
                    >
                      <SelectTrigger id={`operator-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((op) => (
                          <SelectItem key={op.id} value={op.id}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`value-${index}`} className="text-xs">
                      Value
                    </Label>
                    <Input
                      id={`value-${index}`}
                      value={condition.value}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      placeholder="Value"
                      disabled={
                        condition.operator === 'is_empty' ||
                        condition.operator === 'is_not_empty'
                      }
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCondition(index)}
                  className="mt-6"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button onClick={addCondition} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
        </>
      )}
    </div>
  );
};
