import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, subDays, startOfYear } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface DateRangeSelectorProps {
  onChange: (range: { start: Date; end: Date }) => void;
}

export function DateRangeSelector({ onChange }: DateRangeSelectorProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const presets = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'This Year', days: -1 }, // Special value for year
  ];

  const handlePresetClick = (days: number) => {
    const end = new Date();
    let start: Date;
    
    if (days === -1) {
      // This Year: from Jan 1st to today
      start = startOfYear(end);
    } else if (days === 0) {
      start = end;
    } else {
      start = subDays(end, days);
    }
    
    const newRange = { from: start, to: end };
    setDate(newRange);
    onChange({ start, end });
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDate(range);
    if (range?.from && range?.to) {
      onChange({ start: range.from, end: range.to });
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {presets.map((preset) => (
        <Button
          key={preset.label}
          variant="outline"
          size="sm"
          onClick={() => handlePresetClick(preset.days)}
          className="whitespace-nowrap"
        >
          {preset.label}
        </Button>
      ))}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
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
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
