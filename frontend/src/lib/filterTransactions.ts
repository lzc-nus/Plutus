import type { Transaction } from "@/data/wealthData";
import type { TransactionFilterState } from "@/components/dashboard/transactions/TransactionSearchFilterBar";

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilterState,
): Transaction[] {
  const query = filters.search.trim().toLowerCase();

  return transactions.filter((transaction) => {
    const matchesSearch =
      !query ||
      [transaction.description, transaction.category, transaction.account].some((field) =>
        field.toLowerCase().includes(query),
      );

    const matchesCategory =
      filters.categories.length === 0 || filters.categories.includes(transaction.category);

    return matchesSearch && matchesCategory;
  });
}