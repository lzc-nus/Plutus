import {
  calendarEventsCreate,
  calendarEventsDelete,
  calendarEventsList,
  calendarEventsUpdate,
} from "@/lib/api/generated";
import type {
  CalendarEventCreate,
  CalendarEventUpdate,
} from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";

/**
 * Fetches all expanded calendar occurrences within a specific ISO window range.
 */
export async function listCalendarEvents(startWindow: string, endWindow: string) {
  configureApiClient();
  return calendarEventsList({
    query: {
      start_window: startWindow,
      end_window: endWindow,
    },
  });
}

/**
 * Commits a new calendar event (or recurring series) to the ledger.
 */
export async function createCalendarEvent(payload: CalendarEventCreate) {
  configureApiClient();
  return calendarEventsCreate({ body: payload });
}

/**
 * Updates a parent event template or detaches a single recurring item instance.
 */
export async function updateCalendarEvent(eventId: string, payload: CalendarEventUpdate) {
  configureApiClient();
  return calendarEventsUpdate({
    path: { event_id: eventId },
    body: payload,
  });
}

/**
 * Removes an entire event block or flags a single date exclusion on the server.
 */
export async function deleteCalendarEvent(
    eventId: string,
    scope: "THIS_INSTANCE" | "ALL_SESSIONS" = "ALL_SESSIONS",
    instanceDate?: string | null
) {
  configureApiClient();
  return calendarEventsDelete({
    path: { event_id: eventId },
    query: {
      scope,
      instance_date: instanceDate,
    },
  });
}
