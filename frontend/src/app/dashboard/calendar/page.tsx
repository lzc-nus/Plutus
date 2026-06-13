"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "@/components/WealthComponents";
import { MiniAgendaList } from "@/components/dashboard/calendar/CalendarAgendaList";
import { CalendarEventForm } from "@/components/dashboard/calendar/CalendarEventForm";
import { CalendarGrid } from "@/components/dashboard/calendar/CalendarGrid";
import { getApiErrorMessage } from "@/lib/api/auth";
import { listCalendarEvents } from "@/lib/api/calendar";
import type { CalendarEventRead } from "@/lib/api/generated";

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [events, setEvents] = useState<CalendarEventRead[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEventRead | null>(null);
    const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormCollapsed, setIsFormCollapsed] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const { startWindow, endWindow } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const start = new Date(year, month - 1, 1).toISOString();
        const end = new Date(year, month + 2, 0).toISOString();
        return { startWindow: start, endWindow: end };
    }, [currentDate]);

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
                return;
            }

            setEvents(data ?? []);
            setIsLoading(false);
        }

        void loadEvents();

        return () => {
            ignore = true;
        };
    }, [startWindow, endWindow, reloadKey]);

    const handleSelectEvent = (event: CalendarEventRead, activeDateStr: string) => {
        setSelectedEvent(event);
        setSelectedDateKey(activeDateStr);
        setIsFormCollapsed(false);
    };

    const handleSelectDate = (dateKey: string) => {
        setSelectedEvent(null);
        setSelectedDateKey(dateKey);
        setIsFormCollapsed(false);
    };

    const handleSaved = () => {
        setSelectedEvent(null);
        setSelectedDateKey(null);
        setReloadKey((value) => value + 1);
    };

    const formattedMonthHeader = useMemo(() => {
        return currentDate.toLocaleDateString("en", { month: "long", year: "numeric" });
    }, [currentDate]);

    const calendarLayoutClassName = isFormCollapsed
        ? "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]"
        : "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]";

    const adjustMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
        setSelectedEvent(null);
        setSelectedDateKey(null);
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
                    onClick={() => {
                        setSelectedEvent(null);
                        setSelectedDateKey(toDateKey(new Date()));
                        setIsFormCollapsed(false);
                    }}
                    type="button"
                >
                    New Event
                </button>
            </section>

            <div className={calendarLayoutClassName}>
                <div className="min-w-0 space-y-4">
                    <div className="flex flex-col gap-3 rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-lg font-bold text-[#1d211c]">{formattedMonthHeader}</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => adjustMonth(-1)}
                                className="h-9 rounded-md border border-[#d9d0c1] bg-[#f5efe4] px-3 text-xs font-bold text-[#1d211c] transition hover:bg-[#1d211c] hover:text-[#fbf7ef]"
                                type="button"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => {
                                    setCurrentDate(new Date());
                                    setSelectedEvent(null);
                                    setSelectedDateKey(null);
                                }}
                                className="h-9 rounded-md border border-[#d9d0c1] bg-[#f5efe4] px-3 text-xs font-bold text-[#1d211c] transition hover:bg-[#1d211c] hover:text-[#fbf7ef]"
                                type="button"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => adjustMonth(1)}
                                className="h-9 rounded-md border border-[#d9d0c1] bg-[#f5efe4] px-3 text-xs font-bold text-[#1d211c] transition hover:bg-[#1d211c] hover:text-[#fbf7ef]"
                                type="button"
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-8 text-sm font-semibold text-[#696154] shadow-[0_18px_70px_rgba(43,34,24,0.04)]">
                            Reassembling timeline matrix metrics...
                        </div>
                    ) : errorMessage ? (
                        <div className="rounded-lg border border-[#d5a58b] bg-[#f2e0d8] p-6 text-sm font-semibold text-[#8f3f32] shadow-[0_18px_70px_rgba(143,63,50,0.08)]">
                            {errorMessage}
                        </div>
                    ) : (
                        <CalendarGrid
                            currentDate={currentDate}
                            events={events}
                            onSelectEvent={handleSelectEvent}
                            onSelectDate={handleSelectDate}
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
                                onClick={() => {
                                    setSelectedEvent(null);
                                    setSelectedDateKey(toDateKey(new Date()));
                                    setIsFormCollapsed(false);
                                }}
                                type="button"
                            >
                                New schedule
                            </button>
                        </section>
                    ) : (
                        <CalendarEventForm
                            key={selectedEvent ? `${selectedEvent.id}-${selectedDateKey}` : selectedDateKey ?? "new-event"}
                            onCancelSelection={() => {
                                setSelectedEvent(null);
                                setSelectedDateKey(null);
                            }}
                            onCollapse={() => setIsFormCollapsed(true)}
                            onSaved={handleSaved}
                            selectedDateKey={selectedDateKey}
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

function toDateKey(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
