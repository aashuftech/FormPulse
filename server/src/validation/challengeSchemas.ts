import { z } from 'zod';

export const createChallengeSchema = z
  .object({
    title: z.string().trim().min(3, 'Challenge name must be at least 3 characters').max(80),
    goal: z.string().trim().min(3, 'Enter a target goal').max(150),
  })
  .strict();

export const updateChallengeSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Challenge name must be at least 3 characters')
      .max(80)
      .optional(),
    goal: z.string().trim().min(3, 'Enter a target goal').max(150).optional(),
  })
  .strict()
  .refine(value => Object.keys(value).length > 0, 'Provide challenge fields to update');

export const challengeParamsSchema = z.object({
  challengeId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid challenge identifier'),
});

export const emptyChallengeQuerySchema = z.object({}).strict();
