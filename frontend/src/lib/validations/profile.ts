import { z } from "zod";

export const profileFormSchema = z.object({
  display_name: z
    .string()
    .trim()
    .max(100, "Display name must be at most 100 characters.")
    .optional(),
  bio: z
    .string()
    .trim()
    .max(300, "Bio must be at most 300 characters.")
    .optional(),
  avatar_url: z
    .string()
    .trim()
    .max(500, "Avatar URL must be at most 500 characters.")
    .optional(),
});

export type ProfileFormInput = z.infer<typeof profileFormSchema>;