import { marketSnapshot, marketCandles } from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";

export interface QuoteResult {
  symbol: string;
  shortName: string;
  price: number;
  change: number;
  changePercent: number;
}

export async function getMarketSnapshot(): Promise<QuoteResult[]> {
  configureApiClient();
  const res = await marketSnapshot();
  return (res.data ?? []) as QuoteResult[];
}

export async function getCandles(symbol: string, days = 7): Promise<number[]> {
  configureApiClient();
  const res = await marketCandles({ path: { symbol }, query: { days } });
  return (res.data ?? []) as number[];
}