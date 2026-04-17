import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currentWorkspaceId?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token?: string | null;
  isInitializing: boolean;
  setAuth: (user: any, token?: string) => void;
  setInitializing: (val: boolean) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      isInitializing: true,
      setAuth: (user, token) => set({ 
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.profilePicture,
          currentWorkspaceId: typeof user.currentWorkspace === 'object' ? user.currentWorkspace?._id : user.currentWorkspace,
        }, 
        token: token || null, 
        isAuthenticated: true,
        isInitializing: false
      }),
      setInitializing: (val) => set({ isInitializing: val }),
      logout: () => set({ user: null, token: null, isAuthenticated: false, isInitializing: false }),
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated, 
        token: state.token 
      }), // Chỉ persist user, token, và auth status. KHÔNG persist isInitializing.
    }
  )
);
