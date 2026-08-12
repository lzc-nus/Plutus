import type { CalendarEventRead } from "@/lib/api/generated";

/** Formats a Date as a local YYYY-MM-DD key (no timezone shifting). */
export function toDateKey(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/** Zeroes out the time portion of a Date, keeping it in local time. */
export function startOfDay(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

/** Returns a new Date offset by the given number of days (local time). */
export function addDays(value: Date, days: number): Date {
    const next = new Date(value);
    next.setDate(next.getDate() + days);
    return next;
}

/** Returns a new Date offset by the given number of months (local time). */
export function addMonths(value: Date, months: number): Date {
    return new Date(value.getFullYear(), value.getMonth() + months, value.getDate());
}

/** Returns a new Date offset by the given number of years (local time). */
export function addYears(value: Date, years: number): Date {
    return new Date(value.getFullYear() + years, value.getMonth(), value.getDate());
}

/** Sunday-anchored start of the week containing the given date. */
export function startOfWeek(value: Date): Date {
    const start = startOfDay(value);
    start.setDate(start.getDate() - start.getDay());
    return start;
}

/** Saturday-anchored end of the week containing the given date. */
export function endOfWeek(value: Date): Date {
    return addDays(startOfWeek(value), 6);
}

export function startOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), 1);
}

export function endOfMonth(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth() + 1, 0);
}

export function startOfYear(value: Date): Date {
    return new Date(value.getFullYear(), 0, 1);
}

export function endOfYear(value: Date): Date {
    return new Date(value.getFullYear(), 11, 31);
}

/**
 * Expand an event into the list of local date keys it touches.
 */
export function getDateKeysForEvent(event: CalendarEventRead): string[] {
    const start = startOfDay(new Date(event.start_at));
    const end = startOfDay(new Date(event.end_at));
    const visibleEnd = event.is_all_day ? addDays(end, -1) : end;
    const keys: string[] = [];

    for (let cursor = start; cursor <= visibleEnd; cursor = addDays(cursor, 1)) {
        keys.push(toDateKey(cursor));
    }

    return keys.length > 0 ? keys : [toDateKey(start)];
}

/**
 * Group events by every local date key they touch (for multi-day spans).
 * Daily buckets are sorted first by allday, then by start time.
 */
export function groupEventsByDateKey(events: CalendarEventRead[]): Record<string, CalendarEventRead[]> {
    const map: Record<string, CalendarEventRead[]> = {};

    events.forEach(event => {
        getDateKeysForEvent(event).forEach(dateKey => {
            if (!map[dateKey]) {
                map[dateKey] = [];
            }

            map[dateKey].push(event);
        });
    });

    Object.values(map).forEach(dayEvents => {
        dayEvents.sort((a, b) => {
            if (a.is_all_day !== b.is_all_day) {
                return a.is_all_day ? -1 : 1;
            }

            return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
        });
    });

    return map;
}

export function minutesSinceMidnight(value: Date): number {
    return value.getHours() * 60 + value.getMinutes();
}

/** Format a minutes-since-midnight value as HH:MM for time inputs. */
export function minutesToTimeInputValue(totalMinutes: number): string {
    const clamped = Math.max(0, Math.min(24 * 60, totalMinutes));
    const hours = String(Math.floor(clamped / 60)).padStart(2, "0");
    const minutes = String(clamped % 60).padStart(2, "0");
    return `${hours}:${minutes}`;
}

/** Snap a minutes-since-midnight value to the nearest step (default 15). */
export function snapMinutes(totalMinutes: number, step = 15): number {
    return Math.round(totalMinutes / step) * step;
}

/** Add one hour to HH:MM, clamped to 23:59. */
export function addOneHourToTime(time: string): string {
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = Math.min(23 * 60 + 59, hours * 60 + minutes + 60);
    return minutesToTimeInputValue(totalMinutes);
}

/** Build a string (eg "2026-07-03T14:00:00+08:00"). */
export function toLocalOffsetIso(dateKey: string, time: string): string {
    const localDateTime = new Date(`${dateKey}T${time}:00`);
    const offsetMinutes = -localDateTime.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const absoluteOffset = Math.abs(offsetMinutes);
    const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
    const offsetRemainderMinutes = String(absoluteOffset % 60).padStart(2, "0");

    return `${dateKey}T${time}:00${sign}${offsetHours}:${offsetRemainderMinutes}`;
}