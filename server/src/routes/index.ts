import { Router } from 'express';
import { healthRoutes } from './healthRoutes.js';
import { authRoutes } from './authRoutes.js';
import { workoutRoutes } from './workoutRoutes.js';
import { challengeRoutes } from './challengeRoutes.js';

export const apiRoutes = Router();

apiRoutes.use('/health', healthRoutes);
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/workouts', workoutRoutes);
apiRoutes.use('/challenges', challengeRoutes);
