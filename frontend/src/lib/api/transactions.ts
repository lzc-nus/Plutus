import { transactionsCreate, transactionsList, transactionsUpdate, transactionsDelete } from "@/lib/api/generated";
import type { TransactionCreate, TransactionUpdate, TransactionsListData } from "@/lib/api/generated";
import { configureApiClient } from "./configureClient";

export type TransactionRange = Exclude<
  NonNullable<NonNullable<TransactionsListData["query"]>["range"]>,
  null
>;

export async function listTransactions(range?: TransactionRange) {
  configureApiClient();
  return transactionsList(
    range && range !== "ALL" ? { query: { range } } : undefined,
  );
}

export async function createTransaction(body: TransactionCreate) {
  configureApiClient();
  return transactionsCreate({ body });
}

export async function updateTransaction(id: string, body: TransactionUpdate) {
  configureApiClient();
  return transactionsUpdate({ path: { transaction_id: id }, body });
}

export async function deleteTransaction(id: string) {
  configureApiClient();
  return transactionsDelete({ path: { transaction_id: id } });
}