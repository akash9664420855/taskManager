import { z } from 'zod';

const passwordRule = z
  .string()
  .min(8, 'At least 8 characters')
  .max(72, 'Too long')
  .regex(/[A-Z]/, 'Must include an uppercase letter')
  .regex(/[a-z]/, 'Must include a lowercase letter')
  .regex(/\d/, 'Must include a digit');

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(60, 'Name is too long'),
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: passwordRule,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
