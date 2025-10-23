import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface TruncatedMessageProps {
  content: string;
  maxLength?: number;
  className?: string;
}

const TruncatedMessage = ({ content, maxLength = 300, className = '' }: TruncatedMessageProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = content.length > maxLength;

  if (!shouldTruncate) {
    return <p className={`text-sm whitespace-pre-wrap break-words ${className}`}>{content}</p>;
  }

  const displayContent = isExpanded ? content : content.slice(0, maxLength) + '...';

  return (
    <div className={className}>
      <p className="text-sm whitespace-pre-wrap break-words">{displayContent}</p>
      <Button
        variant="link"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-auto p-0 mt-1 text-xs"
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </Button>
    </div>
  );
};

export default TruncatedMessage;
