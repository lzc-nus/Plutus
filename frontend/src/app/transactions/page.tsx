'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AddTransactionForm from '@/components/AddTransactionForm';

interface Transaction {
    id: string;
    date: string;
    time: string;
    description: string;
    category: string;
    account: string;
    amount: number;
    impact: string;
    range: string[];
}

export default function TransactionsLedger() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Track the component's mounted status to avoid setting state on unmounted trees
    const isMounted = useRef<boolean>(true);

    // Whenever the form successfully logs a new record,
    // it automatically updates the table data.
    // Wrapped in useCallback so its reference doesn't change on every render.
    const loadTransactions = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:8000/api/transactions/');

            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // A defensive programming pattern designed to prevent memory leaks and race conditions.
            // Without checking if the component is still there,
            // React will try to update state on a component that no longer exists in the browser window.
            // While it doesn't crash, it's still a waste of memory and processing power.
            if (isMounted.current) {
                setTransactions(data);
                setError(null);
            }
        } catch (err) {
            console.error("Ledger fetch error:", err);
            if (isMounted.current) {
                setError("Could not load financial data.");
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        isMounted.current = true;
        
        const initFetch = async () => {
            await loadTransactions();
        };

        initFetch();

        return () => {
            isMounted.current = false;
        };
    }, [loadTransactions]);

    if (isLoading) {
        return <p className="p-8 font-sans text-gray-600">Loading financial ledger...</p>;
    }

    if (error) {
        return (
            <div className="p-8 text-red-600 font-sans">
                <p><strong>Error:</strong> {error}</p>
            </div>
        );
    }

    return (
        <main className="p-8 max-w-5xl mx-auto font-sans">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight font-display">Transactions Ledger</h1>
                <p className="text-gray-500 mt-1">Real-time wealth management streams</p>
            </header>

            <AddTransactionForm onTransactionAdded={loadTransactions} />

            {transactions.length === 0 ? (
                <p className="text-gray-500 italic">No transactions recorded yet.</p>
            ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                    <table className="w-full border-collapse text-left bg-white text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 font-medium">
                                <th className="p-4">Date</th>
                                <th className="p-4">Description</th>
                                <th className="p-4">Account</th>
                                <th className="p-4">Category</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map((tx) => {
                                const isIncome = tx.amount > 0;
                                return (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-gray-600 whitespace-nowrap">{tx.date}</td>
                                        <td className="p-4">
                                            <div className="font-semibold text-gray-900">{tx.description}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{tx.impact}</div>
                                        </td>
                                        <td className="p-4 text-gray-500 whitespace-nowrap">{tx.account}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {tx.category}
                                            </span>
                                        </td>
                                        <td className={`p-4 text-right font-bold whitespace-nowrap ${isIncome ? 'text-[#1f6b48]' : 'text-[#8f3f32]'}`}>
                                            {isIncome ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}