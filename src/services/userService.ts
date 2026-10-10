import type { UserProfile, UserProfileUpdate, UserSettings } from '@/types';
import { authApi } from './authApi';

export const userService = {
  async getProfile(): Promise<UserProfile> {
    return authApi.currentUser();
  },

  async updateProfile(updates: UserProfileUpdate): Promise<UserProfile> {
    return authApi.updateProfile(updates);
  },

  async getSettings(): Promise<UserSettings> {
    return authApi.getSettings();
  },

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    return authApi.updateSettings(updates);
  },
};
