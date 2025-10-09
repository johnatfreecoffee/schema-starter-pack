import { FilterSelect, FilterDateRange, FilterCheckbox } from '@/components/filters/FilterControls';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CalendarEventFiltersProps {
  values: {
    eventType?: string;
    assignedTo?: string;
    associatedType?: string;
    startDateFrom?: string;
    startDateTo?: string;
    endDateFrom?: string;
    endDateTo?: string;
    isAllDay?: boolean;
  };
  onChange: (key: string, value: any) => void;
}

export function CalendarEventFilters({ values, onChange }: CalendarEventFiltersProps) {
  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-filters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'crm_user']);
      
      if (error) throw error;
      
      const userIds = data?.map(u => u.user_id) || [];
      const usersList: any[] = [];
      
      for (const userId of userIds) {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        if (userData?.user) {
          usersList.push({
            value: userId,
            label: `${userData.user.user_metadata?.first_name || ''} ${userData.user.user_metadata?.last_name || ''}`.trim() || userData.user.email || 'Unknown'
          });
        }
      }
      
      return usersList;
    }
  });

  const eventTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'call', label: 'Call' },
    { value: 'site_visit', label: 'Site Visit' },
    { value: 'deadline', label: 'Deadline' },
    { value: 'reminder', label: 'Reminder' }
  ];

  const associatedTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'lead', label: 'Lead' },
    { value: 'account', label: 'Account' },
    { value: 'project', label: 'Project' }
  ];

  return (
    <div className="space-y-4">
      <FilterSelect
        label="Event Type"
        value={values.eventType || ''}
        onChange={(val) => onChange('eventType', val)}
        options={eventTypeOptions}
      />

      <FilterSelect
        label="Assigned To"
        value={values.assignedTo || ''}
        onChange={(val) => onChange('assignedTo', val)}
        options={[
          { value: '', label: 'All' },
          { value: 'me', label: 'My Events' },
          ...users
        ]}
      />

      <FilterSelect
        label="Associated With"
        value={values.associatedType || ''}
        onChange={(val) => onChange('associatedType', val)}
        options={associatedTypeOptions}
      />

      <FilterDateRange
        label="Start Date Range"
        from={values.startDateFrom ? new Date(values.startDateFrom) : undefined}
        to={values.startDateTo ? new Date(values.startDateTo) : undefined}
        onFromChange={(date) => onChange('startDateFrom', date?.toISOString())}
        onToChange={(date) => onChange('startDateTo', date?.toISOString())}
      />

      <FilterDateRange
        label="End Date Range"
        from={values.endDateFrom ? new Date(values.endDateFrom) : undefined}
        to={values.endDateTo ? new Date(values.endDateTo) : undefined}
        onFromChange={(date) => onChange('endDateFrom', date?.toISOString())}
        onToChange={(date) => onChange('endDateTo', date?.toISOString())}
      />

      <FilterCheckbox
        label="All-Day Events Only"
        checked={values.isAllDay || false}
        onChange={(checked) => onChange('isAllDay', checked)}
        description="Show only all-day events"
      />
    </div>
  );
}
