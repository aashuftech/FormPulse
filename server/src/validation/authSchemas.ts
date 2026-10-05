import { z } from 'zod';
import { TARGET_GOALS } from '../models/User.js';

const emailSchema = z.string().trim().toLowerCase().max(254).email('Enter a valid email address');
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine(password => Buffer.byteLength(password, 'utf8') <= 72, {
    message: 'Password must be at most 72 bytes',
  });

export const loginSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: emailSchema,
    password: passwordSchema,
    targetGoal: z.enum(TARGET_GOALS).default('Build Muscle'),
  })
  .strict();
