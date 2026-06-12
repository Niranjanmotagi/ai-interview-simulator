import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[a-zA-Z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(128),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    token: z.string().min(32).max(128),
    password: passwordSchema,
  })
  .strict();
