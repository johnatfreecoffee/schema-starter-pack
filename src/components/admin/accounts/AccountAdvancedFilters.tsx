import {
  FilterSelect,
  FilterText,
  FilterNumberRange,
  FilterDateRange,
} from '@/components/filters/FilterControls';

interface AccountAdvancedFiltersProps {
  values: {
    industry?: string;
    accountType?: string;
    status?: string;
    assignedTo?: string;
    revenueMin?: number;
    revenueMax?: number;
    createdFrom?: Date;
    createdTo?: Date;
  };
  onChange: (key: string, value: any) => void;
  users: Array<{ id: string; name: string }>;
}

const accountTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'client', label: 'Client' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'partner', label: 'Partner' },
  { value: 'vendor', label: 'Vendor' },
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

export function AccountAdvancedFilters({ values, onChange, users }: AccountAdvancedFiltersProps) {
  const userOptions = [
    { value: 'all', label: 'All Users' },
    ...users.map((u) => ({ value: u.id, label: u.name })),
  ];

  return (
    <div className="space-y-4">
      <FilterText
        label="Industry"
        value={values.industry || ''}
        onChange={(industry) => onChange('industry', industry)}
        placeholder="Search industry..."
      />

      <FilterSelect
        label="Account Type"
        value={values.accountType || 'all'}
        onChange={(type) => onChange('accountType', type === 'all' ? undefined : type)}
        options={accountTypeOptions}
      />

      <FilterSelect
        label="Status"
        value={values.status || 'all'}
        onChange={(status) => onChange('status', status === 'all' ? undefined : status)}
        options={statusOptions}
      />

      <FilterSelect
        label="Assigned To"
        value={values.assignedTo || 'all'}
        onChange={(assignedTo) => onChange('assignedTo', assignedTo === 'all' ? undefined : assignedTo)}
        options={userOptions}
      />

      <FilterNumberRange
        label="Revenue Range"
        min={values.revenueMin}
        max={values.revenueMax}
        onMinChange={(min) => onChange('revenueMin', min)}
        onMaxChange={(max) => onChange('revenueMax', max)}
        placeholder="$"
      />

      <FilterDateRange
        label="Created Date"
        from={values.createdFrom}
        to={values.createdTo}
        onFromChange={(date) => onChange('createdFrom', date)}
        onToChange={(date) => onChange('createdTo', date)}
      />
    </div>
  );
}
