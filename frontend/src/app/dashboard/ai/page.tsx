"use client";

import { useMemo, useState } from "react";
import {
  AIReportCard,
  SectionHeader,
  TransactionList,
  TransactionRangeToggle,
} from "@/components/WealthComponents";
import {
  aiReportSections,
  financialSnapshot,
  transactions,
  type TransactionRange,
} from "@/data/wealthData";

export default function AIPage() {
  const [range, setRange] = useState<TransactionRange>("ALL");
  const visibleTransactions = useMemo(
    () =>
      range === "ALL"
        ? transactions
        : transactions.filter((transaction) => transaction.range.includes(range)),
    [range],
  );

  return (
    <div className="grid gap-6">
      <section className="rounded-lg bg-[#1d211c] p-6 text-[#fbf7ef] sm:p-8">
        <p className="text-sm font-semibold uppercase text-[#c3a35d]">
          AI Insight
        </p>
        <h1 className="font-display mt-3 text-5xl font-semibold leading-tight">
          Private banking memo, generated from your financial record.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#d9d0c1]">
          Mock report today, structured for a future backend AI response
          tomorrow. The Overview risk score is sourced from this same report
          model.
        </p>
      </section>

      <section className="grid gap-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeader
            description="Switch between daily, monthly, annual, and all-time movements."
            eyebrow="Transaction record"
            title="Movements and risk tags"
          />
          <TransactionRangeToggle onChange={setRange} value={range} />
        </div>
        <TransactionList transactions={visibleTransactions} />
      </section>

      <AIReportCard
        label={financialSnapshot.riskLabel}
        score={financialSnapshot.riskScore}
        sections={aiReportSections}
      />
    </div>
  );
}
