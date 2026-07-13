"use client";

import { useMemo } from "react";
import { CalendarMiniMonth } from "./CalendarMiniMonth";
import { groupEventsByDateKey } from "@/lib/utils/calendarDateUtils";
import type { CalendarEventRead } from "@/lib/api/generated";

interface CalendarYearGridProps {
    currentDate: Date;
    events: CalendarEventRead[];
    onSelectDay: (dateKey: string) => void;
}

export function CalendarYearGrid({ currentDate, events, onSelectDay }: CalendarYearGridProps) {
    const year = currentDate.getFullYear();
    const eventsByDateKey = useMemo(() => groupEventsByDateKey(events), [events]);
    const months = Array.from({ length: 12 }, (_, i) => i);

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {months.map((month) => (
                <CalendarMiniMonth
                    key={month}
                    year={year}
                    month={month}
                    eventsByDateKey={eventsByDateKey}
                    onSelectDay={onSelectDay}
                />
            ))}
        </div>
    );
}