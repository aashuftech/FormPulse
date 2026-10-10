export const APP_CONFIG = {
  name: 'FormPulse',
  tagline: 'AI Fitness Coach & Real-Time Form Tracker',
  version: '1.0.0',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  WORKOUT: '/workout',
  EXERCISES: '/exercises',
  HISTORY: '/history',
  PROGRESS: '/progress',
  CHALLENGES: '/challenges',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

export const THEME_PALETTE = {
  white: '#FFFFFF',
  cyan: '#367D8A',
  teal: '#285F6B',
  dark: '#133336',
  black: '#010001',
} as const;
