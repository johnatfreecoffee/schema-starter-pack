import { UniversalLeadForm } from './UniversalLeadForm';

interface LeadFormEmbedProps {
  headerText?: string;
  showHeader?: boolean;
  onSuccess?: () => void;
}

export const LeadFormEmbed = ({ 
  headerText, 
  showHeader = true,
  onSuccess 
}: LeadFormEmbedProps) => {
  return (
    <div 
      className="w-full border border-border rounded-lg p-6 bg-card text-card-foreground shadow-lg"
      style={{
        backgroundColor: 'hsl(var(--card))',
        color: 'hsl(var(--card-foreground))',
        borderColor: 'hsl(var(--border))',
      }}
    >
      <UniversalLeadForm 
        mode="embed"
        modalHeader={headerText}
        showHeader={showHeader}
        onSuccess={onSuccess}
      />
    </div>
  );
};
