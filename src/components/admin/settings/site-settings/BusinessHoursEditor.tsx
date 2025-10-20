import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface BusinessHours {
  sunday: DayHours;
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
}

interface BusinessHoursEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const DAYS = [
  { key: 'sunday', label: 'Sunday' },
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
] as const;

const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = minute.toString().padStart(2, '0');
      const time24 = `${hourStr}:${minuteStr}`;
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? 'AM' : 'PM';
      const time12 = `${hour12}:${minuteStr} ${ampm}`;
      times.push(time24);
    }
  }
  return times;
};

const formatTime12Hour = (time24: string): string => {
  const [hourStr, minuteStr] = time24.split(':');
  const hour = parseInt(hourStr);
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${hour12}:${minuteStr} ${ampm}`;
};

const parseBusinessHours = (value: string): BusinessHours => {
  const defaultHours: DayHours = { open: '09:00', close: '17:00', closed: false };
  
  try {
    if (!value) {
      return {
        sunday: { ...defaultHours, closed: true },
        monday: { ...defaultHours },
        tuesday: { ...defaultHours },
        wednesday: { ...defaultHours },
        thursday: { ...defaultHours },
        friday: { ...defaultHours },
        saturday: { ...defaultHours, open: '09:00', close: '13:00' },
      };
    }
    
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as BusinessHours;
    }
  } catch {
    // If parsing fails, return default hours
  }
  
  return {
    sunday: { ...defaultHours, closed: true },
    monday: { ...defaultHours },
    tuesday: { ...defaultHours },
    wednesday: { ...defaultHours },
    thursday: { ...defaultHours },
    friday: { ...defaultHours },
    saturday: { ...defaultHours, open: '09:00', close: '13:00' },
  };
};

export const BusinessHoursEditor = ({ value, onChange }: BusinessHoursEditorProps) => {
  const hours = parseBusinessHours(value);
  const timeOptions = generateTimeOptions();

  const updateDay = (day: keyof BusinessHours, field: keyof DayHours, newValue: string | boolean) => {
    const updated = {
      ...hours,
      [day]: {
        ...hours[day],
        [field]: newValue,
      },
    };
    onChange(JSON.stringify(updated));
  };

  return (
    <div className="space-y-3">
      <Label>Business Hours</Label>
      <div className="border rounded-lg divide-y">
        {DAYS.map(({ key, label }) => {
          const dayHours = hours[key];
          return (
            <div key={key} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-32 font-medium">{label}</div>
              
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <Select
                    value={dayHours.open}
                    onValueChange={(val) => updateDay(key, 'open', val)}
                    disabled={dayHours.closed}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Open" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {timeOptions.map((time) => (
                        <SelectItem key={`${key}-open-${time}`} value={time}>
                          {formatTime12Hour(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <span className="text-muted-foreground">to</span>
                  
                  <Select
                    value={dayHours.close}
                    onValueChange={(val) => updateDay(key, 'close', val)}
                    disabled={dayHours.closed}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Close" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {timeOptions.map((time) => (
                        <SelectItem key={`${key}-close-${time}`} value={time}>
                          {formatTime12Hour(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={dayHours.closed}
                    onCheckedChange={(checked) => updateDay(key, 'closed', checked)}
                  />
                  <Label className="text-sm text-muted-foreground cursor-pointer">
                    Closed
                  </Label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
