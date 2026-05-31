"use client";

import React, { useMemo } from "react";
import { CalendarDayBox } from "./calendar-day-box";
import type { CalendarEventRead } from "@/lib/api/generated";

interface CalendarGridProps {
    currentDate: Date;
    events: CalendarEventRead[];
    onSelectEvent: (event: CalendarEventRead, activeDateStr: string) => void;
}

export function CalendarGrid({ currentDate, events, onSelectEvent }: CalendarGridProps) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyPrefixSlots = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    // Index inbound API records safely using short strings (YYYY-MM-DD)
    const eventsByDateMap = useMemo(() => {
        const map: Record<string, CalendarEventRead[]> = {};
        events.forEach((evt) => {
            const dateKey = evt.start_at.split("T")[0];
            if (!map[dateKey]) {
                map[dateKey] = [];
            }
            map[dateKey].push(evt);
        });
        return map;
    }, [events]);

    return (
        <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] overflow-hidden shadow-[0_24px_90px_rgba(43,34,24,0.02)]">
            <div className="grid grid-cols-7 border-b border-[#d9d0c1] bg-[#f5efe4] text-center text-xs font-bold text-[#696154] py-2.5">
                {weekdays.map((day) => (
                    <div key={day} className="uppercase tracking-wider">{day}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 grid-flow-row auto-rows-[115px] bg-[#d9d0c1] gap-[1px]">
                {emptyPrefixSlots.map((slot) => (
                    <div key={`empty-${slot}`} className="bg-[#fbf7ef]/40" />
                ))}

                {daysArray.map((day) => {
                    const dateObj = new Date(year, month, day);
                    const lookupKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dailyEvents = eventsByDateMap[lookupKey] || [];

                    return (
                        <CalendarDayBox
                            key={day}
                            day={day}
                            dateObj={dateObj}
                            dateKey={lookupKey}
                            dailyEvents={dailyEvents}
                            onSelectEvent={onSelectEvent}
                        />
                    );
                })}
            </div>
        </div>
    );
}