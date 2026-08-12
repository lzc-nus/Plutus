"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  MetricCard,
  SectionHeader,
  TransactionList,
  TransactionRangeToggle,
} from "@/components/WealthComponents";
import { 
  deleteTransaction,
  listTransactions, 
  type TransactionRange, 
} from "@/lib/api/transactions";
import type { TransactionRead } from "@/lib/api/generated";
import type { Transaction } from "@/data/wealthData";
import { formatCurrency, formatCurrencyWithCents } from "@/lib/format";
import EditTransactionModal from "@/components/dashboard/transactions/EditTransactionModal";
import { useTransactionModalStore } from "@/lib/stores/transactionModalStore";
import {
  TransactionSearchFilterBar,
  DEFAULT_TRANSACTION_FILTERS,
  type TransactionFilterState,
} from "@/components/dashboard/transactions/TransactionSearchFilterBar";
import { filterTransactions } from "@/lib/filterTransactions";
import { ConfirmDeleteDialog } from "@/components/dashboard/portfolio/ConfirmDeleteDialog";

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function toTransaction(transaction: TransactionRead, range: TransactionRange): Transaction {
  return {
    id: transaction.id,
    date: formatDate(transaction.occurred_at),
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
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filters, setFilters] = useState<TransactionFilterState>(DEFAULT_TRANSACTION_FILTERS);
  const [deleteTarget, setDeleteTarget] = useState<TransactionRead | null>(null);

  const { openEditModal } = useTransactionModalStore();

  const ignoreRef = useRef(false);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error, response } = await listTransactions(range);

    if (ignoreRef.current) return;

    if (error || !response?.ok) {
      setTransactions([]);
      setErrorMessage("Unable to load transactions. Please try again.");
      setLoading(false);
      return;
    }

    setTransactions(data ?? []);
    setLoading(false);
  }, [range]);

  useEffect(() => {
    ignoreRef.current = false;
    void loadTransactions();
    return () => {
      ignoreRef.current = true;
    };
  }, [loadTransactions]);

  const ledger = useMemo(
    () => transactions.map(transaction => toTransaction(transaction, range)),
    [transactions, range],
  );

  const categories = useMemo(
    () => Array.from(new Set(ledger.map(transaction => transaction.category))),
    [ledger],
  );

  const accounts = useMemo(
    () => Array.from(new Set(ledger.map(transaction => transaction.account))),
    [ledger],
  );

  const impacts = useMemo(
    () => Array.from(new Set(ledger.map(transaction => transaction.impact))),
    [ledger],
  );

  const filtered = useMemo(
    () => filterTransactions(ledger, filters),
    [ledger, filters],
  );

  const inflow = filtered
    .filter(transaction => transaction.amount > 0)
    .reduce(
      (total, transaction) => total + transaction.amount, 
      0
    );
  
  const outflow = filtered
    .filter(transaction => transaction.amount < 0)
    .reduce(
      (total, transaction) => total + Math.abs(transaction.amount), 
      0
    );

  const netMovement = filtered.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );

  function editTransaction(id: string) {
    const transaction = transactions.find(transaction => transaction.id === id);

    if (transaction) {
      openEditModal(transaction);
    }
  }

  function deleteTransactionRequest(id: string) {
    const transaction = transactions.find((transaction) => transaction.id === id);

    if (transaction) {
      setDeleteTarget(transaction);
    }
  }

  async function confirmDelete(): Promise<boolean> {
    if (!deleteTarget) {
      return false;
    }

    const result = await deleteTransaction(deleteTarget.id);

    if (result.error) {
      return false;
    }

    setDeleteTarget(null);
    await loadTransactions();

    return true;
  }

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

          <TransactionRangeToggle 
            onChange={setRange} 
            value={range} 
          />
        </div>

        <TransactionSearchFilterBar
          availableAccounts={accounts}
          availableCategories={categories}
          availableImpacts={impacts}
          filters={filters}
          onChange={setFilters}
        />

        {loading ? (
          <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-8 text-sm font-semibold text-[#696154]">
            Loading transactions...
          </div>
        ) : null}

        {!loading && errorMessage ? (
          <div className="rounded-lg border border-[#d5a58b] bg-[#f2e0d8] p-6 text-sm font-semibold text-[#8f3f32]">
            {errorMessage}
          </div>
        ) : null}

        {!loading && !errorMessage && filtered.length > 0 ? (
          <TransactionList
            onDeleteClick={deleteTransactionRequest}
            onEditClick={editTransaction}
            onRowClick={editTransaction}
            transactions={filtered}
          />
        ) : null}

        {!loading && !errorMessage && filtered.length === 0 ? (
          <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-8 text-center">
            <h3 className="font-display text-3xl font-semibold text-[#1d211c]">
              No transactions in this view
            </h3>

            <p className="mt-2 text-sm text-[#696154]">
              {filters.search || filters.categories.length > 0
                ? "No matches for your search. Try a different term or clear the search."
                : "Add your first transaction or choose All to inspect the full ledger."}
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

      <EditTransactionModal onSuccess={loadTransactions} />

      {deleteTarget ? (
        <ConfirmDeleteDialog
          itemName={deleteTarget.description}
          itemType="transaction"
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </div>
  );
}