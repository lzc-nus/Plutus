import { z } from "zod";

export const transactionFormSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(160, "Description must be at most 160 characters."),
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required.")
    .refine((value) => Number.isFinite(Number(value)), "Amount must be a number.")
    .refine((value) => Number(value) !== 0, "Amount cannot be zero."),
  date: z.string().min(1, "Date is required."),
  time: z.string().min(1, "Time is required."),
  account: z
    .string()
    .trim()
    .min(1, "Account is required.")
    .max(80, "Account must be at most 80 characters."),
  category: z
    .string()
    .trim()
    .min(1, "Category is required.")
    .max(80, "Category must be at most 80 characters."),
  impact: z
    .string()
    .trim()
    .max(160, "Impact must be at most 160 characters.")
    .optional(),
});

export type TransactionFormInput = z.infer<typeof transactionFormSchema>;
