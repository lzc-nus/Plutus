'use client';

import React, { useState } from 'react';

interface ManageEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    eventData: {
        id: string;
        title: string;
        amount: number;
        category: string;
    } | null;
}

export default function ManageEventModal({ isOpen, onClose, onSuccess, eventData }: ManageEventModalProps) {
    const [description, setDescription] = useState(eventData?.title || '');
    const [amount, setAmount] = useState(eventData ? Math.abs(eventData.amount).toString() : '');
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);

    if (!isOpen || !eventData) {
        return null;
    }

    const handleUpdate = async (e: React.BaseSyntheticEvent) => {
        e.preventDefault();
        setUpdating(true);

        const numericAmount = parseFloat(amount);
        const sanitizedAmount = eventData.category === 'Income' ? numericAmount : -numericAmount;

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/calendar/events/${eventData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: description,
                    amount: sanitizedAmount,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to patch rule");
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Error updating schedule rule");
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to stop tracking "${eventData.title}"?`)) {
            return;
        }
        setDeleting(true);

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/calendar/events/${eventData.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error("Failed to delete rule");
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Error deleting commitment rule");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl w-full max-w-sm text-white shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-200">Manage Rule</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description</label>
                        <input
                            type="text" required value={description} onChange={e => setDescription(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm focus:outline-none focus:border-slate-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Amount</label>
                        <input
                            type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm focus:outline-none focus:border-slate-500"
                        />
                    </div>

                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button" disabled={deleting || updating} onClick={handleDelete}
                            className="w-1/3 bg-rose-950/40 text-rose-400 border border-rose-900/60 font-semibold py-2 rounded text-sm hover:bg-rose-900/40 transition-colors disabled:opacity-50"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                        <button
                            type="submit" disabled={updating || deleting}
                            className="w-2/3 bg-slate-100 text-slate-950 font-semibold py-2 rounded text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                            {updating ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}