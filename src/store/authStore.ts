import { create } from 'zustand';

type User = {
  id: string;
  name: string;
};

interface AuthState {
  user: User | null;
}

export const useAuthStore = create<AuthState>(() => ({
  user: { id: 'tenant-prop-single-family-0-0', name: 'Camille Dupont' },
}));
