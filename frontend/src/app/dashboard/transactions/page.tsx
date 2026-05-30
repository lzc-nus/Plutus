"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MetricCard,
  SectionHeader,
  TransactionList,
  TransactionRangeToggle,
} from "@/components/wealth-components";
import { listTransactions, type TransactionRange } from "@/lib/api/transactions";
import type { TransactionRead } from "@/lib/api/generated";
import type { Transaction } from "@/data/wealthData";
import { formatCurrency, formatCurrencyWithCents } from "@/lib/format";

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function formatTransactionDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function toLedgerTransaction(transaction: TransactionRead, range: TransactionRange): Transaction {
  return {
    id: transaction.id,
    date: formatTransactionDate(transaction.occurred_at),
    description: transaction.description,
    category: transaction.category,
    account: transaction.account,
    amount: toNumber(transaction.amount),
    impact: transaction.impact || "Recorded movement",
    range: [range],
  };
}

export default function TransactionsPage() {
  const [range, setRange] = useState<TransactionRange>("ALL");
  const [transactions, setTransactions] = useState<TransactionRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadTransactions() {
      setIsLoading(true);
      setErrorMessage("");

      const { data, error, response } = await listTransactions(range);

      if (ignore) {
        return;
      }

      if (error || !response?.ok) {
        setTransactions([]);
        setErrorMessage("Unable to load transactions. Please try again.");
        setIsLoading(false);
        return;
      }

      setTransactions(data ?? []);
      setIsLoading(false);
    }

    void loadTransactions();

    return () => {
      ignore = true;
    };
  }, [range]);

  const ledgerTransactions = useMemo(
    () => transactions.map((transaction) => toLedgerTransaction(transaction, range)),
    [range, transactions],
  );
  const inflow = ledgerTransactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((total, transaction) => total + transaction.amount, 0);
  const outflow = Math.abs(
    ledgerTransactions
      .filter((transaction) => transaction.amount < 0)
      .reduce((total, transaction) => total + transaction.amount, 0),
  );
  const netMovement = ledgerTransactions.reduce(
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
          label="Inflow"
          sublabel="Positive records in view"
          value={formatCurrency(inflow)}
        />
        <MetricCard
          label="Outflow"
          sublabel="Negative records in view"
          value={formatCurrency(outflow)}
        />
      </section>

      <section className="grid gap-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeader
            description="Switch between daily, monthly, annual, and all-time movement views."
            eyebrow="Transaction record"
            title="Movements and risk tags"
          />
          <TransactionRangeToggle onChange={setRange} value={range} />
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-8 text-sm font-semibold text-[#696154]">
            Loading transactions...
          </div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="rounded-lg border border-[#d5a58b] bg-[#f2e0d8] p-6 text-sm font-semibold text-[#8f3f32]">
            {errorMessage}
          </div>
        ) : null}

        {!isLoading && !errorMessage && ledgerTransactions.length > 0 ? (
          <TransactionList transactions={ledgerTransactions} />
        ) : null}

        {!isLoading && !errorMessage && ledgerTransactions.length === 0 ? (
          <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-8 text-center">
            <h3 className="font-display text-3xl font-semibold text-[#1d211c]">
              No transactions in this view
            </h3>
            <p className="mt-2 text-sm text-[#696154]">
              Add your first transaction or choose All to inspect the full ledger.
            </p>
            <Link
              className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-[#1d211c] px-4 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343b32]"
              href="/dashboard/transactions/new"
            >
              Add transaction
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
