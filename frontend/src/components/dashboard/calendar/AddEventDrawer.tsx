'use client';

import React, { useState } from 'react';

interface AddEventDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddEventDrawer({ isOpen, onClose, onSuccess }: AddEventDrawerProps) {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const currentDayNumber = today.getDate().toString();

    // Convert JS Sun-Sat (0-6) index format to match backend index framework
    // JS: 0=Sun, 1=Mon, ..., 6=Sat
    // Backend/Python: 0=Mon, 1=Tue, ..., 6=Sun
    const jsDay = today.getDay();
    const backendDayString = (jsDay === 0 ? 6 : jsDay - 1).toString();

    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [startDate, setStartDate] = useState(todayString); // Defaults to exactly today
    const [frequency, setFrequency] = useState('');
    const [dayOfMonth, setDayOfMonth] = useState(currentDayNumber); // Defaults to today's date number
    const [dayOfWeek, setDayOfWeek] = useState(backendDayString); // Defaults to today's weekday index
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        setSubmitting(true);

        // Dynamically enforce negative numbers for costs, positive for income
        const numericAmount = Math.abs(parseFloat(amount));
        const sanitizedAmount = category === 'Income' ? numericAmount : -numericAmount;

        const payload = {
            description,
            category,
            amount: sanitizedAmount,
            start_date: startDate,
            frequency,
            day_of_month: frequency === 'MONTHLY' ? parseInt(dayOfMonth) : null,
            day_of_week: frequency == 'WEEKLY' ? parseInt(dayOfWeek) : null,
        };

        try {
            const res = await fetch("http://127.0.0.1:8000/api/calendar/events", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error("Failed to save schedule template");
            }

            // Reset form states
            setDescription('');
            setAmount('');
            onSuccess(); // Retrigger calendar projection data sync
            onClose(); // Close drawer panel
        } catch (err) {
            console.error(err);
            alert('Error saving recurring event');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
            {/* Backdrop area click handler */}
            <div className="absolute inset-0" onClick={onClose}></div>

            {/* Drawer Container */}
            <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-6 text-white flex flex-col justify-between shadow-2xl animate-slide-in">
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">New Recurring Rule</h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description</label>
                            <input
                                type="text" required placeholder="e.g., Netflix Premium" value={description} onChange={e => setDescription(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm focus:outline-none focus:border-slate-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Category</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm focus:outline-none focus:border-slate-500 text-white"
                                >
                                    <option value="" disabled hidden>Select Category</option>
                                    <option value="Bills">Bills</option>
                                    <option value="Income">Income</option>
                                    <option value="Subscriptions">Subscriptions</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Amount</label>
                                <input
                                    type="number" step="0.01" required placeholder="e.g., -14.99" value={amount} onChange={e => setAmount(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm focus:outline-none focus:border-slate-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Start Date</label>
                            <input
                                type="date" required value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Recurrence Frequency</label>
                            <select
                                value={frequency}
                                onChange={e => setFrequency(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm focus:outline-none focus:border-slate-500 text-white"
                            >
                                <option value="" disabled hidden>Select Frequency</option>
                                <option value="MONTHLY">Monthly</option>
                                <option value="WEEKLY">Weekly</option>
                            </select>
                        </div>

                        {frequency === 'MONTHLY' ? (
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Day of Month</label>
                                <input
                                    type="number" min="1" max="31" required value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm focus:outline-none"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Day of Week</label>
                                <select 
                                    value={dayOfWeek} 
                                    onChange={e => setDayOfWeek(e.target.value)} 
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm focus:outline-none"
                                >
                                    <option value="0">Monday</option>
                                    <option value="1">Tuesday</option>
                                    <option value="2">Wednesday</option>
                                    <option value="3">Thursday</option>
                                    <option value="4">Friday</option>
                                    <option value="5">Saturday</option>
                                    <option value="6">Sunday</option>
                                </select>
                            </div>
                        )}

                        <button
                            type="submit" disabled={submitting}
                            className="w-full mt-4 bg-slate-100 text-slate-950 font-semibold py-2 rounded text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : 'Add Commitment Rule'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}