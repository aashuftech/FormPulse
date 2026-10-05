import { Router } from 'express';
import { getCurrentUser, login, logout, register } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { loginRateLimit, registerRateLimit } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validateBody.js';
import { loginSchema, registerSchema } from '../validation/authSchemas.js';

export const authRoutes = Router();

authRoutes.post('/register', registerRateLimit, validateBody(registerSchema), register);
authRoutes.post('/login', loginRateLimit, validateBody(loginSchema), login);
authRoutes.post('/logout', logout);
authRoutes.get('/me', authenticate, getCurrentUser);
