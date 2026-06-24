"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMarketSnapshot, getCandles, type QuoteResult } from "@/lib/api/market";
import { SparklineChart } from "@/components/community/SparklineChart";

const DEFAULT_SYMBOLS = ["SPY", "QQQ", "BTC-USD", "ETH-USD", "GLD"];
const STORAGE_KEY = "plutus_watchlist";

function loadWatchlist(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return normalizeWatchlist(stored ? JSON.parse(stored) : DEFAULT_SYMBOLS);
  } catch {
    return DEFAULT_SYMBOLS;
  }
}

function saveWatchlist(symbols: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
}

export function MarketSnapshot() {
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);
  const [candles, setCandles] = useState<Record<string, number[]>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [addInput, setAddInput] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Load watchlist from localStorage on mount
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    if (typeof window === "undefined") return DEFAULT_SYMBOLS;
    return loadWatchlist();
  });

  const loadQuotes = useCallback(async (symbols: string[]) => {
    try {
      const data = await getMarketSnapshot(symbols);
      if (!mountedRef.current) return;
      setQuotes(data);
      setLastUpdated(new Date());
      setStatus("ready");
    } catch {
      if (!mountedRef.current) return;
      setStatus("error");
    }
  }, []);

  const loadCandles = useCallback(async (symbols: string[]) => {
    const entries = await Promise.all(
      symbols.map(async (symbol) => {
        const prices = await getCandles(symbol).catch(() => []);
        return [symbol, prices] as [string, number[]];
      })
    );
    if (!mountedRef.current) return;
    setCandles(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      await loadQuotes(watchlist);
      await loadCandles(watchlist);
    })();

    const interval = setInterval(() => {
      (async () => { await loadQuotes(watchlist); })();
    }, 60_000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [watchlist, loadQuotes, loadCandles]);

  function handleRefresh() {
    loadQuotes(watchlist);
    loadCandles(watchlist);
  }

  function handleAddSymbol() {
    const symbol = normalizeSymbol(addInput);
    if (!symbol) return;
    if (watchlist.includes(symbol)) {
      setAddError("Already in watchlist.");
      return;
    }
    if (watchlist.length >= 10) {
      setAddError("Max 10 symbols.");
      return;
    }
    const next = [...watchlist, symbol];
    setWatchlist(next);
    saveWatchlist(next);
    setAddInput("");
    setAddError(null);
  }

  function handleRemoveSymbol(symbol: string) {
    const next = watchlist.filter((s) => s !== symbol);
    setWatchlist(next);
    saveWatchlist(next);
    setQuotes((prev) => prev.filter((q) => q.symbol !== symbol));
    setCandles((prev) => {
      const next = { ...prev };
      delete next[symbol];
      return next;
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#d7c6a3]/30 bg-white/60">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#d7c6a3]/30 px-4 py-3">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b6252]">
          Watchlist
        </span>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-[#a99b82]">
              {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={status === "loading"}
            aria-label="Refresh"
            className="rounded-full p-1 text-[#a99b82] transition-colors hover:bg-[#f0e8d8] hover:text-[#6b6252] disabled:opacity-40"
          >
            <RefreshIcon spinning={status === "loading"} />
          </button>
        </div>
      </div>

      {/* Quotes */}
      <div className="flex flex-col divide-y divide-[#d7c6a3]/20">
        {status === "loading" && quotes.length === 0 &&
          Array.from({ length: watchlist.length || 5 }).map((_, i) => (
            <QuoteSkeleton key={i} />
          ))
        }

        {status === "error" && quotes.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-5">
            <p className="text-xs text-[#a99b82]">Failed to load market data.</p>
            <button onClick={handleRefresh} className="text-xs text-[#d8bd75] hover:underline">
              Try again
            </button>
          </div>
        )}

        {quotes.map((q) => (
          <QuoteRow
            key={q.symbol}
            quote={q}
            sparkline={candles[q.symbol] ?? []}
            onRemove={() => handleRemoveSymbol(q.symbol)}
          />
        ))}
      </div>

      {/* Add symbol input */}
      <div className="border-t border-[#d7c6a3]/20 px-4 py-3">
        <div className="flex gap-2">
          <input
            value={addInput}
            onChange={(e) => { setAddInput(e.target.value); setAddError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddSymbol(); }}
            placeholder="Add symbol e.g. AAPL"
            className="min-w-0 flex-1 rounded-lg border border-[#d7c6a3]/50 bg-white px-3 py-1.5 text-xs text-[#2c2c24] placeholder:text-[#a99b82] focus:border-[#d8bd75]/60 focus:outline-none"
          />
          <button
            onClick={handleAddSymbol}
            className="rounded-lg bg-[#d8bd75] px-3 py-1.5 text-xs font-medium text-[#1c2018] transition-colors hover:bg-[#c9ad65]"
          >
            Add
          </button>
        </div>
        {addError && (
          <p className="mt-1 text-[10px] text-rose-500">{addError}</p>
        )}
        <p className="mt-2 text-[10px] text-[#a99b82]">
          Prices delayed by Yahoo Finance
        </p>
      </div>
    </div>
  );
}

// ── QuoteRow ──────────────────────────────────────────────────────────────────

function QuoteRow({
  quote,
  sparkline,
  onRemove,
}: {
  quote: QuoteResult;
  sparkline: number[];
  onRemove: () => void;
}) {
  const positive = quote.change >= 0;

  return (
    <div className="group flex items-center gap-2 px-4 py-2.5">
      {/* Symbol + name */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#1c2018]">
          {quote.symbol.replace("-USD", "")}
        </p>
        <p className="truncate text-[11px] text-[#a99b82]">
          {truncateName(quote.shortName)}
        </p>
      </div>

      {/* Sparkline */}
      <div className="shrink-0">
        <SparklineChart prices={sparkline} width={64} height={28} />
      </div>

      {/* Price + change */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-medium tabular-nums text-[#1c2018]">
          {formatPrice(quote.price)}
        </p>
        <p className={[
          "text-[11px] font-medium tabular-nums",
          positive ? "text-emerald-600" : "text-rose-500",
        ].join(" ")}>
          {positive ? "+" : "-"}{Math.abs(quote.changePercent).toFixed(2)}%
        </p>
      </div>

      {/* Remove button — hover only */}
      <button
        onClick={onRemove}
        aria-label={`Remove ${quote.symbol}`}
        className="ml-1 shrink-0 rounded-full p-0.5 text-[#d7c6a3] opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
      >
        <RemoveIcon />
      </button>
    </div>
  );
}

// ── QuoteSkeleton ─────────────────────────────────────────────────────────────

function QuoteSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 px-4 py-2.5">
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-3 w-12 rounded bg-[#e8dfc8]" />
        <div className="h-2.5 w-20 rounded bg-[#e8dfc8]" />
      </div>
      <div className="h-7 w-16 rounded bg-[#e8dfc8]" />
      <div className="flex flex-col items-end gap-1.5">
        <div className="h-3 w-14 rounded bg-[#e8dfc8]" />
        <div className="h-2.5 w-10 rounded bg-[#e8dfc8]" />
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

function RemoveIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

function truncateName(name: string): string {
  return name.length > 18 ? `${name.slice(0, 18)}...` : name;
}

function normalizeSymbol(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9._=\-]/g, "");
}

function normalizeWatchlist(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return DEFAULT_SYMBOLS;
  }

  const symbols = value
    .map((item) => normalizeSymbol(String(item)))
    .filter(Boolean);

  const uniqueSymbols = Array.from(new Set(symbols)).slice(0, 10);
  return uniqueSymbols.length > 0 ? uniqueSymbols : DEFAULT_SYMBOLS;
}
