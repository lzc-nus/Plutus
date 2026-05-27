import { z } from "zod";

export const calendarEventSchema = z.object({
  description: z.string().min(1, "Description is required."),
  category: z.enum(["Income", "Bills", "Subscriptions"]),
  amount: z.number().positive("Amount must be greater than 0."),
  start_date: z.string().min(1, "Start date is required."),
  frequency: z.enum(["MONTHLY", "WEEKLY"]),
  day_of_month: z.number().min(1).max(31).nullable(),
  day_of_week: z.number().min(0).max(6).nullable(),
});