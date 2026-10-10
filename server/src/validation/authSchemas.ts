import { z } from 'zod';
import { FORM_STRICTNESS, TARGET_GOALS, UNIT_SYSTEMS } from '../models/User.js';

const emailSchema = z.string().trim().toLowerCase().max(254).email('Enter a valid email address');
const loginPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine(password => Buffer.byteLength(password, 'utf8') <= 72, {
    message: 'Password must be at most 72 bytes',
  });

const newPasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .refine(password => Buffer.byteLength(password, 'utf8') <= 72, {
    message: 'Password must be at most 72 bytes',
  })
  .refine(password => /[a-z]/.test(password), 'Password must include a lowercase letter')
  .refine(password => /[A-Z]/.test(password), 'Password must include an uppercase letter')
  .refine(password => /\d/.test(password), 'Password must include a number')
  .refine(password => /[^A-Za-z0-9]/.test(password), 'Password must include a symbol');

const tokenSchema = z
  .string()
  .min(40)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/, 'Invalid token');
const emailOnlySchema = z.object({ email: emailSchema }).strict();

export const verifyEmailSchema = z.object({ token: tokenSchema }).strict();
export const resendVerificationSchema = emailOnlySchema;
export const forgotPasswordSchema = emailOnlySchema;
export const resetPasswordSchema = z
  .object({ token: tokenSchema, password: newPasswordSchema })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: loginPasswordSchema,
  })
  .strict();

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    email: emailSchema,
    password: newPasswordSchema,
    targetGoal: z.enum(TARGET_GOALS).default('Build Muscle'),
  })
  .strict();

export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
    targetGoal: z.enum(TARGET_GOALS).optional(),
    weightKg: z.number().finite().min(0).max(2000).optional(),
    heightCm: z.number().finite().min(0).max(300).optional(),
  })
  .strict()
  .refine(value => Object.keys(value).length > 0, 'Provide at least one profile field to update');

export const settingsUpdateSchema = z
  .object({
    voiceGuidance: z.boolean().optional(),
    vibrationAlerts: z.boolean().optional(),
    formStrictness: z.enum(FORM_STRICTNESS).optional(),
    unitSystem: z.enum(UNIT_SYSTEMS).optional(),
    emailNotifications: z.boolean().optional(),
    theme: z.literal('dark').optional(),
  })
  .strict()
  .refine(value => Object.keys(value).length > 0, 'Provide at least one setting to update');
