import { createContext } from 'react';
import type { UserProfile } from '@/types';

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, targetGoal: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
