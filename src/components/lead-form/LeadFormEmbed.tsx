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
    <div className="w-full border rounded-lg p-6 bg-card">
      <UniversalLeadForm 
        mode="embed"
        modalHeader={headerText}
        showHeader={showHeader}
        onSuccess={onSuccess}
      />
    </div>
  );
};
