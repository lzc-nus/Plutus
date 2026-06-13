import { z } from "zod";
import { calendarEventColorValues } from "@/data/calendarEventColors";

export const calendarEventFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required.")
      .max(160, "Title must be at most 160 characters."),
    description: z
      .string()
      .trim()
      .max(500, "Description must be at most 500 characters.")
      .optional(),
    color: z.enum(calendarEventColorValues),
    startDate: z.string().min(1, "Start date is required."),
    startTime: z.string().optional(),
    endDate: z.string().min(1, "End date is required."),
    endTime: z.string().optional(),
    isAllDay: z.boolean(),
    recurrenceOption: z.enum([
      "NONE",
      "DAILY_WEEKDAY",
      "WEEKLY_SAME_DAY",
      "MONTHLY_SAME_DAY",
      "MONTHLY_LAST_SUNDAY",
      "ANNUALLY_SAME_DAY",
    ]),
    scope: z.enum(["THIS_INSTANCE", "ALL_SESSIONS"]),
  })
  .superRefine((value, context) => {
    if (!value.isAllDay && !value.startTime) {
      context.addIssue({
        code: "custom",
        message: "Start time is required.",
        path: ["startTime"],
      });
    }

    if (!value.isAllDay && !value.endTime) {
      context.addIssue({
        code: "custom",
        message: "End time is required.",
        path: ["endTime"],
      });
    }

    if (value.recurrenceOption !== "NONE" && value.startDate !== value.endDate) {
      context.addIssue({
        code: "custom",
        message: "Repeating schedules must stay on one calendar date.",
        path: ["endDate"],
      });
    }

    const start = value.isAllDay
      ? new Date(`${value.startDate}T00:00:00`)
      : new Date(`${value.startDate}T${value.startTime}:00`);
    const end = value.isAllDay
      ? addDays(new Date(`${value.endDate}T00:00:00`), 1)
      : new Date(`${value.endDate}T${value.endTime}:00`);

    if (Number.isNaN(start.getTime())) {
      context.addIssue({
        code: "custom",
        message: "Start date is invalid.",
        path: ["startDate"],
      });
    }

    if (Number.isNaN(end.getTime())) {
      context.addIssue({
        code: "custom",
        message: "End date is invalid.",
        path: ["endDate"],
      });
    }

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
      context.addIssue({
        code: "custom",
        message: "End must be after start.",
        path: ["endDate"],
      });
    }
  });

export type CalendarEventFormInput = z.infer<typeof calendarEventFormSchema>;

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}
