"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "@/components/WealthComponents";
import { MiniAgendaList } from "@/components/dashboard/calendar/CalendarAgendaList";
import { CalendarEventForm } from "@/components/dashboard/calendar/CalendarEventForm";
import { CalendarGrid } from "@/components/dashboard/calendar/CalendarGrid";
import { CalendarTimeGrid } from "@/components/dashboard/calendar/CalendarTimeGrid";
import { CalendarYearGrid } from "@/components/dashboard/calendar/CalendarYearGrid";
import { CalendarViewSwitcher, type CalendarViewMode } from "@/components/dashboard/calendar/CalendarViewSwitcher";
import { getApiErrorMessage } from "@/lib/api/auth";
import { listCalendarEvents } from "@/lib/api/calendar";
import type { CalendarEventRead } from "@/lib/api/generated";
import {
    addDays,
    addMonths,
    addOneHourToTime,
    addYears,
    endOfWeek,
    startOfDay,
    startOfMonth,
    startOfWeek,
    startOfYear,
    toDateKey,
} from "@/lib/utils/calendarDateUtils";

export default function CalendarPage() {
    const [view, setView] = useState<CalendarViewMode>("month");
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [events, setEvents] = useState<CalendarEventRead[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEventRead | null>(null);
    const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [isFormCollapsed, setIsFormCollapsed] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const { startWindow, endWindow } = useMemo(() => {
        if (view === "day") {
            const start = addDays(startOfDay(currentDate), -1);
            const end = addDays(startOfDay(currentDate), 2);
            return { startWindow: start.toISOString(), endWindow: end.toISOString() };
        }

        if (view === "week") {
            const start = addDays(startOfWeek(currentDate), -1);
            const end = addDays(endOfWeek(currentDate), 2);
            return { startWindow: start.toISOString(), endWindow: end.toISOString() };
        }

        if (view === "year") {
            const start = addDays(startOfYear(currentDate), -1);
            const end = addDays(startOfYear(addYears(currentDate, 1)), 1);
            return { startWindow: start.toISOString(), endWindow: end.toISOString() };
        }

        // month
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const start = new Date(year, month - 1, 1).toISOString();
        const end = new Date(year, month + 2, 0).toISOString();
        return { startWindow: start, endWindow: end };
    }, [currentDate, view]);

    useEffect(() => {
        let ignore = false;

        async function loadEvents() {
            setIsLoading(true);
            setErrorMessage("");

            const { data, error, response } = await listCalendarEvents(startWindow, endWindow);

            if (ignore) {
                return;
            }

            if (error || !response?.ok) {
                setEvents([]);
                setErrorMessage(getApiErrorMessage(error, "Unable to retrieve calendar window records. Please try again."));
                setIsLoading(false);
                setHasLoadedOnce(true);
                return;
            }

            setEvents(data ?? []);
            setIsLoading(false);
            setHasLoadedOnce(true);
        }

        void loadEvents();

        return () => {
            ignore = true;
        };
    }, [startWindow, endWindow, reloadKey]);

    const handleSelectEvent = (event: CalendarEventRead, activeDateStr: string) => {
        setSelectedEvent(event);
        setSelectedDateKey(activeDateStr);
        setSelectedTime(null);
        setSelectedEndTime(null);
        setIsFormCollapsed(false);
    };

    const handleSelectDate = (dateKey: string) => {
        setSelectedEvent(null);
        setSelectedDateKey(dateKey);
        setSelectedTime(null);
        setSelectedEndTime(null);
        setIsFormCollapsed(false);
    };

    const handleSelectSlot = (dateKey: string, time: string) => {
        setSelectedEvent(null);
        setSelectedDateKey(dateKey);
        setSelectedTime(time);
        setSelectedEndTime(null);
        setIsFormCollapsed(false);
    };

    const handleCreateRange = (dateKey: string, startTime: string, endTime: string) => {
        setSelectedEvent(null);
        setSelectedDateKey(dateKey);
        setSelectedTime(startTime);
        setSelectedEndTime(endTime);
        setIsFormCollapsed(false);
    };

    const handleJumpToDay = (dateKey: string) => {
        setCurrentDate(new Date(`${dateKey}T00:00:00`));
        setView("day");
    };

    const handleSaved = () => {
        setSelectedEvent(null);
        setSelectedDateKey(null);
        setSelectedTime(null);
        setSelectedEndTime(null);
        setReloadKey((value) => value + 1);
    };

    const handleEventChanged = (updatedEvent: CalendarEventRead, originalStartAt: string) => {
        if (!updatedEvent) return;
        setEvents((prev) => {
            const matchIndex = prev.findIndex((e) => e.id === updatedEvent.id && e.start_at === originalStartAt);
            if (matchIndex === -1) return [...prev, updatedEvent];
            const next = [...prev];
            next[matchIndex] = updatedEvent;
            return next;
        });
        // No reloadKey bump here: a background refetch immediately after this
        // optimistic update can race the backend's write and return stale data,
        // silently overwriting the correct state — this is what "jump back to
        // original time" was. The optimistic merge above is already accurate.
    };

    const formattedHeader = useMemo(() => {
        if (view === "day") {
            return currentDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
        }

        if (view === "week") {
            const start = startOfWeek(currentDate);
            const end = endOfWeek(currentDate);
            const sameMonth = start.getMonth() === end.getMonth();
            const startLabel = start.toLocaleDateString("en", { month: "short", day: "numeric" });
            const endLabel = end.toLocaleDateString("en", sameMonth ? { day: "numeric", year: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
            return `${startLabel} \u2013 ${endLabel}`;
        }

        if (view === "year") {
            return String(currentDate.getFullYear());
        }

        return currentDate.toLocaleDateString("en", { month: "long", year: "numeric" });
    }, [currentDate, view]);

    const calendarLayoutClassName = isFormCollapsed
        ? "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]"
        : "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]";

    const draftDateKey = !selectedEvent && !isFormCollapsed ? selectedDateKey : null;
    const draftStartTime = draftDateKey ? selectedTime ?? "09:00" : null;
    const draftEndTime = draftDateKey
        ? selectedEndTime ?? (selectedTime ? addOneHourToTime(selectedTime) : "10:00")
        : null;

    const adjustInterval = (offset: number) => {
        setCurrentDate((prev) => {
            if (view === "day") return addDays(prev, offset);
            if (view === "week") return addDays(prev, offset * 7);
            if (view === "year") return addYears(prev, offset);
            return addMonths(startOfMonth(prev), offset);
        });
        setSelectedEvent(null);
        setSelectedDateKey(null);
        setSelectedTime(null);
        setSelectedEndTime(null);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedEvent(null);
        setSelectedDateKey(null);
        setSelectedTime(null);
        setSelectedEndTime(null);
    };

    const openNewEventForm = () => {
        setSelectedEvent(null);
        setSelectedDateKey(toDateKey(new Date()));
        setSelectedTime(null);
        setSelectedEndTime(null);
        setIsFormCollapsed(false);
    };

    return (
        <div className="grid gap-6">
            <section className="flex flex-col justify-between gap-4 rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 shadow-[0_24px_90px_rgba(43,34,24,0.08)] sm:flex-row sm:items-end sm:p-8">
                <SectionHeader
                    description="Track upcoming investment dates, automated sweeping distributions, and verification windows."
                    eyebrow="Timeline"
                    title="Schedule Ledger"
                />
                <button
                    className="inline-flex h-11 items-center justify-center rounded-md bg-[#1d211c] px-4 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343b32]"
                    onClick={openNewEventForm}
                    type="button"
                >
                    New Event
                </button>
            </section>

            <div className={calendarLayoutClassName}>
                <div className="min-w-0 space-y-4">
                    <div className="flex flex-col gap-3 rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-lg font-bold text-[#1d211c]">{formattedHeader}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                            <CalendarViewSwitcher view={view} onChange={setView} />
                            <button
                                onClick={() => adjustInterval(-1)}
                                className="h-9 rounded-md border border-[#d9d0c1] bg-[#f5efe4] px-3 text-xs font-bold text-[#1d211c] transition hover:bg-[#1d211c] hover:text-[#fbf7ef]"
                                type="button"
                            >
                                Previous
                            </button>
                            <button
                                onClick={goToToday}
                                className="h-9 rounded-md border border-[#d9d0c1] bg-[#f5efe4] px-3 text-xs font-bold text-[#1d211c] transition hover:bg-[#1d211c] hover:text-[#fbf7ef]"
                                type="button"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => adjustInterval(1)}
                                className="h-9 rounded-md border border-[#d9d0c1] bg-[#f5efe4] px-3 text-xs font-bold text-[#1d211c] transition hover:bg-[#1d211c] hover:text-[#fbf7ef]"
                                type="button"
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    {isLoading && !hasLoadedOnce ? (
                        <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-8 text-sm font-semibold text-[#696154] shadow-[0_18px_70px_rgba(43,34,24,0.04)]">
                            Reassembling timeline matrix metrics...
                        </div>
                    ) : errorMessage ? (
                        <div className="rounded-lg border border-[#d5a58b] bg-[#f2e0d8] p-6 text-sm font-semibold text-[#8f3f32] shadow-[0_18px_70px_rgba(143,63,50,0.08)]">
                            {errorMessage}
                        </div>
                    ) : view === "month" ? (
                        <CalendarGrid
                            currentDate={currentDate}
                            events={events}
                            onSelectEvent={handleSelectEvent}
                            onSelectDate={handleSelectDate}
                        />
                    ) : view === "year" ? (
                        <CalendarYearGrid currentDate={currentDate} events={events} onSelectDay={handleJumpToDay} />
                    ) : (
                        <CalendarTimeGrid
                            currentDate={currentDate}
                            view={view}
                            events={events}
                            onSelectEvent={handleSelectEvent}
                            onSelectSlot={handleSelectSlot}
                            onCreateRange={handleCreateRange}
                            onEventChanged={handleEventChanged}
                            draftDateKey={draftDateKey}
                            draftStartTime={draftStartTime}
                            draftEndTime={draftEndTime}
                        />
                    )}
                </div>

                <aside className="min-w-0 space-y-4 xl:sticky xl:top-6">
                    {isFormCollapsed ? (
                        <section className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-4 shadow-[0_18px_70px_rgba(43,34,24,0.04)]">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8f6f2d]">Calendar</p>
                            <h3 className="font-display mt-1 text-2xl font-semibold leading-tight text-[#1d211c]">
                                Form hidden
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-[#696154]">
                                Bring the schedule form back when you need to add or edit an event.
                            </p>
                            <button
                                className="mt-4 h-10 w-full rounded-md bg-[#1d211c] px-3 text-sm font-bold text-[#fbf7ef] transition hover:bg-[#343b32]"
                                onClick={openNewEventForm}
                                type="button"
                            >
                                New schedule
                            </button>
                        </section>
                    ) : (
                        <CalendarEventForm
                            key={
                                selectedEvent
                                    ? `${selectedEvent.id}-${selectedDateKey}`
                                    : `${selectedDateKey ?? "new-event"}-${selectedTime ?? "no-time"}-${selectedEndTime ?? "no-end"}`
                            }
                            onCancelSelection={() => {
                                setSelectedEvent(null);
                                setSelectedDateKey(null);
                                setSelectedTime(null);
                                setSelectedEndTime(null);
                            }}
                            onCollapse={() => setIsFormCollapsed(true)}
                            onSaved={handleSaved}
                            selectedDateKey={selectedDateKey}
                            selectedTime={selectedTime}
                            selectedEndTime={selectedEndTime}
                            selectedEvent={selectedEvent}
                        />
                    )}
                    <div className="rounded-lg border border-[#d9d0c1] bg-[#f5efe4] p-4 shadow-[0_18px_70px_rgba(43,34,24,0.04)]">
                        <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#1d211c]">Agenda Timeline</h4>
                        <MiniAgendaList events={events} onSelectEvent={handleSelectEvent} />
                    </div>
                </aside>
            </div>
        </div>
    );
}