import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FilterControlProps {
  label: string;
  children?: ReactNode;
}

function FilterControl({ label, children }: FilterControlProps) {
  return (
    <div className="space-y-2 mb-4">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function FilterSelect({ label, value, onChange, options, placeholder = 'Select...' }: FilterSelectProps) {
  return (
    <FilterControl label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FilterControl>
  );
}

interface FilterMultiSelectProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: { value: string; label: string }[];
}

export function FilterMultiSelect({ label, values, onChange, options }: FilterMultiSelectProps) {
  const handleToggle = (value: string) => {
    onChange(
      values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value]
    );
  };

  return (
    <FilterControl label={label}>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <Checkbox
              id={option.value}
              checked={values.includes(option.value)}
              onCheckedChange={() => handleToggle(option.value)}
            />
            <label
              htmlFor={option.value}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
    </FilterControl>
  );
}

interface FilterDateRangeProps {
  label: string;
  from?: Date;
  to?: Date;
  onFromChange: (date?: Date) => void;
  onToChange: (date?: Date) => void;
}

export function FilterDateRange({ label, from, to, onFromChange, onToChange }: FilterDateRangeProps) {
  return (
    <FilterControl label={label}>
      <div className="grid grid-cols-2 gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                !from && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {from ? format(from, 'PPP') : <span>From</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={from} onSelect={onFromChange} initialFocus className="pointer-events-auto" />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal',
                !to && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {to ? format(to, 'PPP') : <span>To</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={to} onSelect={onToChange} initialFocus className="pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>
    </FilterControl>
  );
}

interface FilterNumberRangeProps {
  label: string;
  min?: number;
  max?: number;
  onMinChange: (value?: number) => void;
  onMaxChange: (value?: number) => void;
  placeholder?: string;
}

export function FilterNumberRange({
  label,
  min,
  max,
  onMinChange,
  onMaxChange,
  placeholder = '0',
}: FilterNumberRangeProps) {
  return (
    <FilterControl label={label}>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          placeholder={`Min ${placeholder}`}
          value={min ?? ''}
          onChange={(e) => onMinChange(e.target.value ? Number(e.target.value) : undefined)}
        />
        <Input
          type="number"
          placeholder={`Max ${placeholder}`}
          value={max ?? ''}
          onChange={(e) => onMaxChange(e.target.value ? Number(e.target.value) : undefined)}
        />
      </div>
    </FilterControl>
  );
}

interface FilterTextProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FilterText({ label, value, onChange, placeholder }: FilterTextProps) {
  return (
    <FilterControl label={label}>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </FilterControl>
  );
}

interface FilterCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export function FilterCheckbox({ label, checked, onChange, description }: FilterCheckboxProps) {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <Checkbox id={label} checked={checked} onCheckedChange={onChange} />
      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor={label}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          {label}
        </label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
