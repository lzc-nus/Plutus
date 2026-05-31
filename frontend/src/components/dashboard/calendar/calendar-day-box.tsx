"use client";

import React, { useMemo } from "react";
import type { CalendarEventRead } from "@/lib/api/generated";

interface CalendarDayBoxProps {
    day: number;
    dateObj: Date;
    dateKey: string;
    dailyEvents: CalendarEventRead[];
    onSelectEvent: (event: CalendarEventRead, activeDateStr: string) => void;
}

export function CalendarDayBox({
    day,
    dateObj,
    dateKey,
    dailyEvents,
    onSelectEvent,
}: CalendarDayBoxProps) {
    const isToday = useMemo(() => {
        return new Date().toDateString() === dateObj.toDateString();
    }, [dateObj]);

    return (
        <div className="bg-[#fbf7ef] p-2 flex flex-col justify-between group hover:bg-[#fcfbf7] transition min-h-0 min-w-0">
            <div className="flex items-center justify-between mb-1">
                <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${isToday ? "bg-[#1d211c] text-[#fbf7ef]" : "text-[#1d211c] group-hover:bg-[#f5efe4]"
                        }`}
                >
                    {day}
                </span>
                {dailyEvents.length > 2 && (
                    <span className="text-[10px] font-medium text-[#696154] bg-[#f5efe4] px-1.5 py-0.5 rounded-sm">
                        {dailyEvents.length} items
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar max-h-[72px]">
                {dailyEvents.map((evt) => {
                    const formattedTime = evt.is_all_day
                        ? ""
                        : new Intl.DateTimeFormat("en", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: false,
                        }).format(new Date(evt.start_at)) + " ";

                    return (
                        <button
                            key={`${evt.id}-${evt.start_at}`}
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectEvent(evt, dateKey);
                            }}
                            className="w-full text-left truncate text-[11px] font-medium px-2 py-0.5 rounded border border-[#d9d0c1] bg-[#f5efe4] text-[#1d211c] hover:bg-[#1d211c] hover:text-[#fbf7ef] transition-colors focus:outline-none"
                        >
                            {formattedTime && <span className="font-semibold opacity-75 mr-0.5">{formattedTime}</span>}
                            {evt.title}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}