"use client";

import { useMemo } from "react";
import { toDateKey } from "@/lib/utils/calendarDateUtils";
import type { CalendarEventRead } from "@/lib/api/generated";
import { da } from "zod/v4/locales";

interface CalendarMiniMonthProps {
    year: number;
    month: number; // 0-indexed, 0 = January, 11 = December
    eventsByDateKey: Record<string, CalendarEventRead[]>;
    onSelectDay: (dateKey: string) => void;
}

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarMiniMonth({ year, month, eventsByDateKey, onSelectDay }: CalendarMiniMonthProps) {
    const monthLabel = useMemo(() => {
        return new Date(year, month, 1)
            .toLocaleDateString("en", { 
                month: "long" 
            });
    }, [year, month]);

    const isCurrentMonth = useMemo(() => {
        const today = new Date();

        return today.getFullYear() === year && today.getMonth() === month;
    }, [year, month]);

    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = Array.from(
        { length: daysInMonth }, 
        (_, index) => index + 1
    );
    
    const emptyDaysBeforeMonth = Array.from({ 
        length: firstDayOfMonth }, 
        (_, index) => index
    );

    const todayKey = toDateKey(new Date());

    function getDateKey(day: number) { 
        const monthNumber = String(month + 1).padStart(2, "0"); 
        const dayNumber = String(day).padStart(2, "0"); 
        
        return `${year}-${monthNumber}-${dayNumber}`; 
    }

    return (
        <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-3 shadow-[0_18px_70px_rgba(43,34,24,0.03)]">
            {/* Month name */}
            <h4
                className={`mb-2 text-sm font-bold ${
                    isCurrentMonth 
                        ? "text-[#8f6f2d]" 
                        : "text-[#1d211c]"
                }`}
            >
                {monthLabel}
            </h4>

            <div className="grid grid-cols-7 gap-y-1 text-center">
                {/* Weekday labels */}
                {WEEKDAY_INITIALS.map((weekday, index) => (
                    <div 
                        key={index} 
                        className="text-[10px] font-bold uppercase text-[#a99b82]"
                    >
                        {weekday}
                    </div>
                ))}

                {/* Empty cells before the first day */}
                {emptyDaysBeforeMonth.map(day => (
                    <div key={`empty-${day}`} />
                ))}

                {days.map(day => {
                    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const hasEvents = Boolean(eventsByDateKey[dateKey]?.length);
                    const isToday = dateKey === todayKey;

                    return (
                        <button
                            key={day}
                            className={`mx-auto flex size-6 flex-col items-center justify-center rounded-full text-[11px] font-semibold transition ${
                                isToday
                                    ? "bg-[#1d211c] text-[#fbf7ef]"
                                    : "text-[#353026] hover:bg-[#f5efe4]"
                            }`}
                            onClick={() => onSelectDay(dateKey)}
                            type="button"
                        >
                            <span>{day}</span>

                            {/* Show a dot when the day has events */}
                            {hasEvents && !isToday ? (
                                <span className="-mt-1 size-1 rounded-full bg-[#8f6f2d]" />
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}