"use client";

export type CalendarViewMode = "day" | "week" | "month" | "year";

const VIEW_OPTIONS: { label: string; value: CalendarViewMode }[] = [
    { label: "Day", value: "day" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
    { label: "Year", value: "year" },
];

interface CalendarViewSwitcherProps {
    view: CalendarViewMode;
    onChange: (view: CalendarViewMode) => void;
}

export function CalendarViewSwitcher({ view, onChange }: CalendarViewSwitcherProps) {
    return (
        <div className="inline-flex shrink-0 rounded-md border border-[#d9d0c1] bg-[#f5efe4] p-0.5">
            {VIEW_OPTIONS.map((option) => {
                const isActive = option.value === view;
                return (
                    <button
                        key={option.value}
                        className={`h-8 rounded-[5px] px-3 text-xs font-bold transition ${
                            isActive
                                ? "bg-[#1d211c] text-[#fbf7ef]"
                                : "text-[#1d211c] hover:bg-[#e9e1d0]"
                        }`}
                        onClick={() => onChange(option.value)}
                        type="button"
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}