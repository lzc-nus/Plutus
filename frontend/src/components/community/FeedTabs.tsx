"use client";

type FeedTab = "following" | "global";

interface FeedTabsProps {
  active: FeedTab;
  onChange: (tab: FeedTab) => void;
}

export function FeedTabs({ active, onChange }: FeedTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Community feed"
      className="grid grid-cols-2 gap-1 rounded-md border border-[#d7c6a3]/45 bg-[#f4efe6] p-1"
    >
      {(["following", "global"] as FeedTab[]).map((tab) => {
        const isActive = active === tab;
        return (
          <button
            type="button"
            key={tab}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab)}
            className={[
              "h-9 rounded px-4 text-sm font-semibold transition",
              isActive
                ? "bg-[#fbf7ef] text-[#1c2018] shadow-[0_6px_18px_rgba(43,34,24,0.08)]"
                : "text-[#7c7468] hover:bg-[#fbf7ef]/60 hover:text-[#1c2018]",
            ].join(" ")}
          >
            {tab === "following" ? "Following" : "Discover"}
          </button>
        );
      })}
    </div>
  );
}
