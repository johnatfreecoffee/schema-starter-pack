import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileFormWrapperProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function MobileFormWrapper({ 
  children, 
  title, 
  description, 
  className 
}: MobileFormWrapperProps) {
  const isMobile = useIsMobile();

  return (
    <div className={cn("w-full", isMobile && "px-4 py-4", className)}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
          )}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      
      <Card className={cn(
        "p-6",
        isMobile && "p-4"
      )}>
        <div className="space-y-4">
          {children}
        </div>
      </Card>
    </div>
  );
}

interface MobileFormFieldProps {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
  className?: string;
}

export function MobileFormField({ 
  label, 
  children, 
  required, 
  error,
  className 
}: MobileFormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium block">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

interface MobileFormActionsProps {
  children: ReactNode;
  className?: string;
}

export function MobileFormActions({ children, className }: MobileFormActionsProps) {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "flex gap-3",
      isMobile ? "flex-col" : "flex-row justify-end",
      "pt-4",
      className
    )}>
      {children}
    </div>
  );
}
