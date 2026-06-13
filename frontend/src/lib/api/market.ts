import { NextResponse } from "next/server";

const SYMBOLS = ["SPY", "QQQ", "BTC-USD", "ETH-USD", "GLD"];

async function fetchQuote(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;

  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) return null;

  const price: number = meta.regularMarketPrice ?? 0;
  const prevClose: number = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - prevClose;
  const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;

  return {
    symbol,
    shortName: meta.shortName ?? meta.symbol ?? symbol,
    price,
    change,
    changePercent,
  };
}

export async function GET() {
  const results = await Promise.all(SYMBOLS.map(fetchQuote));
  const quotes = results.filter(Boolean);
  return NextResponse.json(quotes);
}