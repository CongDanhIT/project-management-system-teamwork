import { create } from 'zustand';

interface UiState {
  isInboxSidebarOpen: boolean;
  setInboxSidebarOpen: (isOpen: boolean) => void;
  toggleInboxSidebar: () => void;
  
  // Left Sidebar
  isLeftSidebarOpen: boolean;
  setLeftSidebarOpen: (isOpen: boolean) => void;
  toggleLeftSidebar: () => void;

  // Floating Dock States
  isDocPanelOpen: boolean;
  setDocPanelOpen: (isOpen: boolean) => void;
  toggleDocPanel: () => void;
  
  isDrawingMode: boolean;
  setDrawingMode: (isDrawing: boolean) => void;
  toggleDrawingMode: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isInboxSidebarOpen: false,
  setInboxSidebarOpen: (isOpen) => set({ isInboxSidebarOpen: isOpen }),
  toggleInboxSidebar: () => set((state) => ({ isInboxSidebarOpen: !state.isInboxSidebarOpen })),

  isLeftSidebarOpen: true,
  setLeftSidebarOpen: (isOpen) => set({ isLeftSidebarOpen: isOpen }),
  toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),

  isDocPanelOpen: false,
  setDocPanelOpen: (isOpen) => set({ isDocPanelOpen: isOpen }),
  toggleDocPanel: () => set((state) => ({ isDocPanelOpen: !state.isDocPanelOpen })),

  isDrawingMode: false,
  setDrawingMode: (isDrawing) => set({ isDrawingMode: isDrawing }),
  toggleDrawingMode: () => set((state) => ({ isDrawingMode: !state.isDrawingMode })),
}));
