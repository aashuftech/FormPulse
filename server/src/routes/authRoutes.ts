import { Router } from 'express';
import { getCurrentUser, login, logout, register } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/logout', logout);
authRoutes.get('/me', authenticate, getCurrentUser);
