import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UniversalLeadForm } from './UniversalLeadForm';

interface LeadFormContext {
  serviceId?: string;
  serviceName?: string;
  city?: string;
  originatingUrl?: string;
}

interface LeadFormModalProps {
  isOpen: boolean;
  headerText: string;
  onClose: () => void;
  onSuccess?: () => void;
  context?: LeadFormContext | null;
}

export const LeadFormModal = ({ 
  isOpen, 
  headerText, 
  onClose, 
  onSuccess,
  context 
}: LeadFormModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{headerText}</DialogTitle>
        </DialogHeader>
        <UniversalLeadForm 
          mode="modal"
          modalHeader={headerText}
          onSuccess={() => {
            onSuccess?.();
            onClose();
          }}
          onCancel={onClose}
          showHeader={false}
          context={context}
        />
      </DialogContent>
    </Dialog>
  );
};
