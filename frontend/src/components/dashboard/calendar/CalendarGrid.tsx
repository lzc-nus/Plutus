"use client";

import { useMemo } from "react";
import { CalendarDayBox } from "./CalendarDayBox";
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

    const eventsByDateMap = useMemo(() => {
        const map: Record<string, CalendarEventRead[]> = {};
        events.forEach((evt) => {
            getDateKeysForEvent(evt).forEach((dateKey) => {
                if (!map[dateKey]) {
                    map[dateKey] = [];
                }
                map[dateKey].push(evt);
            });
        });

        Object.values(map).forEach((dailyEvents) => {
            dailyEvents.sort((a, b) => {
                if (a.is_all_day !== b.is_all_day) return a.is_all_day ? -1 : 1;
                return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
            });
        });

        return map;
    }, [events]);

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

                <div className="grid auto-rows-[126px] grid-flow-row grid-cols-7 gap-[1px] bg-[#d9d0c1]">
                    {emptyPrefixSlots.map((slot) => (
                        <div key={`empty-${slot}`} className="bg-[#fbf7ef]/50" />
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
                        <div key={`trailing-${slot}`} className="bg-[#fbf7ef]/50" />
                    ))}
                </div>
            </div>
        </div>
    );
}

function getDateKeysForEvent(event: CalendarEventRead) {
    const start = startOfDay(new Date(event.start_at));
    const end = startOfDay(new Date(event.end_at));
    const visibleEnd = event.is_all_day ? addDays(end, -1) : end;
    const keys: string[] = [];

    for (let cursor = start; cursor <= visibleEnd; cursor = addDays(cursor, 1)) {
        keys.push(toDateKey(cursor));
    }

    return keys.length > 0 ? keys : [toDateKey(start)];
}

function startOfDay(value: Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, days: number) {
    const next = new Date(value);
    next.setDate(next.getDate() + days);
    return next;
}

function toDateKey(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
