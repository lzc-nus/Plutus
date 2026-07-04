"use client";

import { useMemo } from "react";
import { getCalendarEventColor } from "@/data/calendarEventColors";
import type { CalendarEventRead } from "@/lib/api/generated";

interface CalendarDayBoxProps {
    day: number;
    dateObj: Date;
    dateKey: string;
    dailyEvents: CalendarEventRead[];
    onSelectDate: (activeDateStr: string) => void;
    onSelectEvent: (event: CalendarEventRead, activeDateStr: string) => void;
}

export function CalendarDayBox({
    day,
    dateObj,
    dateKey,
    dailyEvents,
    onSelectDate,
    onSelectEvent,
}: CalendarDayBoxProps) {
    const isToday = useMemo(() => {
        return new Date().toDateString() === dateObj.toDateString();
    }, [dateObj]);

    return (
        <div className="group flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-r border-[#d9d0c1] bg-[#fbf7ef] p-2.5 transition hover:bg-[#fcfbf7]">
            <div className="mb-2 flex items-center justify-between gap-2">
                <button
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${isToday ? "bg-[#1d211c] text-[#fbf7ef]" : "text-[#1d211c] group-hover:bg-[#f5efe4]"
                        }`}
                    onClick={() => onSelectDate(dateKey)}
                    type="button"
                >
                    {day}
                </button>
                {dailyEvents.length > 2 && (
                    <span className="rounded-sm bg-[#f5efe4] px-1.5 py-0.5 text-[10px] font-semibold text-[#696154]">
                        {dailyEvents.length} items
                    </span>
                )}
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
                {dailyEvents.map((evt) => {
                    const color = getCalendarEventColor(evt.color);
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
                            className="block w-full min-w-0 truncate rounded border px-2 py-1 text-left text-[11px] font-medium transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#8f6f2d]/25"
                            style={{
                                backgroundColor: color.background,
                                borderColor: color.border,
                                color: color.text,
                            }}
                        >
                            {formattedTime && <span className="mr-0.5 font-semibold opacity-75">{formattedTime}</span>}
                            {evt.title}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}