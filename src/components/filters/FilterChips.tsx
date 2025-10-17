import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FilterChipsProps {
  filters: Record<string, any>;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

const formatFilterValue = (value: any): string => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  return String(value);
};

const formatFilterLabel = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export function FilterChips({ filters, onRemove, onClearAll }: FilterChipsProps) {
  // Filter out internal/debug keys that shouldn't be displayed
  const internalKeys = ['_lovable_token', 'token', 'session', 'auth'];
  
  const activeFilters = Object.entries(filters).filter(
    ([key, value]) => 
      value !== null && 
      value !== undefined && 
      value !== '' &&
      !internalKeys.some(internal => key.toLowerCase().includes(internal))
  );

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {activeFilters.map(([key, value]) => (
        <Badge key={key} variant="secondary" className="gap-2 pr-1">
          <span className="text-xs">
            {formatFilterLabel(key)}: {formatFilterValue(value)}
          </span>
          <button
            onClick={() => onRemove(key)}
            className="ml-1 hover:bg-muted rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {activeFilters.length > 1 && (
        <Button variant="ghost" size="sm" onClick={onClearAll} className="h-6 text-xs">
          Clear all
        </Button>
      )}
    </div>
  );
}
