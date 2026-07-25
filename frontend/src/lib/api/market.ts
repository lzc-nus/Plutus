import { marketSnapshot, marketCandles, marketWatchlistGet, marketWatchlistSet, marketWatchlistAddSymbol, marketWatchlistRemoveSymbol } from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";
import * as generatedApi from "@/lib/api/generated";
console.log("generated api:", generatedApi);

export interface QuoteResult {
  symbol: string;
  shortName: string;
  price: number;
  change: number;
  changePercent: number;
}

export async function getMarketSnapshot(symbols?: string[]): Promise<QuoteResult[]> {
  configureApiClient();
  const res = await marketSnapshot(
    symbols?.length ? { query: { symbols } } : undefined,
  );
  if (res.error) {
    throw new Error("Unable to load market snapshot.");
  }
  return (res.data ?? []) as QuoteResult[];
}

export async function getCandles(symbol: string, days = 7): Promise<number[]> {
  configureApiClient();
  const res = await marketCandles({ path: { symbol }, query: { days } });
  if (res.error) {
    throw new Error("Unable to load market candles.");
  }
  return (res.data ?? []) as number[];
}

/**
 * Fetches the authenticated user's watchlist from the backend.
 */
export async function getWatchlist(): Promise<string[]> {
  configureApiClient();
  const res = await marketWatchlistGet();
  return (res.data?.symbols ?? []) as string[];
}

/**
 * Replaces the authenticated user's watchlist with the given symbols.
 */
export async function setWatchlist(symbols: string[]): Promise<void> {
  configureApiClient();
  await marketWatchlistSet({ body: { symbols } });
}

/**
 * Adds a single symbol to the authenticated user's watchlist.
 */
export async function addWatchlistSymbol(symbol: string): Promise<string[]> {
  console.log("addWatchlistSymbol called", symbol);
  configureApiClient();
  const res = await marketWatchlistAddSymbol({ body: { symbol } });
  return (res.data?.symbols ?? []) as string[];
}

/**
 * Removes a single symbol from the authenticated user's watchlist.
 */
export async function removeWatchlistSymbol(symbol: string): Promise<string[]> {
  configureApiClient();
  const res = await marketWatchlistRemoveSymbol({ path: { symbol } });
  return (res.data?.symbols ?? []) as string[];
}