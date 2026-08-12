"use client";

import { useMemo } from "react";
import { getCalendarEventColor } from "@/data/calendarEventColors";
import type { CalendarEventRead } from "@/lib/api/generated";

interface MiniAgendaListProps {
    events: CalendarEventRead[];
    onSelectEvent?: (
        event: CalendarEventRead, 
        activeDateStr: string
    ) => void;
}

export function MiniAgendaList({ events, onSelectEvent }: MiniAgendaListProps) {
    // sorted
    const upcomingEvents = useMemo(() => {
        const now = new Date();

        return [...events]
            .filter(event => new Date(event.start_at) >= now)
            .sort(
                (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
            )
            .slice(0, 5);
    }, [events]);

    if (upcomingEvents.length === 0) {
        return (
            <div className="rounded-md border border-dashed border-[#d9d0c1] bg-[#fbf7ef]/60 px-4 py-8 text-center text-xs font-medium text-[#696154]">
                No tracking schedules logged.
            </div>
        );
    }

    return (
        <div className="space-y-2.5">
            {upcomingEvents.map(event => {
                const startTarget = new Date(event.start_at);
                const eventColor = getCalendarEventColor(event.color);

                return (
                    <button
                        key={`${event.id}-${event.start_at}`}
                        className="flex w-full min-w-0 items-start justify-between gap-3 rounded-md border border-[#d9d0c1] bg-[#fbf7ef] p-3 text-left shadow-sm transition-colors hover:border-[#1d211c] focus:outline-none focus:ring-2 focus:ring-[#8f6f2d]/25"
                        style={{ borderColor: eventColor.border }}
                        onClick={() => onSelectEvent?.(event, toDateKey(startTarget))}
                        type="button"
                    >
                        <span
                            className="mt-0.5 size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: eventColor.swatch }}
                        />

                        <div className="grid min-w-0 flex-1 gap-0.5">
                            <h4 className="truncate text-xs font-bold text-[#1d211c]">
                                {event.title}
                            </h4>

                            <p className="truncate text-[11px] text-[#696154]">
                                {event.description || "No descriptive notes recorded."}
                            </p>
                        </div>

                        <div className="shrink-0 text-right">
                            <span className="block text-[11px] font-bold text-[#1d211c]">
                                {startTarget.toLocaleDateString("en", { month: "short", day: "numeric" })}
                            </span>

                            <span className="text-[10px] font-medium text-[#696154]">
                                {event.is_all_day 
                                    ? "All Day" 
                                    : startTarget.toLocaleTimeString("en", { 
                                        hour: "2-digit", 
                                        minute: "2-digit", 
                                        hour12: false 
                                    })}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function toDateKey(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    
    return `${year}-${month}-${day}`;
}
