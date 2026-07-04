"use client";

import { useMemo } from "react";
import { CalendarDayBox } from "./CalendarDayBox";
import { groupEventsByDateKey } from "@/lib/utils/calendarDateUtils";
import type { CalendarEventRead } from "@/lib/api/generated";

interface CalendarGridProps {
    currentDate: Date;
    events: CalendarEventRead[];
    onSelectEvent: (event: CalendarEventRead, activeDateStr: string) => void;
    onSelectDate: (dateKey: string) => void;
}

export function CalendarGrid({ currentDate, events, onSelectEvent, onSelectDate }: CalendarGridProps) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyPrefixSlots = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    const eventsByDateMap = useMemo(() => groupEventsByDateKey(events), [events]);

    const totalSlots = emptyPrefixSlots.length + daysArray.length;
    const trailingSlotCount = totalSlots % 7 === 0 ? 0 : 7 - (totalSlots % 7);
    const trailingSlots = Array.from({ length: trailingSlotCount }, (_, i) => i);

    return (
        <div className="overflow-x-auto rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] shadow-[0_24px_90px_rgba(43,34,24,0.03)]">
            <div className="min-w-[720px]">
                <div className="grid grid-cols-7 border-b border-[#d9d0c1] bg-[#f5efe4] py-2.5 text-center text-xs font-bold uppercase tracking-wider text-[#696154]">
                    {weekdays.map((day) => (
                        <div key={day}>{day}</div>
                    ))}
                </div>

                <div className="grid auto-rows-[126px] grid-flow-row grid-cols-7 border-l border-t border-[#d9d0c1] bg-[#fbf7ef]">
                    {emptyPrefixSlots.map((slot) => (
                        <div key={`empty-${slot}`} className="border-b border-r border-[#d9d0c1] bg-[#fbf7ef]/50" />
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
                                onSelectDate={onSelectDate}
                                onSelectEvent={onSelectEvent}
                            />
                        );
                    })}

                    {trailingSlots.map((slot) => (
                        <div key={`trailing-${slot}`} className="border-b border-r border-[#d9d0c1] bg-[#fbf7ef]/50" />
                    ))}
                </div>
            </div>
        </div>
    );
}