import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TruncatedMessageProps {
  content: string;
  maxLength?: number;
  className?: string;
  isUser?: boolean; // styles for user bubble (blue background)
}

const TruncatedMessage = ({ content, maxLength = 300, className = '', isUser = false }: TruncatedMessageProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldTruncate = content.length > maxLength;

  const truncated = useMemo(() => (shouldTruncate ? content.slice(0, maxLength) + '...' : content), [content, maxLength, shouldTruncate]);
  const displayContent = isExpanded ? content : truncated;

  useEffect(() => {
    if (isExpanded) {
      // Keep expanded message visible without breaking layout
      const el = containerRef.current;
      if (!el) return;
      // Wait for layout to settle then scroll to nearest without snapping to extremes
      const id = setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
      return () => clearTimeout(id);
    }
  }, [isExpanded]);

  if (!shouldTruncate) {
    return (
      <p className={cn('text-sm whitespace-pre-wrap break-words', className)}>
        {content}
      </p>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <div className={cn('text-sm whitespace-pre-wrap break-words', isExpanded ? 'max-h-[400px] overflow-y-auto pr-2' : undefined)}>
        {displayContent}
      </div>
      <Button
        variant="link"
        size="sm"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'h-auto p-0 mt-1 text-xs underline opacity-90 hover:opacity-100',
          isUser ? 'text-primary-foreground' : 'text-foreground'
        )}
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </Button>
    </div>
  );
};

export default TruncatedMessage;
