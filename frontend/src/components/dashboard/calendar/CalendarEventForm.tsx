"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/lib/api/calendar";
import {
  calendarEventColors,
  defaultCalendarEventColor,
  type CalendarEventColor,
} from "@/data/calendarEventColors";
import { getApiErrorMessage } from "@/lib/api/auth";
import type { 
  CalendarEventCreate, 
  CalendarEventRead, 
  CalendarEventUpdate 
} from "@/lib/api/generated";
import { calendarEventFormSchema } from "@/lib/validations/calendar";
import { 
  toLocalOffsetIso, 
  addOneHourToTime 
} from "@/lib/utils/calendarDateUtils";

type FieldErrors = Record<string, string[] | undefined>;

interface CalendarEventFormProps {
  selectedDateKey: string | null;
  selectedTime: string | null;
  selectedEndTime: string | null;
  selectedEvent: CalendarEventRead | null;
  onCancelSelection: () => void;
  onCollapse: () => void;
  onSaved: () => void;
};

const recurrenceOptions = [
  { label: "Does not repeat", value: "NONE" },
  { label: "Every weekday", value: "DAILY_WEEKDAY" },
  { label: "Weekly", value: "WEEKLY_SAME_DAY" },
  { label: "Monthly", value: "MONTHLY_SAME_DAY" },
  { label: "Last Sunday monthly", value: "MONTHLY_LAST_SUNDAY" },
  { label: "Annually", value: "ANNUALLY_SAME_DAY" },
] as const;

const labelClassName = "grid min-w-0 gap-1.5";
const labelTextClassName = "text-sm font-semibold text-[#353026]";
const fieldClassName =
  "h-11 w-full min-w-0 rounded-md border border-[#d0c5b3] bg-[#fffaf2] px-3 text-sm text-[#1d211c] outline-none transition placeholder:text-[#8b8274] focus:border-[#8f6f2d] focus:ring-2 focus:ring-[#8f6f2d]/20 disabled:cursor-not-allowed disabled:opacity-50";
const errorTextClassName = "text-sm font-semibold text-[#8f3f32]";

type RecurrenceOptionValue = (typeof recurrenceOptions)[number]["value"];

type CalendarEventFormState = {
  title: string;
  description: string;
  color: CalendarEventColor;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isAllDay: boolean;
  recurrenceOption: RecurrenceOptionValue;
  scope: "THIS_INSTANCE" | "ALL_SESSIONS";
};

export function CalendarEventForm({
  selectedDateKey,
  selectedTime,
  selectedEndTime,
  selectedEvent,
  onCancelSelection,
  onCollapse,
  onSaved,
}: CalendarEventFormProps) {
  const initialValues = getInitialFormValues(
    selectedEvent, 
    selectedDateKey, 
    selectedTime, 
    selectedEndTime
  );

  const isRecurringInstance = Boolean(selectedEvent?.is_recurring_instance);

  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [color, setColor] = useState<CalendarEventColor>(initialValues.color);
  const [startDate, setStartDate] = useState(initialValues.startDate);
  const [startTime, setStartTime] = useState(initialValues.startTime);
  const [endDate, setEndDate] = useState(initialValues.endDate);
  const [endTime, setEndTime] = useState(initialValues.endTime);
  const [isAllDay, setIsAllDay] = useState(initialValues.isAllDay);
  const [recurrenceOption, setRecurrenceOption] = useState<RecurrenceOptionValue>(
    initialValues.recurrenceOption
  );
  const [scope, setScope] = useState<"THIS_INSTANCE" | "ALL_SESSIONS">(initialValues.scope);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const panelTitle = useMemo(() => {
    if (selectedEvent) {
      return "Edit schedule";
    }

    if (selectedDateKey) {
      return "Schedule selected date";
    }

    return "New schedule";
  }, [selectedDateKey, selectedEvent]);

  const locksEndDateToStartDate = 
    !selectedEvent && recurrenceOption !== "NONE";

  function handleStartDateChange(value: string) {
    setStartDate(value);

    if (locksEndDateToStartDate) {
      setEndDate(value);
    }
  }

  function handleRecurrenceOptionChange(value: RecurrenceOptionValue) {
    setRecurrenceOption(value);

    if (value !== "NONE") {
      setEndDate(startDate);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const parsed = calendarEventFormSchema.safeParse({
      title,
      description,
      color,
      startDate,
      startTime,
      endDate,
      endTime,
      isAllDay,
      recurrenceOption,
      scope,
    });

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const { startAt, endAt } = buildApiInterval(parsed.data);

      if (selectedEvent) {
        const updateScope = isRecurringInstance 
          ? parsed.data.scope 
          : "ALL_SESSIONS";

        const body = {
          title: parsed.data.title,
          description: parsed.data.description || null,
          color: parsed.data.color,
          start_at: startAt,
          end_at: endAt,
          is_all_day: parsed.data.isAllDay,
          update_scope: updateScope,
          instance_original_date:
            updateScope === "THIS_INSTANCE"
              ? selectedDateKey ?? toDateInputValue(new Date(selectedEvent.start_at))
              : null,
        } satisfies CalendarEventUpdate;

        const { error, response } = await updateCalendarEvent(
          selectedEvent.id, 
          body
        );

        if (error || !response?.ok) {
          throw new Error(
            getApiErrorMessage(error, "Unable to update calendar event.")
          );
        }
      } else {
        const body = {
          title: parsed.data.title,
          description: parsed.data.description || null,
          color: parsed.data.color,
          start_at: startAt,
          end_at: endAt,
          is_all_day: parsed.data.isAllDay,
          recurrence_option: parsed.data.recurrenceOption,
        } satisfies CalendarEventCreate;

        const { error, response } = await createCalendarEvent(body);

        if (error || !response?.ok) {
          throw new Error(
            getApiErrorMessage(error, "Unable to create calendar event.")
          );
        }
      }

      onSaved();
    } catch (error) {
      setFormError(
        error instanceof Error 
          ? error.message 
          : "Unable to save calendar event."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedEvent) {
      return;
    }

    setFormError("");
    setIsDeleting(true);

    try {
      const deleteScope = isRecurringInstance ? scope : "ALL_SESSIONS";

      const instanceDate =
        deleteScope === "THIS_INSTANCE"
          ? selectedDateKey ?? toDateInputValue(new Date(selectedEvent.start_at))
          : null;

      const { error, response } = await deleteCalendarEvent(
        selectedEvent.id, 
        deleteScope, 
        instanceDate
      );

      if (error || !response?.ok) {
        throw new Error(
          getApiErrorMessage(error, "Unable to delete calendar event.")
        );
      }

      onSaved();
    } catch (error) {
      setFormError(
        error instanceof Error 
          ? error.message 
          : "Unable to delete calendar event."
        );
    } finally {
      setIsDeleting(false);
    }
  }

  const isBusy = isSubmitting || isDeleting;

  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-5 shadow-[0_18px_70px_rgba(43,34,24,0.06)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8f6f2d]">
            Calendar
          </p>

          <h3 className="font-display mt-1 text-2xl font-semibold leading-tight text-[#1d211c] sm:text-[1.7rem]">
            {panelTitle}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {selectedEvent ? (
            <button
              className="rounded-md border border-[#d0c5b3] px-3 py-1.5 text-xs font-bold text-[#696154] transition hover:border-[#1d211c] hover:text-[#1d211c]"
              onClick={onCancelSelection}
              type="button"
            >
              Clear
            </button>
          ) : null}
          
          <button
            aria-label="Collapse schedule form"
            className="rounded-md border border-[#d0c5b3] px-3 py-1.5 text-xs font-bold text-[#696154] transition hover:border-[#1d211c] hover:text-[#1d211c]"
            onClick={onCollapse}
            type="button"
          >
            Hide
          </button>
        </div>
      </div>

      {formError ? (
        <p className="mb-4 rounded-md border border-[#d5a58b] bg-[#f2e0d8] px-3 py-2 text-sm font-semibold text-[#8f3f32]">
          {formError}
        </p>
      ) : null}

      <form className="grid min-w-0 gap-4" onSubmit={handleSubmit}>
        <label className={labelClassName}>
          <span className={labelTextClassName}>
            Title
          </span>
          
          <input
            className={fieldClassName}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Tax review"
            type="text"
            value={title}
          />

          {fieldErrors.title 
            ? <span className={errorTextClassName}>
                {fieldErrors.title[0]}
              </span>
            : null}
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>
            Description
          </span>

          <textarea
            className="min-h-24 w-full min-w-0 resize-none rounded-md border border-[#d0c5b3] bg-[#fffaf2] px-3 py-2 text-sm text-[#1d211c] outline-none transition placeholder:text-[#8b8274] focus:border-[#8f6f2d] focus:ring-2 focus:ring-[#8f6f2d]/20"
            onChange={event => setDescription(event.target.value)}
            placeholder="Expected cash requirement and supporting documents"
            value={description}
          />
          {fieldErrors.description 
            ? <span className={errorTextClassName}>
                {fieldErrors.description[0]}
              </span> 
            : null}
        </label>

        <fieldset className="grid min-w-0 gap-2">
          <legend className={labelTextClassName}>
            Color
          </legend>

          <div className="grid grid-cols-3 gap-2 min-[460px]:grid-cols-6">
            {calendarEventColors.map(option => {
              const isSelected = color === option.value;

              return (
                <button
                  aria-label={option.label}
                  aria-pressed={isSelected}
                  className={`flex h-11 items-center justify-center rounded-md border text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#8f6f2d]/25 ${
                    isSelected ? "border-[#1d211c] bg-[#fffaf2] shadow-[0_0_0_2px_rgba(29,33,28,0.12)]" : "border-[#d0c5b3] bg-[#fffaf2] hover:border-[#8f6f2d]"
                  }`}
                  key={option.value}
                  onClick={() => setColor(option.value)}
                  title={option.label}
                  type="button"
                >
                  <span
                    className="size-5 rounded-full border"
                    style={{ 
                      backgroundColor: option.swatch, 
                      borderColor: option.border 
                    }}
                  />
                </button>
              );
            })}
          </div>

          {fieldErrors.color 
            ? <span className={errorTextClassName}>
                {fieldErrors.color[0]}
              </span> 
            : null}
        </fieldset>

        <label className="flex items-center gap-2 text-sm font-semibold text-[#353026]">
          <input
            checked={isAllDay}
            className="size-4 accent-[#1d211c]"
            onChange={event => setIsAllDay(event.target.checked)}
            type="checkbox"
          />
          All day
        </label>

        <div className="grid min-w-0 gap-3 min-[460px]:grid-cols-2">
          <label className={labelClassName}>
            <span className={labelTextClassName}>
              Start date
            </span>

            <input
              className={fieldClassName}
              onChange={event => handleStartDateChange(event.target.value)}
              type="date"
              value={startDate}
            />

            {fieldErrors.startDate 
              ? <span className={errorTextClassName}>
                  {fieldErrors.startDate[0]}
                </span> 
              : null}
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>
              Start time
            </span>

            <input
              className={fieldClassName}
              disabled={isAllDay}
              onChange={event => setStartTime(event.target.value)}
              type="time"
              value={startTime}
            />

            {fieldErrors.startTime 
              ? <span className={errorTextClassName}>
                  {fieldErrors.startTime[0]}
                </span> 
              : null}
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>
              End date
            </span>

            <input
              className={fieldClassName}
              disabled={locksEndDateToStartDate}
              onChange={event => setEndDate(event.target.value)}
              type="date"
              value={endDate}
            />

            {fieldErrors.endDate 
              ? <span className={errorTextClassName}>
                  {fieldErrors.endDate[0]}
                </span> 
              : null}
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>
              End time
            </span>

            <input
              className={fieldClassName}
              disabled={isAllDay}
              onChange={event => setEndTime(event.target.value)}
              type="time"
              value={endTime}
            />

            {fieldErrors.endTime 
              ? <span className={errorTextClassName}>
                  {fieldErrors.endTime[0]}
                </span> 
              : null}
          </label>
        </div>

        {!selectedEvent ? (
          <label className={labelClassName}>
            <span className={labelTextClassName}>
              Repeat
            </span>

            <select
              className={fieldClassName}
              onChange={event => 
                handleRecurrenceOptionChange(
                  event.target.value as RecurrenceOptionValue
                )
              }
              value={recurrenceOption}
            >
              {recurrenceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {isRecurringInstance ? (
          <label className={labelClassName}>
            <span className={labelTextClassName}>
              Apply changes to
            </span>

            <select
              className={fieldClassName}
              onChange={event => setScope(event.target.value as typeof scope)}
              value={scope}
            >
              <option value="THIS_INSTANCE">This occurrence</option>
              <option value="ALL_SESSIONS">Entire series</option>
            </select>
          </label>
        ) : null}

        <div className="grid min-w-0 gap-3 min-[460px]:grid-cols-2">
          <button
            className="h-11 rounded-md bg-[#1d211c] px-4 text-sm font-bold text-[#fbf7ef] transition hover:bg-[#343b32] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || isDeleting}
            type="submit"
          >
            {isSubmitting 
              ? "Saving..." 
              : selectedEvent 
              ? "Save schedule" 
              : "Create schedule"}
          </button>

          {selectedEvent ? (
            <button
              className="h-11 rounded-md border border-[#d5a58b] bg-[#fffaf2] px-4 text-sm font-bold text-[#8f3f32] transition hover:bg-[#f2e0d8] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || isDeleting}
              onClick={handleDelete}
              type="button"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function buildApiInterval(value: {
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  isAllDay: boolean;
}) {
  if (value.isAllDay) {
    const exclusiveEndDate = toDateInputValue(
      addDays(new Date(`${value.endDate}T00:00:00`), 1)
    );

    return {
      startAt: toLocalOffsetIso(value.startDate, "00:00"),
      endAt: toLocalOffsetIso(exclusiveEndDate, "00:00"),
    };
  }

  return {
    startAt: toLocalOffsetIso(
      value.startDate, 
      value.startTime ?? "00:00"
    ),
    endAt: toLocalOffsetIso(
      value.endDate, 
      value.endTime ?? "00:00"
    ),
  };
}

function getInitialFormValues(
  selectedEvent: CalendarEventRead | null,
  selectedDateKey: string | null,
  selectedTime: string | null,
  selectedEndTime: string | null,
): CalendarEventFormState {
  if (selectedEvent) {
    const start = new Date(selectedEvent.start_at);
    const end = new Date(selectedEvent.end_at);

    // allday events use an exclusive end date
    const displayEnd = selectedEvent.is_all_day 
      ? addDays(end, -1) 
      : end;

    return {
      title: selectedEvent.title,
      description: selectedEvent.description ?? "",
      color: selectedEvent.color ?? defaultCalendarEventColor,
      startDate: toDateInputValue(start),
      startTime: toTimeInputValue(start),
      endDate: toDateInputValue(displayEnd),
      endTime: toTimeInputValue(end),
      isAllDay: selectedEvent.is_all_day,
      recurrenceOption: "NONE",
      scope: selectedEvent.is_recurring_instance 
        ? "THIS_INSTANCE" 
        : "ALL_SESSIONS",
    };
  }

  const date = selectedDateKey ?? toDateInputValue(new Date());
  const startTime = selectedTime ?? "09:00";
  const endTime = 
    selectedEndTime ?? 
    (selectedTime ? addOneHourToTime(selectedTime) : "10:00");

  return {
    title: "",
    description: "",
    color: defaultCalendarEventColor,
    startDate: date,
    startTime,
    endDate: date,
    endTime,
    isAllDay: false,
    recurrenceOption: "NONE",
    scope: "ALL_SESSIONS",
  };
}

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toTimeInputValue(value: Date) {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  
  return next;
}