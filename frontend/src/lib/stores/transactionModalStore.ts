import { create } from "zustand";
import type { TransactionRead } from "@/lib/api/generated";

interface TransactionModalState {
  editModalOpen: boolean;
  editingTransaction: TransactionRead | null;
  openEditModal: (transaction: TransactionRead) => void;
  closeEditModal: () => void;
}

export const useTransactionModalStore = create<TransactionModalState>((set) => ({
  editModalOpen: false,
  editingTransaction: null,
  openEditModal: (transaction) =>
    set({ editModalOpen: true, editingTransaction: transaction }),
  closeEditModal: () =>
    set({ editModalOpen: false, editingTransaction: null }),
}));