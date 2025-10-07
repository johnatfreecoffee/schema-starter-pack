import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type StatusFilters = {
  active: boolean;
  inactive: boolean;
  archived: boolean;
};

interface AccountFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilters: StatusFilters;
  onStatusFilterChange: (status: keyof StatusFilters, checked: boolean) => void;
  dateRange: { from?: Date; to?: Date };
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void;
  fromLeadOnly: boolean;
  onFromLeadOnlyChange: (checked: boolean) => void;
  statusCounts: {
    active: number;
    inactive: number;
    archived: number;
  };
}

export const AccountFilters = ({
  search,
  onSearchChange,
  statusFilters,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
  fromLeadOnly,
  onFromLeadOnlyChange,
  statusCounts
}: AccountFiltersProps) => {
  return (
    <div className="space-y-6 p-4 border-r bg-muted/10">
      <div>
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Search by name, contact, email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="mb-3 block">Status</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="status-active"
              checked={statusFilters.active}
              onCheckedChange={(checked) => 
                onStatusFilterChange('active', checked as boolean)
              }
            />
            <label
              htmlFor="status-active"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Active ({statusCounts.active})
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="status-inactive"
              checked={statusFilters.inactive}
              onCheckedChange={(checked) => 
                onStatusFilterChange('inactive', checked as boolean)
              }
            />
            <label
              htmlFor="status-inactive"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Inactive ({statusCounts.inactive})
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="status-archived"
              checked={statusFilters.archived}
              onCheckedChange={(checked) => 
                onStatusFilterChange('archived', checked as boolean)
              }
            />
            <label
              htmlFor="status-archived"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Archived ({statusCounts.archived})
            </label>
          </div>
        </div>
      </div>

      <div>
        <Label className="mb-3 block">Date Range</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => onDateRangeChange(range || {})}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="from-lead"
            checked={fromLeadOnly}
            onCheckedChange={(checked) => onFromLeadOnlyChange(checked as boolean)}
          />
          <label
            htmlFor="from-lead"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            From Converted Leads Only
          </label>
        </div>
      </div>
    </div>
  );
};
