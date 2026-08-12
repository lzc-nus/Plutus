"use client";

import { useEffect, useState } from "react";
import {
  CashflowButterflyChart,
  MetricCard,
  RiskScoreCard,
  SectionHeader,
  UpcomingEventsCard,
} from "@/components/WealthComponents";
import {
  calendarEventsList,
  CalendarEventRead,
  portfolioAssetsList,
  portfolioLiabilitiesList,
  transactionsList,
} from "@/lib/api/generated";
import { useLatestInsight } from "@/lib/insightStorage";
import { formatCurrency, formatCurrencyWithCents } from "@/lib/format";

const TOP_CATEGORY_COUNT = 5;
const UPCOMING_WINDOW_DAYS = 14;

type CashflowItem = {
  id: string;
  label: string;
  value: number;
  percentage: number;
};

type LiabilityRow = {
  id: string;
  name: string;
  category: string;
  balance: number;
  interestRate: number | null;
};

type TransactionRow = {
  id: string;
  description: string;
  date: string;
  category: string;
  account: string;
  amount: number;
};

type OverviewState = {
  loading: boolean;
  error: string | null;
  netWorth: number;
  totalLiabilities: number;
  monthlyRepayment: number;
  liabilities: LiabilityRow[];
  inflowTotal: number;
  outflowTotal: number;
  inflowBreakdown: CashflowItem[];
  outflowBreakdown: CashflowItem[];
  recentMovements: TransactionRow[];
  upcomingEvents: CalendarEventRead[];
};

const INITIAL_STATE: OverviewState = {
  loading: true,
  error: null,
  netWorth: 0,
  totalLiabilities: 0,
  monthlyRepayment: 0,
  liabilities: [],
  inflowTotal: 0,
  outflowTotal: 0,
  inflowBreakdown: [],
  outflowBreakdown: [],
  recentMovements: [],
  upcomingEvents: [],
};

export default function OverviewPage() {
  const [state, setState] = useState<OverviewState>(INITIAL_STATE);
  const latestInsight = useLatestInsight()?.insight ?? null;

  useEffect(() => {
    async function loadOverview() {
      setState((prev) => ({ 
        ...prev, 
        loading: true, 
        error: null, 
      }));

      const now = new Date();
      const windowEnd = new Date(now);
      windowEnd.setDate(windowEnd.getDate() + UPCOMING_WINDOW_DAYS);

      try {
        const [assetsRes, liabilitiesRes, transactionsRes, eventsRes] =
          await Promise.all([
            portfolioAssetsList(),
            portfolioLiabilitiesList(),
            transactionsList({ query: { range: "1M" } }),
            calendarEventsList({
              query: {
                start_window: now.toISOString(),
                end_window: windowEnd.toISOString(),
              },
            }),
          ]);

        const assets = assetsRes.data ?? [];
        const liabilities = liabilitiesRes.data ?? []
        const transactions = (transactionsRes.data ?? []).map((transaction) => ({
          ...transaction,
          amount: Number(transaction.amount),
        }));
        const events = eventsRes.data ?? [];

        const totalAssets = assets.reduce(
          (sum, asset) => sum + Number(asset.value),
          0,
        );

        const totalLiabilities = liabilities.reduce(
          (sum, liability) => sum + Number(liability.balance),
          0,
        );

        const monthlyRepayment = liabilities.reduce(
          (sum, liability) => sum + Number(liability.monthly_payment ?? 0),
          0,
        );

        const liabilityRows: LiabilityRow[] = liabilities
          .slice()
          .sort((a, b) => Number(b.balance) - Number(a.balance))
          .slice(0, 5)
          .map((liability) => ({
            id: liability.id,
            name: liability.name,
            category: liability.category,
            balance: Number(liability.balance),
            interestRate:
              liability.interest_rate != null
                ? Number(liability.interest_rate)
                : null,
          }));

        const inflow = groupByCategory(transactions, "inflow");
        const outflow = groupByCategory(transactions, "outflow");
        const totalCashflow = inflow.rawTotal + outflow.rawTotal;

        const inflowBreakdown = assignPercentages(inflow.items, totalCashflow);
        const outflowBreakdown = assignPercentages(outflow.items, totalCashflow);

        // top 5 LATEST transactions
        const recentMovements: TransactionRow[] = transactions
          .slice(0, 5)
          .map((transaction) => ({
            id: transaction.id,
            description: transaction.description,
            date: formatShortDate(transaction.occurred_at),
            category: transaction.category,
            account: transaction.account,
            amount: transaction.amount,
          }));

        const upcomingEvents = events.slice(0, 5);

        setState({
          loading: false,
          error: null,
          netWorth: totalAssets - totalLiabilities,
          totalLiabilities,
          monthlyRepayment,
          liabilities: liabilityRows,
          inflowTotal: inflow.rawTotal,
          outflowTotal: outflow.rawTotal,
          inflowBreakdown,
          outflowBreakdown,
          recentMovements,
          upcomingEvents,
        });
      } catch {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Couldn't load your overview. Try refreshing.",
        }));
      }
    }

    loadOverview();
  }, []);

  return (
    <div className="grid gap-6">
      {state.error ? (
        <section className="rounded-lg border border-[#d9b3a3] bg-[#fbf1ee] p-6 text-sm text-[#8f3f32]">
          {state.error}
        </section>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          dominant
          label="Net Worth"
          sublabel="Total assets less total liabilities"
          value={state.loading 
            ? "-" 
            : formatCurrency(state.netWorth)}
        />

        <MetricCard
          label="Total Liabilities"
          sublabel="Outstanding balance across all obligations"
          value={state.loading 
            ? "-" 
            : formatCurrency(state.totalLiabilities)}
        />

        <MetricCard
          label="Monthly Repayment"
          sublabel="Committed monthly debt service"
          value={state.loading 
            ? "-" 
            : formatCurrency(state.monthlyRepayment)}
        />
      </section>

      <UpcomingEventsCard
        events={state.upcomingEvents}
        loading={state.loading}
      />

      {latestInsight ? (
        <RiskScoreCard
          label={latestInsight.label}
          score={latestInsight.score}
          summary={latestInsight.executive_summary}
        />
      ) : (
        <section className="rounded-lg border border-dashed border-[#d0c5b3] bg-[#f4efe6] p-6">
          <SectionHeader
            description="Generate an insight report to bring the latest risk score into this overview."
            eyebrow="Risk score"
            title="No saved insight"
          />
        </section>
      )}

      <CashflowButterflyChart
        outflowItems={state.outflowBreakdown}
        outflowTotal={state.outflowTotal}
        inflowItems={state.inflowBreakdown}
        inflowTotal={state.inflowTotal}
        outflowColors={[
          "#9b5548", 
          "#b99a52", 
          "#6f7568", 
          "#5d4e3e", 
          "#c8b58a", 
          "#8a8173",
        ]}
        inflowColors={[
          "#33483d", 
          "#5f725e", 
          "#b99a52", 
          "#c8b58a", 
          "#8a8173",
        ]}
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 sm:p-7">
          <SectionHeader
            description="Liabilities are treated as commitments, not alarms. The goal is to preserve optionality and avoid expensive debt drag."
            eyebrow="Liabilities"
            title={state.loading 
              ? "-" 
              : formatCurrency(state.totalLiabilities)}
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[#756d60]">
                Monthly repayment
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {state.loading 
                  ? "-" 
                  : formatCurrency(state.monthlyRepayment)}
              </p>
            </div>

            <div>
              <p className="text-sm text-[#756d60]">
                Obligations tracked
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {state.liabilities.length}
              </p>
            </div>
          </div>

          <div className="mt-6 divide-y divide-[#e2dacd]">
            {state.liabilities.map((liability) => (
              <div
                className="grid grid-cols-[1fr_auto] gap-4 py-3 text-sm"
                key={liability.id}
              >
                <div>
                  <p className="font-semibold">
                    {liability.name}
                  </p>

                  <p className="mt-1 text-[#756d60]">
                    {formatCategoryLabel(liability.category)}
                    {liability.interestRate !== null
                      ? ` - ${liability.interestRate}% APR`
                      : ""}
                  </p>
                </div>

                <p className="font-semibold">
                  {formatCurrency(liability.balance)}
                </p>
              </div>
            ))}

            {!state.loading && state.liabilities.length === 0 ? (
              <p className="py-3 text-sm text-[#756d60]">
                No liabilities recorded yet.
              </p>
            ) : null}
          </div>
        </article>

        <article className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 sm:p-7">
          <SectionHeader 
            eyebrow="Recent movements" 
            title="Account activity" 
          />

          <div className="mt-6 divide-y divide-[#e2dacd]">
            {state.recentMovements.map((movement) => (
              <div
                className="grid grid-cols-[1fr_auto] gap-4 py-3 text-sm"
                key={movement.id}
              >
                <div>
                  <p className="font-semibold">
                    {movement.description}
                  </p>

                  <p className="mt-1 text-[#756d60]">
                    {movement.date} - {movement.category} - {movement.account}
                  </p>
                </div>

                <p
                  className={`font-semibold ${
                    movement.amount > 0 
                      ? "text-[#1f6b48]" 
                      : "text-[#8f3f32]"
                  }`}
                >
                  {formatCurrencyWithCents(movement.amount)}
                </p>
              </div>
            ))}

            {!state.loading && state.recentMovements.length === 0 ? (
              <p className="py-3 text-sm text-[#756d60]">
                No transactions in the last 30 days.
              </p>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}

function groupByCategory(
  transactions: { category: string; amount: number }[],
  direction: "inflow" | "outflow",
): { 
  items: { id: string; label: string; value: number }[]; 
  rawTotal: number 
} {
  const filtered = transactions.filter((transaction) =>
    direction === "inflow" 
      ? transaction.amount > 0 
      : transaction.amount < 0,
  );

  const totals = new Map<string, number>();

  for (const transaction of filtered) {
    const amount = Math.abs(transaction.amount);

    totals.set(
      transaction.category, 
      (totals.get(transaction.category) ?? 0) + amount,
    );
  }

  const sorted = Array.from(totals.entries()).sort(
    (a, b) => b[1] - a[1],
  );

  const top = sorted.slice(0, TOP_CATEGORY_COUNT);
  const rest = sorted.slice(TOP_CATEGORY_COUNT);

  const restTotal = rest.reduce(
    (sum, [, value]) => sum + value, 
    0
  );

  const rawTotal = top.reduce(
    (sum, [, value]) => sum + value, 
    0
  ) + restTotal;

  const items = [
    ...top.map(([category, value]) => ({
      id: category,
      label: formatCategoryLabel(category),
      value,
    })),
    ...(restTotal > 0 
      ? [
          { 
            id: "other", 
            label: "Other", 
            value: restTotal, 
          },
        ] 
      : []),
  ];

  return { items, rawTotal };
}

function assignPercentages(
  items: { id: string; label: string; value: number }[],
  total: number,
): CashflowItem[] {
  return items.map((item) => ({
    ...item,
    percentage: 
      total > 0 
        ? Math.round((item.value / total) * 1000) / 10 
        : 0,
  }));
}

function formatCategoryLabel(category: string): string {
  return category
    .split("_")
    .map(
      (word) => 
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
