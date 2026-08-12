"use client";

import { useMemo } from "react";
import { CalendarDayBox } from "./CalendarDayBox";
import { groupEventsByDateKey } from "@/lib/utils/calendarDateUtils";
import type { CalendarEventRead } from "@/lib/api/generated";
import { da } from "zod/locales";

interface CalendarGridProps {
    currentDate: Date;
    events: CalendarEventRead[];
    onSelectEvent: (
        event: CalendarEventRead, 
        activeDateStr: string
    ) => void;
    onSelectDate: (dateKey: string) => void;
}

export function CalendarGrid({ currentDate, events, onSelectEvent, onSelectDate }: CalendarGridProps) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // find which day of the week the month starts
    // if it starts on Wednesday, need three empty cells
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

    const emptyDaysBeforeMonth = Array.from(
        { length: firstDayOfMonth }, 
        (_, index) => index
    );

    // group events so each calendar day can quickly find its events
    const eventsByDate = useMemo(
        () => groupEventsByDateKey(events), 
        [events]
    );

    const totalSlots = emptyDaysBeforeMonth.length + days.length;
    const trailingSlotCount = 
        totalSlots % 7 === 0 
            ? 0 
            : 7 - (totalSlots % 7);
    const trailingSlots = Array.from(
        { length: trailingSlotCount }, 
        (_, index) => index
    );

    function getDateKey(day: number) { 
        const monthNumber = String(month + 1).padStart(2, "0"); 
        const dayNumber = String(day).padStart(2, "0"); 
        
        return `${year}-${monthNumber}-${dayNumber}`; 
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] shadow-[0_24px_90px_rgba(43,34,24,0.03)]">
            <div className="min-w-[720px]">
                {/* Weekday headings */}
                <div className="grid grid-cols-7 border-b border-[#d9d0c1] bg-[#f5efe4] py-2.5 text-center text-xs font-bold uppercase tracking-wider text-[#696154]">
                    {weekdays.map(weekday => (
                        <div key={weekday}>{weekday}</div>
                    ))}
                </div>

                {/* Calendar days */}
                <div className="grid auto-rows-[126px] grid-flow-row grid-cols-7 border-l border-t border-[#d9d0c1] bg-[#fbf7ef]">
                    {/* Empty cells before the first day of the month */}
                    {emptyDaysBeforeMonth.map(day => (
                        <div 
                            key={`empty-${day}`} 
                            className="border-b border-r border-[#d9d0c1] bg-[#fbf7ef]/50" />
                    ))}

                    {/* Days in the current month */}
                    {days.map(day => {
                        const date = new Date(year, month, day);
                        const dateKey = getDateKey(day);
                        const dayEvents = eventsByDate[dateKey] || [];

                        return (
                            <CalendarDayBox
                                key={day}
                                day={day}
                                dateObj={date}
                                dateKey={dateKey}
                                dailyEvents={dayEvents}
                                onSelectDate={onSelectDate}
                                onSelectEvent={onSelectEvent}
                            />
                        );
                    })}

                    {/* Empty cells after the last day of the month */}
                    {trailingSlots.map(day => (
                        <div 
                            key={`trailing-${day}`} 
                            className="border-b border-r border-[#d9d0c1] bg-[#fbf7ef]/50" 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}