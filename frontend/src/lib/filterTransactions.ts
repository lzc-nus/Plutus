import type { Transaction } from "@/data/wealthData";
import type { TransactionFilterState } from "@/components/dashboard/transactions/TransactionSearchFilterBar";

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilterState,
): Transaction[] {
  const query = filters.search.trim().toLowerCase();
  const minAmount = filters.amountMin.trim() ? Number(filters.amountMin) : null;
  const maxAmount = filters.amountMax.trim() ? Number(filters.amountMax) : null;
  const fromTime = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).getTime() : null;
  const toTime = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`).getTime() : null;

  return transactions.filter((transaction) => {
    const matchesSearch =
      !query ||
      [transaction.description, transaction.category, transaction.account, transaction.impact].some(
        (field) => field.toLowerCase().includes(query),
      );

    const matchesCategory =
      filters.categories.length === 0 || filters.categories.includes(transaction.category);
    const matchesAccount =
      filters.accounts.length === 0 || filters.accounts.includes(transaction.account);
    const matchesImpact =
      filters.impacts.length === 0 || filters.impacts.includes(transaction.impact);
    const matchesMinAmount =
      minAmount === null || Number.isNaN(minAmount) || transaction.amount >= minAmount;
    const matchesMaxAmount =
      maxAmount === null || Number.isNaN(maxAmount) || transaction.amount <= maxAmount;

    const transactionTime = new Date(transaction.date).getTime();
    const matchesDateFrom =
      fromTime === null || Number.isNaN(transactionTime) || transactionTime >= fromTime;
    const matchesDateTo =
      toTime === null || Number.isNaN(transactionTime) || transactionTime <= toTime;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesAccount &&
      matchesImpact &&
      matchesMinAmount &&
      matchesMaxAmount &&
      matchesDateFrom &&
      matchesDateTo
    );
  });
}
