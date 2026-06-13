"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { createTransaction } from "@/lib/api/transactions";
import { getApiErrorMessage } from "@/lib/api/auth";
import { transactionFormSchema } from "@/lib/validations/transactions";
import type { TransactionCreate } from "@/lib/api/generated";

type AddTransactionFormProps = {
  onTransactionAdded?: () => void;
};

type FieldErrors = Record<string, string[] | undefined>;

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

export default function AddTransactionForm({ onTransactionAdded }: AddTransactionFormProps) {
  const router = useRouter();
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
      const { error } = await createTransaction({
        occurred_at: toIsoDateTime(parsed.data.date, parsed.data.time),
        description: parsed.data.description,
        category: parsed.data.category,
        account: parsed.data.account,
        amount: parsed.data.amount,
        impact: parsed.data.impact ?? "",
      } satisfies TransactionCreate);

      if (error) {
        throw new Error(getApiErrorMessage(error, "Unable to record transaction."));
      }

      setDescription("");
      setAmount("");
      setDate("");
      setTime("");
      setAccount("");
      setCategory("");
      setImpact("");

      onTransactionAdded?.();
      router.push("/dashboard/transactions");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to record transaction.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 shadow-[0_18px_70px_rgba(43,34,24,0.06)] sm:p-7">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase text-[#8f6f2d]">Ledger entry</p>
        <h2 className="font-display mt-2 text-4xl font-semibold leading-tight text-[#1d211c]">
          Record new transaction
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#696154]">
          Use positive amounts for income and negative amounts for expenses, investments, repayments, or transfers out.
        </p>
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
            placeholder="ETF purchase"
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
            placeholder="-2400.50"
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
            placeholder="Brokerage"
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
            placeholder="Investment"
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
            placeholder="Diversification"
            type="text"
            value={impact}
          />
          {fieldErrors.impact ? <span className="text-sm text-[#8f3f32]">{fieldErrors.impact[0]}</span> : null}
        </label>

        <button
          className="h-12 rounded-md bg-[#1d211c] px-5 text-sm font-bold text-[#fbf7ef] transition hover:bg-[#343b32] disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Recording..." : "Add transaction"}
        </button>
      </form>
    </section>
  );
}
