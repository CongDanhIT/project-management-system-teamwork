import { create } from 'zustand';

interface UiState {
  isInboxSidebarOpen: boolean;
  setInboxSidebarOpen: (isOpen: boolean) => void;
  toggleInboxSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isInboxSidebarOpen: false,
  setInboxSidebarOpen: (isOpen) => set({ isInboxSidebarOpen: isOpen }),
  toggleInboxSidebar: () => set((state) => ({ isInboxSidebarOpen: !state.isInboxSidebarOpen })),
}));
