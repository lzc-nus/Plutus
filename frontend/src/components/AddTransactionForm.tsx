'use client';

import { useState } from 'react';

interface AddTransactionFormProps {
    onTransactionAdded: () => void; // A trigger to refresh the main table data
}

export default function AddTransactionForm({ onTransactionAdded }: AddTransactionFormProps) {
    const [date, setDate] = useState<string>('');
    const [time, setTime] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [category, setCategory] = useState<string>('');
    const [account, setAccount] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [impact, setImpact] = useState<string>('');
    const [range, setRange] = useState<string>('1D'); // Default to one value
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Generates: ["00:00", "00:15", ..., "13:30", ..., "23:45"]
    const generateTimeIntervals = (): string[] => {
        const intervals: string[] = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const HH = String(hour).padStart(2, '0');
                const MM = String(minute).padStart(2, '0');
                intervals.push(`${HH}:${MM}`);
            }
        }
        return intervals;
    };

    const TIME_OPTIONS = generateTimeIntervals();

    async function handleSubmit(e: React.BaseSyntheticEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);

        const payload = {
            date,
            time,
            description,
            category,
            account,
            amount: parseFloat(amount), // Convert the string input into a real number
            impact,
            range: [range],
        };

        try {
            const response = await fetch('http://localhost:8000/api/transactions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: Failed to record transaction.`);
            }

            // Reset form states on success
            setDate('');
            setTime('');
            setDescription('');
            setCategory('');
            setAccount('');
            setAmount('');
            setImpact('');

            // Notify parent component to reload the ledger array
            onTransactionAdded();
        } catch (err) {
            if (err instanceof Error) {
                setFormError(err.message);
            } else {
                setFormError('An unexpected network anomaly occurred.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="bg-[#fbf7ef] p-6 rounded-lg mb-8 border border-[#d9d0c1]">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Record New Transaction</h2>

            {formError && (
                <p className="text-red-600 text-sm mb-4">
                    <strong>Error:</strong> {formError}
                </p>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className='flex flex-col gap-1.5'>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">Description</label>
                    <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Target grocery run" className="w-full p-2 rounded-md shadow-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#8f6f2d] focus:ring-offset-2 text-gray-900" />
                </div>

                <div className='flex flex-col gap-1.5'>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">Amount ($) <span className='text-[#8f3f32]' aria-hidden='true'>*</span></label>
                    <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Negative for expenses (e.g. -50)" className="w-full p-2 rounded-md shadow-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#8f6f2d] text-gray-900" />
                </div>

                <div className='flex flex-col gap-1.5'>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">Date</label>
                    <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 rounded-md shadow-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#8f6f2d] text-gray-900" />
                </div>

                <div className='flex flex-col gap-1.5'>
                    <label htmlFor='time' className="block text-xs font-semibold mb-1 text-gray-700">
                        Time <span className='text-[#8f3f32]' aria-hidden='true'>*</span>
                        <span className="sr-only">Required, 24-hour format</span>
                    </label>
                    <select id="time" required value={time} onChange={(e) => setTime(e.target.value)} aria-required='true' className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8f6f2d] focus:border-blue-500 text-sm">
                        <option value="" disabled>Select time</option>
                        {TIME_OPTIONS.map((timeOption) => (
                            <option key={timeOption} value={timeOption}>
                                {timeOption}
                            </option>
                        ))}
                    </select>
                </div>

                <div className='flex flex-col gap-1.5'>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">Account</label>
                    <input type="text" required value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Checking Account" className="w-full p-2 rounded border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#8f6f2d] text-gray-900" />
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">Category</label>
                    <input type="text" required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Food, Utilities" className="w-full p-2 rounded border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#8f6f2d] text-gray-900" />
                </div>

                <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-700">Analytical Range Horizon</label>
                    <select value={range} onChange={(e) => setRange(e.target.value)} className="w-full p-2 rounded border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#8f6f2d] text-gray-900">
                        <option value="1D">1 Day</option>
                        <option value="1M">1 Month</option>
                        <option value="1Y">1 Year</option>
                    </select>
                </div>

                <div className="md:grid-column-span-2">
                    <label className="block text-xs font-semibold mb-1 text-gray-700">Analytical Impact Note</label>
                    <input type="text" required value={impact} onChange={(e) => setImpact(e.target.value)} placeholder="e.g., Decreased discretionary cash" className="w-full p-2 rounded border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#8f6f2d] text-gray-900" />
                </div>

                <button type="submit" disabled={isSubmitting} className="md:col-span-2 bg-[#1d211c] hover:bg-[#343b32] text-[#fbf7ef] p-3 rounded font-bold transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isSubmitting ? 'Recording Entry...' : 'Add Transaction Entry'}
                </button>
            </form>
        </div>
    );
}
