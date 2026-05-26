import CalendarGrid from "@/components/CalendarGrid";

export default function Home() {
    return (
        <main className="min-h-screen bg-[#f4efe6] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight font-display sm:text-5xl">
                    Financial Management Deck
                </h1>
                <p className="mt-2 text-sm text-[#696154]">
                    Predictive Cash-flow & Automated Ledger Tracking
                </p>
            </div>

            <CalendarGrid />
        </main>
    );
}