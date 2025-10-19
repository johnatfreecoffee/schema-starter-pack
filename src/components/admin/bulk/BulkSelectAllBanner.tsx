import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, X } from 'lucide-react';

interface BulkSelectAllBannerProps {
  visibleCount: number;
  totalCount: number;
  isAllMatchingSelected: boolean;
  onSelectAllMatching: () => void;
  onClear: () => void;
}

export function BulkSelectAllBanner({
  visibleCount,
  totalCount,
  isAllMatchingSelected,
  onSelectAllMatching,
  onClear,
}: BulkSelectAllBannerProps) {
  // Don't show if all items are already visible
  if (totalCount <= visibleCount) return null;

  return (
    <Alert className="mb-4 bg-primary/5 border-primary/20">
      <Info className="h-4 w-4 text-primary" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {!isAllMatchingSelected ? (
            <>
              <span className="text-sm">
                All <strong>{visibleCount}</strong> items on this page are selected.
              </span>
              <Button
                variant="link"
                size="sm"
                onClick={onSelectAllMatching}
                className="h-auto p-0 text-primary font-semibold underline"
              >
                Select all {totalCount} items across all pages
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm">
                All <strong>{totalCount}</strong> items are selected.
              </span>
              <Button
                variant="link"
                size="sm"
                onClick={onClear}
                className="h-auto p-0 text-primary font-semibold underline"
              >
                Clear selection
              </Button>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
