'use client';

import Link from 'next/link';

export default function Sidebar() {
    return (
        <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col">
            <div className="p-6 border-b border-gray-700">
                <h1 className="text-2xl font-bold">Plutus</h1>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                <Link href="/dashboard" className="block px-4 py-2 rounded hover:bg-gray-800">Dashboard</Link>
                <Link href="/dashboard/portfolio" className="block px-4 py-2 rounded hover:bg-gray-800">Portfolio</Link>
                <Link href="/dashboard/transactions" className="block px-4 py-2 rounded hover:bg-gray-800">Transactions</Link>
                <Link href="/dashboard/calendar" className="block px-4 py-2 rounded hover:bg-gray-800">Calendar</Link>
                <Link href="/dashboard/ai" className="block px-4 py-2 rounded hover:bg-gray-800">AI Assistant</Link>
                <Link href="/dashboard/settings" className="block px-4 py-2 rounded hover:bg-gray-800">Settings</Link>
            </nav>
        </aside>
    );
}
