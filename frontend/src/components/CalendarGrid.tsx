'use client';

import React, { useState, useEffect } from 'react';
import AddEventDrawer from './AddEventDrawer';
import ManageEventModal from './ManageEventModal';

interface ProjectedEvent {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
}

export default function CalendarGrid() {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0 = Jan, 11 = Dec

    const [events, setEvents] = useState<ProjectedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<{ id: string; title: string; amount: number; category: string } | null>(null);

    const triggerRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    useEffect(() => {
        async function fetchProjections() {
            setLoading(true);
            try {
                const firstDayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
                const lastDayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${new Date(currentYear, currentMonth + 1, 0).getDate()}`;

                const res = await fetch(`http://127.0.0.1:8000/api/calendar/?start_view=${firstDayStr}&end_view=${lastDayStr}`);
                if (!res.ok) {
                    throw new Error("Failed to fetch calendar stream");
                }
                const data = await res.json();
                setEvents(data);
            } catch (err) {
                console.error("Error loading calendar items:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchProjections();
    }, [currentMonth, currentYear, refreshKey]);

    const handlePrevMonth = () => {
        if (currentMonth == 0) {
            setCurrentMonth(11);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth == 11) {
            setCurrentMonth(0);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (loading) {
        return <div className="p-8 text-slate-400">Recalculating timeline projections...</div>;
    }

    return (
        <div className="w-full max-w-5xl mx-auto p-6 bg-[#fbf7ef] text-[#7a6332] rounded-xl shadow-2xl border border-slate-800">

            {/* Header Section with Navigation Buttons */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handlePrevMonth}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors"
                    >
                        &larr; Prev
                    </button>
                    <h2 className="text-2xl font-bold tracking-wide min-w-[180px] text-center">
                        {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} {currentYear}
                    </h2>
                    <button
                        onClick={handleNextMonth}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors"
                    >
                        Next &rarr;
                    </button>
                </div>
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-950/20"
                >
                    + Add Rule
                </button>
                <span className="text-xs text-emerald-400 font-mono bg-emerald-950/50 border border-emerald-800/60 px-3 py-1 rounded-full">
                    Live Projections Active
                </span>
            </div>

            {/* Week Day Titles Row */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-semibold text-slate-400">
                {weekDays.map(day => (
                    <div key={day} className="py-2">{day}</div>
                ))}
            </div>

            {/* Actual Calendar Square Block Grid Matrix */}
            <div className="grid grid-cols-7 gap-2">
                {blankDays.map(blank => (
                    <div key={`blank-${blank}`} className="min-h-[110px] bg-slate-950/40 border border-transparent rounded-lg"></div>
                ))}

                {daysArray.map(day => {
                    const formattedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const matchingEvents = events.filter(e => e.date === formattedDateStr);

                    return (
                        <div key={day} className="min-h-[110px] bg-slate-800/40 border border-slate-700/50 p-2 rounded-lg flex flex-col justify-between hover:border-slate-500 transition-colors">
                            <span className="text-sm font-medium text-slate-400 mb-1">{day}</span>

                            <div className="flex-1 space-y-1 overflow-y-auto max-h-[75px] scrollbar-thin">
                                {matchingEvents.map(ev => {
                                    const isIncome = ev.category.toLowerCase() === 'income';
                                    return (
                                        <button
                                            key={ev.id + ev.date}
                                            onClick={() => {
                                                setSelectedEvent(ev);
                                                setIsManageOpen(true);
                                            }}
                                            className={`w-full text-left text-[10px] leading-tight px-1.5 py-1 rounded font-medium truncate block cursor-pointer transition-transform hover:scale-[1.02] ${isIncome
                                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                                                : 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                                                }`}
                                        >
                                            <span className="font-bold">{isIncome ? '+' : ''}${Math.abs(ev.amount)}</span> {ev.title}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <AddEventDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSuccess={triggerRefresh}
            />

            <ManageEventModal
                isOpen={isManageOpen}
                onClose={() => {
                    setIsManageOpen(false);
                    setSelectedEvent(null);
                }}
                onSuccess={triggerRefresh}
                key={selectedEvent?.id || 'empty'}
                eventData={selectedEvent}
            />
        </div>
    );
}