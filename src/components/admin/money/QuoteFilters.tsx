import { FilterSelect, FilterNumberRange, FilterDateRange } from '@/components/filters/FilterControls';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface QuoteFiltersProps {
  values: {
    status?: string;
    accountId?: string;
    amountMin?: number;
    amountMax?: number;
    createdFrom?: string;
    createdTo?: string;
    validUntilFrom?: string;
    validUntilTo?: string;
  };
  onChange: (key: string, value: any) => void;
}

export function QuoteFilters({ values, onChange }: QuoteFiltersProps) {
  // Fetch accounts for filtering
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts-for-filters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, account_name')
        .order('account_name');
      
      if (error) throw error;
      
      return data?.map(a => ({
        value: a.id,
        label: a.account_name
      })) || [];
    }
  });

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'declined', label: 'Declined' },
    { value: 'expired', label: 'Expired' }
  ];

  return (
    <div className="space-y-4">
      <FilterSelect
        label="Status"
        value={values.status || ''}
        onChange={(val) => onChange('status', val)}
        options={statusOptions}
      />

      <FilterSelect
        label="Account"
        value={values.accountId || ''}
        onChange={(val) => onChange('accountId', val)}
        options={[
          { value: '', label: 'All Accounts' },
          ...accounts
        ]}
        placeholder="Search accounts..."
      />

      <FilterNumberRange
        label="Quote Amount"
        min={values.amountMin}
        max={values.amountMax}
        onMinChange={(val) => onChange('amountMin', val)}
        onMaxChange={(val) => onChange('amountMax', val)}
        placeholder="$"
      />

      <FilterDateRange
        label="Created Date Range"
        from={values.createdFrom ? new Date(values.createdFrom) : undefined}
        to={values.createdTo ? new Date(values.createdTo) : undefined}
        onFromChange={(date) => onChange('createdFrom', date?.toISOString())}
        onToChange={(date) => onChange('createdTo', date?.toISOString())}
      />

      <FilterDateRange
        label="Valid Until Range"
        from={values.validUntilFrom ? new Date(values.validUntilFrom) : undefined}
        to={values.validUntilTo ? new Date(values.validUntilTo) : undefined}
        onFromChange={(date) => onChange('validUntilFrom', date?.toISOString())}
        onToChange={(date) => onChange('validUntilTo', date?.toISOString())}
      />
    </div>
  );
}
