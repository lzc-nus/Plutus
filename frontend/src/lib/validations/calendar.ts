import { z } from "zod";

export const recurrenceEndSchema = z.object({
  mode: z.enum(["never", "until", "count"]),
  until: z.string().nullable().optional(),
  count: z.number().nullable().optional(),
});

export const customRecurrenceSchema = z.object({
  interval: z.number().min(1),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  weekdays: z.array(
    z.enum(["MO", "TU", "WE", "TH", "FR", "SA", "SU"])
  ).default([]),
  end: recurrenceEndSchema,
});

export const calendarEventSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  category: z.enum([
    "Income",
    "Bills",
    "Subscriptions",
  ]),
  amount: z.number().positive('Amount must be greater than 0.'),

  start_date: z.string(),

  recurrence_type: z.enum([
    "NONE",
    "WEEKLY_SUNDAY",
    "MONTHLY_LAST_SUNDAY",
    "ANNUALLY",
    "WEEKDAY",
    "CUSTOM",
  ]),

  custom_recurrence: customRecurrenceSchema.nullable(),

  rrule: z.string().nullable(),
});

export type CalendarEventFormValues =
  z.infer<typeof calendarEventSchema>;