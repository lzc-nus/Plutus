import { transactionsCreate, transactionsList } from "@/lib/api/generated";
import type { TransactionCreate, TransactionsListData } from "@/lib/api/generated";
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
