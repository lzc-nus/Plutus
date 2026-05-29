"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  MetricCard,
  SectionHeader,
  TransactionList,
  TransactionRangeToggle,
} from "@/components/wealth-components";
import { financialSnapshot, transactions, type TransactionRange } from "@/data/wealthData";
import { formatCurrency, formatCurrencyWithCents } from "@/lib/format";

export default function TransactionsPage() {
  const [range, setRange] = useState<TransactionRange>("1M");
  const visibleTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.range.includes(range)),
    [range],
  );
  const netMovement = visibleTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );

  return (
    <div className="grid gap-6">
      <section className="flex flex-col justify-between gap-4 rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 shadow-[0_24px_90px_rgba(43,34,24,0.08)] sm:flex-row sm:items-end sm:p-8">
        <SectionHeader
          description="Trace the financial movements that explain how your position changes."
          eyebrow="Ledger"
          title="Transactions"
        />
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md bg-[#1d211c] px-4 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343b32]"
          href="/dashboard/transactions/new"
        >
          New transaction
        </Link>
      </section>

      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          dominant
          label="Visible Movement"
          sublabel="Net change in the selected range"
          value={formatCurrencyWithCents(netMovement)}
        />
        <MetricCard
          label="Monthly Inflow"
          sublabel="Recorded income before obligations"
          value={formatCurrency(financialSnapshot.inflow)}
        />
        <MetricCard
          label="Monthly Outflow"
          sublabel="Commitments and spending"
          value={formatCurrency(financialSnapshot.outflow)}
        />
      </section>

      <section className="grid gap-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeader
            description="Switch between daily, monthly, and annual movement views."
            eyebrow="Transaction record"
            title="Movements and risk tags"
          />
          <TransactionRangeToggle onChange={setRange} value={range} />
        </div>
        <TransactionList transactions={visibleTransactions} />
      </section>
    </div>
  );
}
