"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/wealth-components";
import { CalendarGrid } from "@/components/dashboard/calendar/calendar-grid";
import { MiniAgendaList } from "@/components/dashboard/calendar/calendar-agenda-list";
import { listCalendarEvents } from "@/lib/api/calendar";
import type { CalendarEventRead } from "@/lib/api/generated";

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [events, setEvents] = useState<CalendarEventRead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    // Safely construct a viewing boundary matrix to pass downward to our API list parameters
    const { startWindow, endWindow } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Window calculation buffers encompassing current view constraints
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

            if (ignore) return;

            if (error || !response?.ok) {
                setEvents([]);
                setErrorMessage("Unable to retrieve calendar window records. Please try again.");
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
    }, [startWindow, endWindow]);

    const handleSelectEvent = (event: CalendarEventRead, activeDateStr: string) => {
        console.log("Active contextual timeline reference:", event, activeDateStr);
    };

    const formattedMonthHeader = useMemo(() => {
        return currentDate.toLocaleDateString("en", { month: "long", year: "numeric" });
    }, [currentDate]);

    const adjustMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    return (
        <div className="grid gap-6">
            {/* Page Title Contextual Segment Block */}
            <section className="flex flex-col justify-between gap-4 rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 shadow-[0_24px_90px_rgba(43,34,24,0.08)] sm:flex-row sm:items-end sm:p-8">
                <SectionHeader
                    description="Track upcoming investment dates, automated sweeping distributions, and verification windows."
                    eyebrow="Timeline"
                    title="Schedule Ledger"
                />
                <Link
                    className="inline-flex h-11 items-center justify-center rounded-md bg-[#1d211c] px-4 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343b32]"
                    href="/dashboard/calendar/new"
                >
                    New Event
                </Link>
            </section>

            {/* Main Structural Application Layout Matrix Split */}
            <div className="grid gap-6 lg:grid-cols-4">
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between bg-[#fbf7ef] p-4 rounded-lg border border-[#d9d0c1]">
                        <h3 className="text-lg font-bold text-[#1d211c]">{formattedMonthHeader}</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => adjustMonth(-1)}
                                className="px-3 py-1.5 text-xs font-bold border border-[#d9d0c1] rounded bg-[#f5efe4] text-[#1d211c] hover:bg-[#1d211c] hover:text-[#fbf7ef] transition"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-3 py-1.5 text-xs font-bold border border-[#d9d0c1] rounded bg-[#f5efe4] text-[#1d211c] hover:bg-[#1d211c] hover:text-[#fbf7ef] transition"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => adjustMonth(1)}
                                className="px-3 py-1.5 text-xs font-bold border border-[#d9d0c1] rounded bg-[#f5efe4] text-[#1d211c] hover:bg-[#1d211c] hover:text-[#fbf7ef] transition"
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-8 text-sm font-semibold text-[#696154]">
                            Reassembling timeline matrix metrics...
                        </div>
                    ) : errorMessage ? (
                        <div className="rounded-lg border border-[#d5a58b] bg-[#f2e0d8] p-6 text-sm font-semibold text-[#8f3f32]">
                            {errorMessage}
                        </div>
                    ) : (
                        <CalendarGrid
                            currentDate={currentDate}
                            events={events}
                            onSelectEvent={handleSelectEvent}
                        />
                    )}
                </div>

                {/* Dynamic Timeline Sidepanel Widget Component */}
                <div className="space-y-4">
                    <div className="bg-[#f5efe4] p-4 rounded-lg border border-[#d9d0c1]">
                        <h4 className="text-sm font-bold text-[#1d211c] uppercase tracking-wider mb-3">Agenda Timeline</h4>
                        <MiniAgendaList events={events} />
                    </div>
                </div>
            </div>
        </div>
    );
}