"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  MetricCard,
  SectionHeader,
  TransactionList,
  TransactionRangeToggle,
} from "@/components/WealthComponents";
import { listTransactions, type TransactionRange } from "@/lib/api/transactions";
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
import { deleteTransaction } from "@/lib/api/transactions";

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

  const { openEditModal } = useTransactionModalStore();

  function handleRowClick(id: string) {
    const original = transactions.find((transaction) => transaction.id === id);
    if (original) {
      openEditModal(original);
    }
  }

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const ignoreRef = useRef(false);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error, response } = await listTransactions(range);

    if (ignoreRef.current) return;

    if (error || !response?.ok) {
      setTransactions([]);
      setErrorMessage("Unable to load transactions. Please try again.");
      setIsLoading(false);
      return;
    }

    setTransactions(data ?? []);
    setIsLoading(false);
  }, [range]);

  useEffect(() => {
    ignoreRef.current = false;
    void loadTransactions();
    return () => {
      ignoreRef.current = true;
    };
  }, [loadTransactions]);

  const [filters, setFilters] = useState<TransactionFilterState>(DEFAULT_TRANSACTION_FILTERS);

  const ledgerTransactions = useMemo(
    () => transactions.map((transaction) => toLedgerTransaction(transaction, range)),
    [range, transactions],
  );
  const availableCategories = useMemo(
    () => Array.from(new Set(ledgerTransactions.map((t) => t.category))),
    [ledgerTransactions],
  );
  const availableAccounts = useMemo(
    () => Array.from(new Set(ledgerTransactions.map((t) => t.account))),
    [ledgerTransactions],
  );
  const availableImpacts = useMemo(
    () => Array.from(new Set(ledgerTransactions.map((t) => t.impact))),
    [ledgerTransactions],
  );

  const [deleteTarget, setDeleteTarget] = useState<TransactionRead | null>(null);

  function handleEditClick(id: string) {
    const original = transactions.find((transaction) => transaction.id === id);
    if (original) openEditModal(original);
  }

  function handleDeleteClick(id: string) {
    const original = transactions.find((transaction) => transaction.id === id);
    if (original) setDeleteTarget(original);
  }

  async function handleConfirmDelete(): Promise<boolean> {
    if (!deleteTarget) return false;
    const { error } = await deleteTransaction(deleteTarget.id);
    if (error) return false;
    await loadTransactions();
    return true;
  }

  const filteredTransactions = useMemo(
    () => filterTransactions(ledgerTransactions, filters),
    [ledgerTransactions, filters],
  );
  const inflow = filteredTransactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((total, transaction) => total + transaction.amount, 0);
  const outflow = Math.abs(
    filteredTransactions
      .filter((transaction) => transaction.amount < 0)
      .reduce((total, transaction) => total + transaction.amount, 0),
  );
  const netMovement = filteredTransactions.reduce(
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
        <TransactionSearchFilterBar
          availableAccounts={availableAccounts}
          availableCategories={availableCategories}
          availableImpacts={availableImpacts}
          filters={filters}
          onChange={setFilters}
        />

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

        {!isLoading && !errorMessage && filteredTransactions.length > 0 ? (
          <TransactionList
            onDeleteClick={handleDeleteClick}
            onEditClick={handleEditClick}
            onRowClick={handleRowClick}
            transactions={filteredTransactions}
          />
        ) : null}

        {!isLoading && !errorMessage && filteredTransactions.length === 0 ? (
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
          onConfirm={handleConfirmDelete}
        />
      ) : null}
    </div>
  );
}