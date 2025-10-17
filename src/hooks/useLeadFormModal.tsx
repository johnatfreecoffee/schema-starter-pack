import { create } from 'zustand';

interface LeadFormContext {
  serviceId?: string;
  serviceName?: string;
  city?: string;
  originatingUrl?: string;
}

interface LeadFormModalStore {
  isOpen: boolean;
  headerText: string;
  context: LeadFormContext | null;
  openModal: (headerText: string, context?: LeadFormContext) => void;
  closeModal: () => void;
}

export const useLeadFormModal = create<LeadFormModalStore>((set) => ({
  isOpen: false,
  headerText: '',
  context: null,
  openModal: (headerText: string, context?: LeadFormContext) => 
    set({ isOpen: true, headerText, context: context || null }),
  closeModal: () => set({ isOpen: false, headerText: '', context: null }),
}));
