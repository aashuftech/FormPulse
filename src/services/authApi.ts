import type { UserProfile, UserProfileUpdate, UserSettings } from '@/types';

const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL ?? '');

interface AuthResponse {
  user: UserProfile;
}

interface MessageResponse {
  message: string;
}

interface SettingsResponse {
  settings: UserSettings;
}

let refreshInFlight: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(response => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

const unauthenticatedAuthPaths = new Set([
  '/login',
  '/register',
  '/refresh',
  '/logout',
  '/verify-email',
  '/resend-verification',
  '/forgot-password',
  '/reset-password',
]);

async function requestUrl<T>(url: string, options: RequestInit, skipRefresh = false): Promise<T> {
  let response = await fetch(url, options);
  if (response.status === 401 && !skipRefresh && (await refreshAccessToken())) {
    response = await fetch(url, options);
  }

  const result = (await response.json().catch(() => ({}))) as { message?: string } & T;
  if (!response.ok) {
    throw new Error(result.message ?? 'Authentication request failed');
  }
  return result;
}

export function authenticatedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  return requestUrl(`${API_URL}/api${path}`, { ...options, credentials: 'include' });
}

async function request<T>(path: string, body?: Record<string, string>): Promise<T> {
  return requestUrl(
    `${API_URL}/api/auth${path}`,
    {
      method: body ? 'POST' : 'GET',
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    },
    unauthenticatedAuthPaths.has(path),
  );
}

export const authApi = {
  async login(email: string, password: string): Promise<UserProfile> {
    const result = await request<AuthResponse>('/login', { email, password });
    return result.user;
  },

  async register(name: string, email: string, password: string, targetGoal: string): Promise<void> {
    await request<MessageResponse>('/register', {
      name,
      email,
      password,
      targetGoal,
    });
  },

  async verifyEmail(token: string): Promise<void> {
    await request<MessageResponse>('/verify-email', { token });
  },

  async resendVerification(email: string): Promise<string> {
    const result = await request<MessageResponse>('/resend-verification', { email });
    return result.message;
  },

  async forgotPassword(email: string): Promise<string> {
    const result = await request<MessageResponse>('/forgot-password', { email });
    return result.message;
  },

  async resetPassword(token: string, password: string): Promise<string> {
    const result = await request<MessageResponse>('/reset-password', { token, password });
    return result.message;
  },

  async currentUser(): Promise<UserProfile> {
    const result = await request<AuthResponse>('/me');
    return result.user;
  },

  async updateProfile(updates: UserProfileUpdate): Promise<UserProfile> {
    const result = await authenticatedRequest<AuthResponse>('/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return result.user;
  },

  async getSettings(): Promise<UserSettings> {
    const result = await authenticatedRequest<SettingsResponse>('/auth/settings');
    return result.settings;
  },

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const result = await authenticatedRequest<SettingsResponse>('/auth/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return result.settings;
  },

  async logout(): Promise<void> {
    await request<{ message: string }>('/logout', {});
  },
};
