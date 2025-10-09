import {
  FilterSelect,
  FilterMultiSelect,
  FilterDateRange,
  FilterCheckbox,
} from '@/components/filters/FilterControls';

interface LeadAdvancedFiltersProps {
  values: {
    status?: string[];
    source?: string;
    assignedTo?: string;
    hasNotes?: boolean;
    createdFrom?: Date;
    createdTo?: Date;
  };
  onChange: (key: string, value: any) => void;
  users: Array<{ id: string; name: string }>;
}

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'lost', label: 'Lost' },
  { value: 'converted', label: 'Converted' },
];

const sourceOptions = [
  { value: 'all', label: 'All Sources' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'email', label: 'Email' },
  { value: 'other', label: 'Other' },
];

export function LeadAdvancedFilters({ values, onChange, users }: LeadAdvancedFiltersProps) {
  const userOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'unassigned', label: 'Unassigned' },
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
        label="Source"
        value={values.source || 'all'}
        onChange={(source) => onChange('source', source === 'all' ? undefined : source)}
        options={sourceOptions}
      />

      <FilterSelect
        label="Assigned To"
        value={values.assignedTo || 'all'}
        onChange={(assignedTo) => onChange('assignedTo', assignedTo === 'all' ? undefined : assignedTo)}
        options={userOptions}
      />

      <FilterCheckbox
        label="Has Notes"
        checked={values.hasNotes || false}
        onChange={(checked) => onChange('hasNotes', checked)}
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
