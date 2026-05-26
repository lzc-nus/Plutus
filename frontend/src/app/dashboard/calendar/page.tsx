'use client';

import { useState } from 'react';
import CalendarGrid from "@/components/dashboard/calendar/CalendarGrid";

export default function Home() {
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [refreshKey, setRefreshKey] = useState(0);

    const triggerRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <main className="min-h-screen bg-[#f4efe6] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight font-display sm:text-5xl">
                    Financial Management Deck
                </h1>
                <p className="mt-2 text-sm text-[#696154]"></p>
            </div>

            <CalendarGrid 
                currentYear={currentYear}
                setCurrentYear={setCurrentYear}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                startView="month"
                endView="month"
                refreshKey={refreshKey}
                triggerRefresh={triggerRefresh}
            />
        </main>
    );
}
