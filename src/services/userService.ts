import type { UserProfile, UserSettings } from '@/types';
import { MOCK_USER, MOCK_SETTINGS } from './mockData';

export const userService = {
  async getProfile(): Promise<UserProfile> {
    return Promise.resolve({ ...MOCK_USER });
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    Object.assign(MOCK_USER, updates);
    return Promise.resolve({ ...MOCK_USER });
  },

  async getSettings(): Promise<UserSettings> {
    return Promise.resolve({ ...MOCK_SETTINGS });
  },

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    Object.assign(MOCK_SETTINGS, updates);
    return Promise.resolve({ ...MOCK_SETTINGS });
  },
};
