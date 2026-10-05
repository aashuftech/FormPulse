import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { UserProfile } from '@/types';
import { authApi } from '@/services/authApi';
import { AuthContext } from './auth-context-def';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authRequestVersion = useRef(0);

  useEffect(() => {
    const requestVersion = authRequestVersion.current;
    authApi
      .currentUser()
      .then(currentUser => {
        if (requestVersion === authRequestVersion.current) setUser(currentUser);
      })
      .catch(() => {
        if (requestVersion === authRequestVersion.current) setUser(null);
      })
      .finally(() => {
        if (requestVersion === authRequestVersion.current) setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    authRequestVersion.current += 1;
    try {
      setUser(await authApi.login(email, password));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    targetGoal: string,
  ): Promise<void> => {
    authRequestVersion.current += 1;
    try {
      setUser(await authApi.register(name, email, password, targetGoal));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    authRequestVersion.current += 1;
    await authApi.logout().catch(() => undefined);
    setUser(null);
    setIsLoading(false);
  };

  const updateUser = (data: Partial<UserProfile>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
