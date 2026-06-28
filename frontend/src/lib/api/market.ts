import { marketSnapshot, marketCandles } from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";

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
