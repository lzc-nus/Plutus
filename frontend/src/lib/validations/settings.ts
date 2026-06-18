import { z } from "zod";

const passwordStrengthMessage =
  "Use at least 8 characters with uppercase, lowercase, number, and symbol.";

export const settingsFormSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(50, "Username must be at most 50 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  base_currency: z
    .string()
    .trim()
    .length(3, "Use a 3-letter currency code.")
    .regex(/^[A-Za-z]{3}$/, "Use letters only for the currency code."),
  display_name: z
    .string()
    .trim()
    .max(100, "Display name must be at most 100 characters."),
  bio: z
    .string()
    .trim()
    .max(300, "Bio must be at most 300 characters."),
  avatar_url: z
    .string()
    .trim()
    .max(500, "Avatar URL must be at most 500 characters."),
});

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password."),
    new_password: z
      .string()
      .min(8, passwordStrengthMessage)
      .regex(/[A-Z]/, passwordStrengthMessage)
      .regex(/[a-z]/, passwordStrengthMessage)
      .regex(/[0-9]/, passwordStrengthMessage)
      .regex(/[^A-Za-z0-9]/, passwordStrengthMessage),
    confirm_password: z.string().min(1, "Confirm your new password."),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match.",
  });

export type SettingsFormInput = z.input<typeof settingsFormSchema>;
export type PasswordChangeInput = z.input<typeof passwordChangeSchema>;
