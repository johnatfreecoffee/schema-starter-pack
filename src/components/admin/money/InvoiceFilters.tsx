import { FilterSelect, FilterNumberRange, FilterDateRange } from '@/components/filters/FilterControls';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceFiltersProps {
  values: {
    status?: string;
    paymentStatus?: string;
    accountId?: string;
    amountMin?: number;
    amountMax?: number;
    issueDateFrom?: string;
    issueDateTo?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
  };
  onChange: (key: string, value: any) => void;
}

export function InvoiceFilters({ values, onChange }: InvoiceFiltersProps) {
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
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const paymentStatusOptions = [
    { value: '', label: 'All Payment Statuses' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'partially_paid', label: 'Partially Paid' },
    { value: 'fully_paid', label: 'Fully Paid' }
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
        label="Payment Status"
        value={values.paymentStatus || ''}
        onChange={(val) => onChange('paymentStatus', val)}
        options={paymentStatusOptions}
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
        label="Invoice Amount"
        min={values.amountMin}
        max={values.amountMax}
        onMinChange={(val) => onChange('amountMin', val)}
        onMaxChange={(val) => onChange('amountMax', val)}
        placeholder="$"
      />

      <FilterDateRange
        label="Issue Date Range"
        from={values.issueDateFrom ? new Date(values.issueDateFrom) : undefined}
        to={values.issueDateTo ? new Date(values.issueDateTo) : undefined}
        onFromChange={(date) => onChange('issueDateFrom', date?.toISOString())}
        onToChange={(date) => onChange('issueDateTo', date?.toISOString())}
      />

      <FilterDateRange
        label="Due Date Range"
        from={values.dueDateFrom ? new Date(values.dueDateFrom) : undefined}
        to={values.dueDateTo ? new Date(values.dueDateTo) : undefined}
        onFromChange={(date) => onChange('dueDateFrom', date?.toISOString())}
        onToChange={(date) => onChange('dueDateTo', date?.toISOString())}
      />
    </div>
  );
}
