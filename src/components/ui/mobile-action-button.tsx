import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
}

export function MobileActionButton({ 
  onClick, 
  icon, 
  label, 
  className,
  variant = 'default' 
}: MobileActionButtonProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Button
        onClick={onClick}
        variant={variant}
        size="lg"
        className={cn(
          "fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-40",
          "md:hidden",
          className
        )}
      >
        {icon}
        <span className="sr-only">{label}</span>
      </Button>
    );
  }

  return (
    <Button onClick={onClick} variant={variant} className={className}>
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  );
}
