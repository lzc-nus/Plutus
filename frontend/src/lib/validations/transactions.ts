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

export function transactionToFormDefaults(transaction: {
  occurred_at: string;
  description: string;
  category: string;
  account: string;
  amount: string | number;
  impact?: string | null;
}): TransactionFormInput {
  const occurredAt = new Date(transaction.occurred_at);
  return {
    description: transaction.description,
    amount: String(transaction.amount),
    date: occurredAt.toISOString().slice(0, 10),
    time: occurredAt.toTimeString().slice(0, 5),
    account: transaction.account,
    category: transaction.category,
    impact: transaction.impact ?? "",
  };
}

export type TransactionFormInput = z.infer<typeof transactionFormSchema>;
