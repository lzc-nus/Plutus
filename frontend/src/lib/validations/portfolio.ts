import { z } from "zod";

// ── Assets ────────────────────────────────────────────────────────────────────

export const assetFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be at most 200 characters."),

  category: z.enum([
    "stocks",
    "bonds",
    "real_estate",
    "cash",
    "crypto",
    "commodities",
    "private_equity",
    "other",
  ]),

  custom_category: z
    .string()
    .trim()
    .max(100, "Custom category must be at most 100 characters.")
    .nullable()
    .optional(),

  value: z
    .number("Value is required.")
    .positive("Value must be greater than 0."),

  cost_basis: z
    .number("Enter a valid amount.")
    .nonnegative("Cost basis cannot be negative.")
    .nullable()
    .optional(),

  liquidity: z.enum(["high", "medium", "low"]).default("medium"),

  risk: z.enum(["low", "moderate", "high", "very_high"]).default("moderate"),

  notes: z
    .string()
    .trim()
    .max(500, "Notes must be at most 500 characters.")
    .nullable()
    .optional(),

  acquired_at: z
    .string()
    .nullable()
    .optional(),
}).superRefine((data, ctx) => {
  if (data.category !== "other" && data.custom_category) {
    ctx.addIssue({
      code: "custom",
      message: "Custom category is only allowed when category is 'Other'.",
      path: ["custom_category"],
    });
  }
});

export type AssetFormInput = z.infer<typeof assetFormSchema>;

// ── Liabilities ───────────────────────────────────────────────────────────────

export const liabilityFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be at most 200 characters."),

  category: z.enum([
    "mortgage",
    "auto_loan",
    "student_loan",
    "credit_card",
    "personal_loan",
    "tax_payable",
    "other",
  ]),

  balance: z
    .number("Balance is required.")
    .positive("Balance must be greater than 0."),

  original_amount: z
    .number("Enter a valid amount.")
    .nonnegative("Original amount cannot be negative.")
    .nullable()
    .optional(),

  interest_rate: z
    .number("Enter a valid rate.")
    .nonnegative("Interest rate cannot be negative.")
    .max(100, "Interest rate cannot exceed 100%.")
    .nullable()
    .optional(),

  monthly_payment: z
    .number("Enter a valid amount.")
    .nonnegative("Monthly payment cannot be negative.")
    .nullable()
    .optional(),

  maturity_date: z
    .string()
    .nullable()
    .optional(),

  notes: z
    .string()
    .trim()
    .max(500, "Notes must be at most 500 characters.")
    .nullable()
    .optional(),
});

export type LiabilityFormInput = z.infer<typeof liabilityFormSchema>;