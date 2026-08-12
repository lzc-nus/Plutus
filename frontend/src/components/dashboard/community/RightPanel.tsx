"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dashboardTips } from "@/data/dashboardTips";
import { MarketSnapshot } from "@/components/dashboard/community/MarketSnapshot";

const TIP_ROTATION_INTERVAL_MS = 60_000;

function getNextTipIndex(current: number, total: number): number {
  if (total <= 1) {
    return current;
  }

  const next = Math.floor(Math.random() * total);

  return next === current ? (next + 1) % total : next;
}

function DashboardTip() {
  const [tipIndex, setTipIndex] = useState(0);
  const activeTip = dashboardTips[tipIndex] ?? dashboardTips[0];

  useEffect(() => {
      const initialTimer = window.setTimeout(() => {
        setTipIndex(index => 
          getNextTipIndex(index, dashboardTips.length)
        );
      }, 500);
  
      const rotationTimer = window.setInterval(() => {
        setTipIndex(index => 
          getNextTipIndex(index, dashboardTips.length)
        );
      }, TIP_ROTATION_INTERVAL_MS);
  
      return () => {
        window.clearTimeout(initialTimer);
        window.clearInterval(rotationTimer);
      };
  }, []);

  return (
    <div
      aria-live="polite"
      className="rounded-xl border border-[#d7c6a3]/30 bg-white/60 px-4 py-3"
    >
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[#d8bd75]">
        {activeTip.title}
      </p>
      
      <p className="mt-1 text-xs leading-5 text-[#a99b82]">
        {activeTip.body}
      </p>
    </div>
  );
}

export function RightPanel() {
  return (
    <aside className="hidden w-[420px] shrink-0 xl:block">
      <div className="sticky top-0 flex flex-col gap-3 px-5 py-5">

        {/* Saved posts link */}
        <Link
          href="/dashboard/community/saved"
          className="flex items-center gap-3 rounded-xl border border-[#d7c6a3]/40 bg-white/60 px-4 py-3 text-sm font-medium text-[#6b6252] transition-colors hover:border-[#d8bd75]/40 hover:bg-white hover:text-[#1c2018]"
        >
          <BookmarkIcon />
          Saved posts
        </Link>

        {/* Market snapshot */}
        <MarketSnapshot />

        {/* Dashboard tip */}
        <DashboardTip />
      </div>
    </aside>
  );
}

function BookmarkIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}