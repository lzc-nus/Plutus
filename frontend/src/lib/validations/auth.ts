import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(50, "Username must be at most 50 characters."),
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password needs one uppercase letter.")
    .regex(/[a-z]/, "Password needs one lowercase letter.")
    .regex(/[0-9]/, "Password needs one number.")
    .regex(/[^A-Za-z0-9]/, "Password needs one special symbol."),
});

export const emailVerificationSchema = z.object({
  email: z.email("Enter the email address used to register."),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the six-digit code from your email."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;
