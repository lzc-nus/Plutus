'use client';

export default function Header() {
    return (
        <header className="bg-white shadow px-6 py-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Welcome</h1>
                <div className="flex items-center gap-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}
