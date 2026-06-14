"use client";

type FeedTab = "following" | "global";

interface FeedTabsProps {
  active: FeedTab;
  onChange: (tab: FeedTab) => void;
}

export function FeedTabs({ active, onChange }: FeedTabsProps) {
  return (
    <div className="relative flex border-b border-zinc-800">
      {(["following", "global"] as FeedTab[]).map((tab) => {
        const isActive = active === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={[
              "flex-1 py-3 text-sm font-medium tracking-wide transition-colors",
              isActive
                ? "text-white"
                : "text-zinc-500 hover:text-zinc-300",
            ].join(" ")}
          >
            {tab === "following" ? "Following" : "Discover"}
          </button>
        );
      })}

      {/* Sliding underline indicator */}
      <span
        aria-hidden
        className={[
          "absolute bottom-0 h-0.5 w-1/2 bg-emerald-400 transition-transform duration-200",
          active === "global" ? "translate-x-full" : "translate-x-0",
        ].join(" ")}
      />
    </div>
  );
}