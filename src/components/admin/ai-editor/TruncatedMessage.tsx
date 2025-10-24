import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TruncatedMessageProps {
  content: string;
  maxLength?: number;
  className?: string;
  isUser?: boolean; // styles for user bubble (blue background)
}

const TruncatedMessage = ({ content, maxLength = 300, className = '', isUser = false }: TruncatedMessageProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

  if (!shouldTruncate) {
    return (
      <div className="relative group">
        <p className={cn('text-sm whitespace-pre-wrap break-words', className)}>
          {content}
        </p>
        <div className="flex gap-1 justify-end mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={cn(
              'h-6 px-2 text-xs',
              isUser ? 'text-primary-foreground hover:bg-primary-foreground/20' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <div className={cn('text-sm whitespace-pre-wrap break-words', isExpanded ? 'max-h-[400px] overflow-y-auto pr-2' : undefined)}>
        {displayContent}
      </div>
      <div className="flex items-center justify-between mt-2">
        <Button
          variant="link"
          size="sm"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'h-auto p-0 text-xs underline opacity-90 hover:opacity-100',
            isUser ? 'text-primary-foreground' : 'text-foreground'
          )}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className={cn(
            'h-6 px-2 text-xs',
            isUser ? 'text-primary-foreground hover:bg-primary-foreground/20' : 'text-muted-foreground hover:bg-muted'
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
};

export default TruncatedMessage;
