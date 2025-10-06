import { Input } from '@/components/ui/input';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

const ColorPicker = ({ value, onChange, label }: ColorPickerProps) => {
  return (
    <div className="flex items-center gap-4 mt-2">
      <div className="flex items-center gap-2 flex-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-20 rounded cursor-pointer"
          aria-label={label}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
          pattern="^#[0-9A-Fa-f]{6}$"
        />
      </div>
      <div 
        className="w-10 h-10 rounded border"
        style={{ backgroundColor: value }}
        aria-label={`${label} preview`}
      />
    </div>
  );
};

export default ColorPicker;
