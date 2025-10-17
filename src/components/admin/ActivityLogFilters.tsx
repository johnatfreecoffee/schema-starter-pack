import { Calendar, Filter, User, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface ActivityLogFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  entityType: string;
  onEntityTypeChange: (value: string) => void;
  action: string;
  onActionChange: (value: string) => void;
  userId: string;
  onUserIdChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  users: Array<{ id: string; name: string }>;
}

const entityTypes = [
  { value: 'all', label: 'All Entities' },
  { value: 'lead', label: 'Leads' },
  { value: 'account', label: 'Accounts' },
  { value: 'contact', label: 'Contacts' },
  { value: 'project', label: 'Projects' },
  { value: 'task', label: 'Tasks' },
  { value: 'appointment', label: 'Appointments' },
  { value: 'quote', label: 'Quotes' },
  { value: 'invoice', label: 'Invoices' },
];

const actions = [
  { value: 'all', label: 'All Actions' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'status_changed', label: 'Status Changed' },
  { value: 'converted', label: 'Converted' },
];

export function ActivityLogFilters({
  search,
  onSearchChange,
  entityType,
  onEntityTypeChange,
  action,
  onActionChange,
  userId,
  onUserIdChange,
  dateRange,
  onDateRangeChange,
  users,
}: ActivityLogFiltersProps) {
  const quickRanges = [
    { label: 'Last 24 hours', days: 1 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
  ];

  const setQuickRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onDateRangeChange({ from, to });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by entity name or ID..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full"
          />
        </div>

        <Select value={entityType} onValueChange={onEntityTypeChange}>
          <SelectTrigger className="w-[180px]">
            <Layers className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            {entityTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={action} onValueChange={onActionChange}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            {actions.map((act) => (
              <SelectItem key={act.value} value={act.value}>
                {act.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={userId} onValueChange={onUserIdChange}>
          <SelectTrigger className="w-[180px]">
            <User className="h-4 w-4 mr-2" />
            <SelectValue placeholder="User" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b space-y-2">
              {quickRanges.map((range) => (
                <Button
                  key={range.days}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setQuickRange(range.days)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
            <CalendarComponent
              mode="range"
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
