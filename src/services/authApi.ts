import type { UserProfile } from '@/types';

const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL ?? '');

interface AuthResponse {
  user: UserProfile;
}

async function request<T>(
  path: string,
  body?: Record<string, string>,
): Promise<T> {
  const response = await fetch(`${API_URL}/api/auth${path}`, {
    method: body ? 'POST' : 'GET',
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const result = (await response.json().catch(() => ({}))) as { message?: string } & T;
  if (!response.ok) {
    throw new Error(result.message ?? 'Authentication request failed');
  }
  return result;
}

export const authApi = {
  async login(email: string, password: string): Promise<UserProfile> {
    const result = await request<AuthResponse>('/login', { email, password });
    return result.user;
  },

  async register(
    name: string,
    email: string,
    password: string,
    targetGoal: string,
  ): Promise<UserProfile> {
    const result = await request<AuthResponse>('/register', {
      name,
      email,
      password,
      targetGoal,
    });
    return result.user;
  },

  async currentUser(): Promise<UserProfile> {
    const result = await request<AuthResponse>('/me');
    return result.user;
  },

  async logout(): Promise<void> {
    await request<{ message: string }>('/logout', {});
  },
};
