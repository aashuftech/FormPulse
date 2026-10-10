import { Router } from 'express';
import {
  deleteSession,
  getCurrentUser,
  getCurrentUserSettings,
  updateCurrentUser,
  updateCurrentUserSettings,
  getSessions,
  login,
  logout,
  logoutAll,
  forgotPassword,
  resendVerification,
  refresh,
  register,
  resetPassword,
  verifyEmail,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import {
  forgotPasswordRateLimit,
  loginRateLimit,
  registerRateLimit,
  resendVerificationRateLimit,
  resetPasswordRateLimit,
  verifyEmailRateLimit,
} from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validateBody.js';
import { validateSessionParams } from '../middleware/validateSessionParams.js';
import {
  forgotPasswordSchema,
  loginSchema,
  profileUpdateSchema,
  settingsUpdateSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validation/authSchemas.js';

export const authRoutes = Router();

authRoutes.post('/register', registerRateLimit, validateBody(registerSchema), register);
authRoutes.post('/login', loginRateLimit, validateBody(loginSchema), login);
authRoutes.post(
  '/verify-email',
  verifyEmailRateLimit,
  validateBody(verifyEmailSchema),
  verifyEmail,
);
authRoutes.post(
  '/resend-verification',
  resendVerificationRateLimit,
  validateBody(resendVerificationSchema),
  resendVerification,
);
authRoutes.post(
  '/forgot-password',
  forgotPasswordRateLimit,
  validateBody(forgotPasswordSchema),
  forgotPassword,
);
authRoutes.post(
  '/reset-password',
  resetPasswordRateLimit,
  validateBody(resetPasswordSchema),
  resetPassword,
);
authRoutes.post('/refresh', refresh);
authRoutes.post('/logout', logout);
authRoutes.post('/logout-all', authenticate, logoutAll);
authRoutes.get('/sessions', authenticate, getSessions);
authRoutes.delete('/sessions/:sessionId', authenticate, validateSessionParams, deleteSession);
authRoutes.get('/me', authenticate, getCurrentUser);
authRoutes.patch('/me', authenticate, validateBody(profileUpdateSchema), updateCurrentUser);
authRoutes.get('/settings', authenticate, getCurrentUserSettings);
authRoutes.patch(
  '/settings',
  authenticate,
  validateBody(settingsUpdateSchema),
  updateCurrentUserSettings,
);
