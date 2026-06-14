export interface QuoteResult {
  symbol: string;
  shortName: string;
  price: number;
  change: number;
  changePercent: number;
}

/**
 * Fetches quotes for all market snapshot symbols in parallel.
 * Returns only the successfully fetched ones — partial failures are silently dropped.
 */
export async function getMarketSnapshot(): Promise<QuoteResult[]> {
  const res = await fetch("/lib/api/market");
  if (!res.ok) return [];
  return res.json();
}