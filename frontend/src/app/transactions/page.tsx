'use client';

import { useState, useEffect } from 'react';

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

    useEffect(() => {
        async function loadTransactions() {
            try {
                setIsLoading(true);
                const response = await fetch("http://localhost:8000/api/transactions/");

                if (!response.ok) {
                    throw new Error('Failed to fetch: ${response.status} ${response.statusText}');
                }

                const data = await response.json();
                setTransactions(data);
            } catch (err) {
                console.error('Ledger fetch error:', err);
                setError('Could not load financial data.');
            } finally {
                setIsLoading(false);
            }
        }

        loadTransactions();
    }, []);

    if (isLoading) return <p style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Loading financial ledger...</p>;
    if (error) return <div style={{ padding: '2rem', color: '#dc2626', fontFamily: 'sans-serif' }}><p><strong>Error:</strong> {error}</p></div>;

    return (
        <main style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#111827' }}>Transactions Ledger</h1>
                <p style={{ color: '#4b5563' }}>Real-time wealth management streams</p>
            </header>

            {transactions.length === 0 ? (
                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No transactions recorded yet.</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#374151', fontSize: '0.875rem' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Account</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx) => {
                            const isIncome = tx.amount > 0;
                            return (
                                <tr key={tx.id} style={{ borderBottom: '1px solid #f3f4f6', fontSize: '0.95rem' }}>
                                    <td style={{ padding: '1rem' }}>{tx.date}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div><strong>{tx.description}</strong></div>
                                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{tx.impact}</div>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#4b5563' }}>{tx.account}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                            {tx.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: isIncome ? '#16a34a' : '#dc2626' }}>
                                        {isIncome ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </main>
    );
}