"use client";

import React, { useMemo } from "react";
import type { CalendarEventRead } from "@/lib/api/generated";

interface MiniAgendaListProps {
    events: CalendarEventRead[];
}

export function MiniAgendaList({ events }: MiniAgendaListProps) {
    const sortedUpcomingEvents = useMemo(() => {
        return [...events]
            .filter((e) => new Date(e.start_at) >= new Date())
            .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
            .slice(0, 5);
    }, [events]);

    if (sortedUpcomingEvents.length === 0) {
        return (
            <div className="text-center py-8 px-4 text-xs font-medium text-[#696154] border border-dashed border-[#d9d0c1] rounded-md bg-[#fbf7ef]/50">
                No tracking schedules logged.
            </div>
        );
    }

    return (
        <div className="space-y-2.5">
            {sortedUpcomingEvents.map((evt) => {
                const startTarget = new Date(evt.start_at);
                return (
                    <div
                        key={`${evt.id}-${evt.start_at}`}
                        className="flex items-start justify-between p-3 rounded-md border border-[#d9d0c1] bg-[#fbf7ef] shadow-sm hover:border-[#1d211c] transition-colors"
                    >
                        <div className="grid gap-0.5 max-w-[70%]">
                            <h4 className="text-xs font-bold text-[#1d211c] truncate">{evt.title}</h4>
                            <p className="text-[11px] text-[#696154] truncate">
                                {evt.description || "No descriptive notes recorded."}
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <span className="text-[11px] font-bold text-[#1d211c] block">
                                {startTarget.toLocaleDateString("en", { month: "short", day: "numeric" })}
                            </span>
                            <span className="text-[10px] font-medium text-[#696154]">
                                {evt.is_all_day ? "All Day" : startTarget.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false })}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}