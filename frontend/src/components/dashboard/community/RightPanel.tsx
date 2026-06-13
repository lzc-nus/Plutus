"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dashboardTips } from "@/data/dashboardTips";
import { MarketSnapshot } from "@/components/dashboard/community/MarketSnapshot";

const TIP_ROTATION_INTERVAL_MS = 60_000;

function getNextTipIndex(current: number, total: number): number {
  if (total <= 1) return current;
  const next = Math.floor(Math.random() * total);
  return next === current ? (next + 1) % total : next;
}

function DashboardTip() {
  const [tipIndex, setTipIndex] = useState(0);
  const activeTip = dashboardTips[tipIndex] ?? dashboardTips[0];

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      setTipIndex((i) => getNextTipIndex(i, dashboardTips.length));
    }, 500);
    const rotationTimer = window.setInterval(() => {
      setTipIndex((i) => getNextTipIndex(i, dashboardTips.length));
    }, TIP_ROTATION_INTERVAL_MS);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(rotationTimer);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500 dark:text-[#d8bd75]">
        {activeTip.title}
      </p>
      <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-[#a99b82]">
        {activeTip.body}
      </p>
    </div>
  );
}

function BookmarkIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function RightPanel() {
  return (
    <aside className="hidden w-80 shrink-0 xl:block">
      <div className="sticky top-0 flex flex-col gap-4 px-5 py-5">
        <Link
          href="/dashboard/community/saved"
          className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <BookmarkIcon />
          Saved posts
        </Link>
        <MarketSnapshot />
        <DashboardTip />
      </div>
    </aside>
  );
}