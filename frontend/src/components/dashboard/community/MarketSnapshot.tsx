"use client";

import { useEffect, useState, useRef } from "react";
import { getMarketSnapshot, type QuoteResult } from "@/data/market";

export function MarketSnapshot() {
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function fetchData() {
      try {
        const data = await getMarketSnapshot();
        if (!mountedRef.current) return;
        setQuotes(data);
        setLastUpdated(new Date());
        setStatus("ready");
      } catch {
        if (!mountedRef.current) return;
        setStatus("error");
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 60_000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  function handleRefresh() {
    getMarketSnapshot()
      .then((data) => {
        setQuotes(data);
        setLastUpdated(new Date());
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  return (
    <div className="rounded-2xl borsder border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Market
        </span>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-zinc-400">
              {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={status === "loading"}
            aria-label="Refresh market data"
            className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <RefreshIcon spinning={status === "loading"} />
          </button>
        </div>
      </div>

      {/* Quotes */}
      <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {status === "loading" && quotes.length === 0 &&
          Array.from({ length: 5 }).map((_, i) => <QuoteSkeleton key={i} />)
        }

        {status === "error" && quotes.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-5">
            <p className="text-xs text-zinc-400">Failed to load market data.</p>
            <button
              onClick={handleRefresh}
              className="text-xs text-emerald-500 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {quotes.map((q) => (
          <QuoteRow key={q.symbol} quote={q} />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
        <p className="text-[10px] text-zinc-400">
          Prices delayed · Source: Yahoo Finance
        </p>
      </div>
    </div>
  );
}

// ── QuoteRow ──────────────────────────────────────────────────────────────────

function QuoteRow({ quote }: { quote: QuoteResult }) {
  const positive = quote.change >= 0;

  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      {/* Symbol + name */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {quote.symbol.replace("-USD", "")}
        </p>
        <p className="truncate text-xs text-zinc-400">
          {truncateName(quote.shortName)}
        </p>
      </div>

      {/* Price + change */}
      <div className="ml-3 shrink-0 text-right">
        <p className="text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-100">
          {formatPrice(quote.price)}
        </p>
        <p
          className={[
            "text-xs font-medium tabular-nums",
            positive ? "text-emerald-500" : "text-rose-500",
          ].join(" ")}
        >
          {positive ? "▲" : "▼"} {Math.abs(quote.changePercent).toFixed(2)}%
        </p>
      </div>
    </div>
  );
}

// ── QuoteSkeleton ─────────────────────────────────────────────────────────────

function QuoteSkeleton() {
  return (
    <div className="flex animate-pulse items-center justify-between px-4 py-2.5">
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-2.5 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-2.5 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      className={["h-3.5 w-3.5", spinning ? "animate-spin" : ""].join(" ")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

function truncateName(name: string): string {
  return name.length > 22 ? name.slice(0, 22) + "…" : name;
}