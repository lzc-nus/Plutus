"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { updateTransaction, deleteTransaction } from "@/lib/api/transactions";
import { getApiErrorMessage } from "@/lib/api/auth";
import { transactionFormSchema } from "@/lib/validations/transactions";
import { useTransactionModalStore } from "@/lib/stores/transactionModalStore";
import { ConfirmDeleteDialog } from "@/components/dashboard/portfolio/ConfirmDeleteDialog";
import type { TransactionUpdate } from "@/lib/api/generated";

type FieldErrors = Record<string, string[] | undefined>;

type EditTransactionModalProps = {
  onSuccess?: () => void;
};

function generateTimeOptions() {
  const intervals: string[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      intervals.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }
  return intervals;
}

function toIsoDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function splitIsoDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toISOString().slice(0, 10),
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

export default function EditTransactionModal({ onSuccess }: EditTransactionModalProps) {
  const { editModalOpen, editingTransaction, closeEditModal } = useTransactionModalStore();
  const timeOptions = useMemo(() => generateTimeOptions(), []);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [account, setAccount] = useState("");
  const [category, setCategory] = useState("");
  const [impact, setImpact] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!editingTransaction) return;
    const { date: d, time: t } = splitIsoDateTime(editingTransaction.occurred_at);
    setDescription(editingTransaction.description);
    setAmount(String(editingTransaction.amount));
    setDate(d);
    setTime(t);
    setAccount(editingTransaction.account);
    setCategory(editingTransaction.category);
    setImpact(editingTransaction.impact ?? "");
    setFieldErrors({});
    setFormError("");
  }, [editingTransaction]);

  if (!editModalOpen || !editingTransaction) return null;

  const transaction = editingTransaction;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const parsed = transactionFormSchema.safeParse({
      description,
      amount,
      date,
      time,
      account,
      category,
      impact,
    });

    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const { error } = await updateTransaction(transaction.id, {
        occurred_at: toIsoDateTime(parsed.data.date, parsed.data.time),
        description: parsed.data.description,
        category: parsed.data.category,
        account: parsed.data.account,
        amount: parsed.data.amount,
        impact: parsed.data.impact ?? "",
      } satisfies TransactionUpdate);

      if (error) {
        throw new Error(getApiErrorMessage(error, "Unable to update transaction."));
      }

      closeEditModal();
      onSuccess?.();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to update transaction.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(): Promise<boolean> {
    const { error } = await deleteTransaction(transaction.id);

    if (error) {
      return false;
    }

    closeEditModal();
    onSuccess?.();
    return true;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d211c]/40 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 shadow-[0_24px_90px_rgba(43,34,24,0.16)] sm:p-7">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-[#8f6f2d]">Ledger entry</p>
            <h2 className="font-display mt-2 text-3xl font-semibold leading-tight text-[#1d211c]">
              Edit transaction
            </h2>
          </div>
          <button
            className="text-sm font-semibold text-[#696154] hover:text-[#1d211c]"
            onClick={closeEditModal}
            type="button"
          >
            Close
          </button>
        </div>

        {formError ? (
          <p className="mb-4 rounded-md border border-[#d5a58b] bg-[#f2e0d8] px-3 py-2 text-sm font-semibold text-[#8f3f32]">
            {formError}
          </p>
        ) : null}

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-[#353026]">Description</span>
            <input
              className="h-11 rounded-md border border-[#d0c5b3] bg-[#fffaf2] px-3 text-sm text-[#1d211c] outline-none transition focus:border-[#8f6f2d] focus:ring-2 focus:ring-[#8f6f2d]/20"
              onChange={(event) => setDescription(event.target.value)}
              type="text"
              value={description}
            />
            {fieldErrors.description ? <span className="text-sm text-[#8f3f32]">{fieldErrors.description[0]}</span> : null}
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-[#353026]">Amount</span>
            <input
              className="h-11 rounded-md border border-[#d0c5b3] bg-[#fffaf2] px-3 text-sm text-[#1d211c] outline-none transition focus:border-[#8f6f2d] focus:ring-2 focus:ring-[#8f6f2d]/20"
              inputMode="decimal"
              onChange={(event) => setAmount(event.target.value)}
              type="text"
              value={amount}
            />
            {fieldErrors.amount ? <span className="text-sm text-[#8f3f32]">{fieldErrors.amount[0]}</span> : null}
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-[#353026]">Date</span>
            <input
              className="h-11 rounded-md border border-[#d0c5b3] bg-[#fffaf2] px-3 text-sm text-[#1d211c] outline-none transition focus:border-[#8f6f2d] focus:ring-2 focus:ring-[#8f6f2d]/20"
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
            {fieldErrors.date ? <span className="text-sm text-[#8f3f32]">{fieldErrors.date[0]}</span> : null}
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-[#353026]">Time</span>
            <select
              className="h-11 rounded-md border border-[#d0c5b3] bg-[#fffaf2] px-3 text-sm text-[#1d211c] outline-none transition focus:border-[#8f6f2d] focus:ring-2 focus:ring-[#8f6f2d]/20"
              onChange={(event) => setTime(event.target.value)}
              value={time}
            >
              <option value="">Select time</option>
              {timeOptions.map((timeOption) => (
                <option key={timeOption} value={timeOption}>
                  {timeOption}
                </option>
              ))}
            </select>
            {fieldErrors.time ? <span className="text-sm text-[#8f3f32]">{fieldErrors.time[0]}</span> : null}
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-[#353026]">Account</span>
            <input
              className="h-11 rounded-md border border-[#d0c5b3] bg-[#fffaf2] px-3 text-sm text-[#1d211c] outline-none transition focus:border-[#8f6f2d] focus:ring-2 focus:ring-[#8f6f2d]/20"
              onChange={(event) => setAccount(event.target.value)}
              type="text"
              value={account}
            />
            {fieldErrors.account ? <span className="text-sm text-[#8f3f32]">{fieldErrors.account[0]}</span> : null}
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-semibold text-[#353026]">Category</span>
            <input
              className="h-11 rounded-md border border-[#d0c5b3] bg-[#fffaf2] px-3 text-sm text-[#1d211c] outline-none transition focus:border-[#8f6f2d] focus:ring-2 focus:ring-[#8f6f2d]/20"
              onChange={(event) => setCategory(event.target.value)}
              type="text"
              value={category}
            />
            {fieldErrors.category ? <span className="text-sm text-[#8f3f32]">{fieldErrors.category[0]}</span> : null}
          </label>

          <label className="grid gap-1.5 md:col-span-2">
            <span className="text-sm font-semibold text-[#353026]">Impact note</span>
            <input
              className="h-11 rounded-md border border-[#d0c5b3] bg-[#fffaf2] px-3 text-sm text-[#1d211c] outline-none transition focus:border-[#8f6f2d] focus:ring-2 focus:ring-[#8f6f2d]/20"
              onChange={(event) => setImpact(event.target.value)}
              type="text"
              value={impact}
            />
            {fieldErrors.impact ? <span className="text-sm text-[#8f3f32]">{fieldErrors.impact[0]}</span> : null}
          </label>

          <div className="flex items-center gap-3 md:col-span-2">
            <button
              className="h-12 flex-1 rounded-md bg-[#1d211c] px-5 text-sm font-bold text-[#fbf7ef] transition hover:bg-[#343b32] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
            <button
              className="h-12 rounded-md border border-[#d5a58b] px-5 text-sm font-bold text-[#8f3f32] transition hover:bg-[#f2e0d8]"
              onClick={() => setConfirmDeleteOpen(true)}
              type="button"
            >
              Delete
            </button>
          </div>
        </form>
      </div>

      {confirmDeleteOpen ? (
        <ConfirmDeleteDialog
          itemName={transaction.description}
          itemType="transaction"
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}
