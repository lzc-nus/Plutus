'use client';

import { useRouter } from "next/navigation";
import { user } from "@/data/wealthData";

export default function Header() {
    const router = useRouter();

    function handleLogout() {
        localStorage.removeItem("plutus_access_token");
        router.replace("/login");
    }

    return (
        <header className="bg-white shadow px-6 py-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Welcome to Plutus, {user.name}!</h1>
                <div className="flex items-center gap-4">
                    <button 
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}
