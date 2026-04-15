import { create } from 'zustand';
import { authAPI, type AuthUser, type RegisterPayload } from '../services/api';

type User = AuthUser;

interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthStore>((set) => {
  // Initialize from localStorage
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? (JSON.parse(storedUser) as User) : null;

  return {
    user,
    token,
    loading: false,
    error: null,

    login: async (identifier, password) => {
      set({ loading: true, error: null });
      try {
        const response = await authAPI.login({ identifier, password });
        const { token, user } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        set({ user, token, loading: false });
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        const errorMessage = apiError.response?.data?.message || 'Login failed';
        set({ error: errorMessage, loading: false });
        throw error;
      }
    },

    register: async (data) => {
      set({ loading: true, error: null });
      try {
        const response = await authAPI.register(data);
        const { token, user } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        set({ user, token, loading: false });
      } catch (error: unknown) {
        const apiError = error as { response?: { data?: { message?: string } } };
        const errorMessage = apiError.response?.data?.message || 'Registration failed';
        set({ error: errorMessage, loading: false });
        throw error;
      }
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, error: null });
    },

    clearError: () => set({ error: null }),
    setUser: (user) => set({ user }),
    setToken: (token) => set({ token }),
  };
});
