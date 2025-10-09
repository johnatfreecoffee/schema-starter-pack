import { useEffect, useState } from 'react';
import {
  FilterSelect,
  FilterText,
  FilterCheckbox,
} from '@/components/filters/FilterControls';
import { supabase } from '@/integrations/supabase/client';

interface ContactAdvancedFiltersProps {
  values: {
    accountId?: string;
    jobTitle?: string;
    contactType?: string;
    hasEmail?: boolean;
    hasPhone?: boolean;
  };
  onChange: (key: string, value: any) => void;
}

const contactTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'primary', label: 'Primary' },
  { value: 'billing', label: 'Billing' },
  { value: 'technical', label: 'Technical' },
  { value: 'other', label: 'Other' },
];

export function ContactAdvancedFilters({ values, onChange }: ContactAdvancedFiltersProps) {
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

  return (
    <div className="space-y-4">
      <FilterSelect
        label="Associated Account"
        value={values.accountId || 'all'}
        onChange={(accountId) => onChange('accountId', accountId === 'all' ? undefined : accountId)}
        options={accounts}
      />

      <FilterText
        label="Job Title"
        value={values.jobTitle || ''}
        onChange={(jobTitle) => onChange('jobTitle', jobTitle)}
        placeholder="Search job title..."
      />

      <FilterSelect
        label="Contact Type"
        value={values.contactType || 'all'}
        onChange={(type) => onChange('contactType', type === 'all' ? undefined : type)}
        options={contactTypeOptions}
      />

      <FilterCheckbox
        label="Has Email"
        checked={values.hasEmail || false}
        onChange={(checked) => onChange('hasEmail', checked)}
      />

      <FilterCheckbox
        label="Has Phone"
        checked={values.hasPhone || false}
        onChange={(checked) => onChange('hasPhone', checked)}
      />
    </div>
  );
}
