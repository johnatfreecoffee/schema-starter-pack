import { useLeadFormModal } from '@/hooks/useLeadFormModal';
import { LeadFormModal } from './LeadFormModal';

export const GlobalLeadFormModal = () => {
  const { isOpen, headerText, context, closeModal } = useLeadFormModal();

  return (
    <LeadFormModal
      isOpen={isOpen}
      headerText={headerText}
      onClose={closeModal}
      onSuccess={closeModal}
      context={context}
    />
  );
};
