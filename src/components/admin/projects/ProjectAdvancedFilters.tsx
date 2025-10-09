import { useEffect, useState } from 'react';
import {
  FilterSelect,
  FilterMultiSelect,
  FilterDateRange,
  FilterNumberRange,
} from '@/components/filters/FilterControls';
import { supabase } from '@/integrations/supabase/client';

interface ProjectAdvancedFiltersProps {
  values: {
    status?: string[];
    accountId?: string;
    assignedTo?: string;
    startDateFrom?: Date;
    startDateTo?: Date;
    endDateFrom?: Date;
    endDateTo?: Date;
    budgetMin?: number;
    budgetMax?: number;
  };
  onChange: (key: string, value: any) => void;
  users: Array<{ id: string; name: string }>;
}

const statusOptions = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function ProjectAdvancedFilters({ values, onChange, users }: ProjectAdvancedFiltersProps) {
  const [accounts, setAccounts] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase
        .from('accounts')
        .select('id, account_name')
        .order('account_name');

      if (data) {
        setAccounts([
          { value: 'all', label: 'All Accounts' },
          ...data.map((a) => ({ value: a.id, label: a.account_name })),
        ]);
      }
    };
    fetchAccounts();
  }, []);

  const userOptions = [
    { value: 'all', label: 'All Users' },
    ...users.map((u) => ({ value: u.id, label: u.name })),
  ];

  return (
    <div className="space-y-4">
      <FilterMultiSelect
        label="Status"
        values={values.status || []}
        onChange={(statuses) => onChange('status', statuses)}
        options={statusOptions}
      />

      <FilterSelect
        label="Associated Account"
        value={values.accountId || 'all'}
        onChange={(accountId) => onChange('accountId', accountId === 'all' ? undefined : accountId)}
        options={accounts}
      />

      <FilterSelect
        label="Assigned To"
        value={values.assignedTo || 'all'}
        onChange={(assignedTo) => onChange('assignedTo', assignedTo === 'all' ? undefined : assignedTo)}
        options={userOptions}
      />

      <FilterDateRange
        label="Start Date"
        from={values.startDateFrom}
        to={values.startDateTo}
        onFromChange={(date) => onChange('startDateFrom', date)}
        onToChange={(date) => onChange('startDateTo', date)}
      />

      <FilterDateRange
        label="End Date"
        from={values.endDateFrom}
        to={values.endDateTo}
        onFromChange={(date) => onChange('endDateFrom', date)}
        onToChange={(date) => onChange('endDateTo', date)}
      />

      <FilterNumberRange
        label="Budget Range"
        min={values.budgetMin}
        max={values.budgetMax}
        onMinChange={(min) => onChange('budgetMin', min)}
        onMaxChange={(max) => onChange('budgetMax', max)}
        placeholder="$"
      />
    </div>
  );
}
