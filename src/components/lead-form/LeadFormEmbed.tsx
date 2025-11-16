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
        all: 'revert',
        width: '100%',
        backgroundColor: 'hsl(0 0% 100%)',
        color: 'hsl(222 47% 11%)',
        borderColor: 'hsl(214 32% 91%)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
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
