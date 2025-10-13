import { FilterSelect, FilterMultiSelect, FilterDateRange, FilterCheckbox } from '@/components/filters/FilterControls';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TaskAdvancedFiltersProps {
  values: {
    status?: string[];
    priority?: string[];
    assignedTo?: string;
    associatedType?: string;
    associatedId?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    isOverdue?: boolean;
  };
  onChange: (key: string, value: any) => void;
}

export function TaskAdvancedFilters({ values, onChange }: TaskAdvancedFiltersProps) {
  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-filters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email');
      
      if (error) throw error;
      
      return (data || []).map(user => ({
        value: user.id,
        label: user.full_name || user.email || 'Unknown'
      }));
    }
  });

  // Fetch entities for association (simplified - just show types)
  const associatedTypes = [
    { value: 'lead', label: 'Lead' },
    { value: 'account', label: 'Account' },
    { value: 'project', label: 'Project' }
  ];

  const statusOptions = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  return (
    <div className="space-y-4">
      <FilterMultiSelect
        label="Status"
        values={values.status || []}
        onChange={(val) => onChange('status', val)}
        options={statusOptions}
      />

      <FilterMultiSelect
        label="Priority"
        values={values.priority || []}
        onChange={(val) => onChange('priority', val)}
        options={priorityOptions}
      />

      <FilterSelect
        label="Assigned To"
        value={values.assignedTo || ''}
        onChange={(val) => onChange('assignedTo', val)}
        options={[
          { value: '', label: 'All' },
          { value: 'me', label: 'Assigned to Me' },
          { value: 'unassigned', label: 'Unassigned' },
          ...users
        ]}
      />

      <FilterSelect
        label="Associated With"
        value={values.associatedType || ''}
        onChange={(val) => onChange('associatedType', val)}
        options={[
          { value: '', label: 'All Types' },
          ...associatedTypes
        ]}
      />

      <FilterDateRange
        label="Due Date Range"
        from={values.dueDateFrom ? new Date(values.dueDateFrom) : undefined}
        to={values.dueDateTo ? new Date(values.dueDateTo) : undefined}
        onFromChange={(date) => onChange('dueDateFrom', date?.toISOString())}
        onToChange={(date) => onChange('dueDateTo', date?.toISOString())}
      />

      <FilterCheckbox
        label="Overdue Only"
        checked={values.isOverdue || false}
        onChange={(checked) => onChange('isOverdue', checked)}
        description="Show only tasks past their due date"
      />
    </div>
  );
}
