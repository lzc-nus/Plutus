import {
calendarEventsCreate, calendarEventsDelete, calendarEventsList, calendarEventsUpdate
} from "./generated/sdk.gen";
import type {
    CalendarEventCreate,
    CalendarEventUpdate,
    CalendarEventRead,
} from "./generated/types.gen";

/**
 * Fetches all expanded calendar occurrences within a specific ISO window range.
 */
export async function listCalendarEvents(startWindow: string, endWindow: string) {
    try {
        const response = await calendarEventsList({
            query: {
                start_window: startWindow,
                end_window: endWindow,
            },
        });
        return {
            data: response.data ?? [],
            error: null,
            response: { ok: true },
        };
    } catch (error) {
        return {
            data: [],
            error: error || "Failed to fetch calendar data",
            response: { ok: false },
        };
    }
}

/**
 * Commits a new calendar event (or recurring series) to the ledger.
 */
export async function createCalendarEvent(payload: CalendarEventCreate) {
    try {
        const response = await calendarEventsCreate({
            body: payload,
        });
        return {
            data: response.data,
            error: null,
            response: { ok: true },
        };
    } catch (error) {
        return {
            data: null,
            error: error || "Failed to create calendar event",
            response: { ok: false },
        };
    }
}

/**
 * Updates a parent event template or detaches a single recurring item instance.
 */
export async function updateCalendarEvent(eventId: string, payload: CalendarEventUpdate) {
    try {
        const response = await calendarEventsUpdate({
            path: { event_id: eventId },
            body: payload,
        });
        return {
            data: response.data,
            error: null,
            response: { ok: true },
        };
    } catch (error) {
        return {
            data: null,
            error: error || "Failed to update calendar event",
            response: { ok: false },
        };
    }
}

/**
 * Removes an entire event block or flags a single date exclusion on the server.
 */
export async function deleteCalendarEvent(
    eventId: string,
    scope: "THIS_INSTANCE" | "ALL_SESSIONS" = "ALL_SESSIONS",
    instanceDate?: string | null
) {
    try {
        await calendarEventsDelete({
            path: { event_id: eventId },
            query: {
                scope,
                instance_date: instanceDate,
            },
        });
        return {
            error: null,
            response: { ok: true },
        };
    } catch (error) {
        return {
            error: error || "Failed to delete calendar event",
            response: { ok: false },
        };
    }
}