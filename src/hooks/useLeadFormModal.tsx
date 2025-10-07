import { create } from 'zustand';

interface LeadFormModalStore {
  isOpen: boolean;
  headerText: string;
  openModal: (headerText: string) => void;
  closeModal: () => void;
}

export const useLeadFormModal = create<LeadFormModalStore>((set) => ({
  isOpen: false,
  headerText: '',
  openModal: (headerText: string) => set({ isOpen: true, headerText }),
  closeModal: () => set({ isOpen: false, headerText: '' }),
}));
