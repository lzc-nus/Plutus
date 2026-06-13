"use client";

import { useState } from "react";
import { liabilityFormSchema, type LiabilityFormInput } from "@/lib/validations/portfolio";
import { LIABILITY_CATEGORY_LABELS, type LiabilityCategory } from "@/data/portfolioTypes";
import type { LiabilityRead } from "@/lib/api/generated";

const ADD_NEW = "__add_new__";

interface EditLiabilityModalProps {
  liability: LiabilityRead;
  existingCustomCategories?: string[];
  onClose: () => void;
  onSave: (id: string, payload: LiabilityFormInput) => void;
}

const INPUT_CLS =
  "w-full rounded-lg border border-[#d9d0c1] bg-white px-3.5 py-2.5 text-sm text-[#1d211c] placeholder-[#b0a898] outline-none transition-colors focus:border-[#7a6332] focus:ring-2 focus:ring-[#7a6332]/20";

export function EditLiabilityModal({
  liability,
  existingCustomCategories = [],
  onClose,
  onSave,
}: EditLiabilityModalProps) {
  const initialCustomSelect =
    liability.custom_category?.trim()
      ? liability.custom_category.trim()
      : existingCustomCategories.length > 0
      ? existingCustomCategories[0]
      : ADD_NEW;

  const [form, setForm] = useState<{
    name: string;
    category: LiabilityCategory;
    custom_category_select: string;
    custom_category_input: string;
    balance: string;
    original_amount: string;
    interest_rate: string;
    monthly_payment: string;
    maturity_date: string;
    notes: string;
  }>({
    name: liability.name,
    category: liability.category as LiabilityCategory,
    custom_category_select: initialCustomSelect,
    custom_category_input: "",
    balance: String(liability.balance),
    original_amount: liability.original_amount != null ? String(liability.original_amount) : "",
    interest_rate: liability.interest_rate != null ? String(liability.interest_rate) : "",
    monthly_payment: liability.monthly_payment != null ? String(liability.monthly_payment) : "",
    maturity_date: liability.maturity_date ?? "",
    notes: liability.notes ?? "",
  });

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function resolvedCustomCategory(): string | null {
    if (form.category !== "other") return null;
    if (form.custom_category_select === ADD_NEW) {
      return form.custom_category_input.trim() || null;
    }
    return form.custom_category_select || null;
  }

  function handleSubmit() {
    const result = liabilityFormSchema.safeParse({
      name: form.name,
      category: form.category,
      custom_category: resolvedCustomCategory(),
      balance: form.balance === "" ? undefined : Number(form.balance),
      original_amount: form.original_amount === "" ? null : Number(form.original_amount),
      interest_rate: form.interest_rate === "" ? null : Number(form.interest_rate),
      monthly_payment: form.monthly_payment === "" ? null : Number(form.monthly_payment),
      maturity_date: form.maturity_date || null,
      notes: form.notes.trim() || null,
    });

    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0]])));
      return;
    }

    setErrors({});
    onSave(String(liability.id), result.data);
    onClose();
  }

  const isOther = form.category === "other";
  const isAddingNew = form.custom_category_select === ADD_NEW;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(29,33,28,0.5)] p-4 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#d9d0c1] bg-[#fbf7ef] shadow-[0_24px_80px_rgba(43,34,24,0.2)]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e4dece] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6332]">
              Portfolio liability
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#1d211c]">Edit liability</h2>
            <p className="mt-0.5 text-sm text-[#9a8f7a]">{liability.name}</p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 rounded-lg p-1.5 text-[#9a8f7a] transition-colors hover:bg-[#ede6d8] hover:text-[#1d211c]"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="space-y-4">

            {/* Name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">
                Liability name <span className="text-[#993c1d]">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={INPUT_CLS}
              />
              {errors.name && <p className="mt-1 text-xs text-[#993c1d]">{errors.name}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">Category</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as LiabilityCategory,
                    custom_category_select: existingCustomCategories.length > 0
                      ? existingCustomCategories[0]
                      : ADD_NEW,
                    custom_category_input: "",
                  })
                }
                className={INPUT_CLS}
              >
                {(Object.entries(LIABILITY_CATEGORY_LABELS) as [LiabilityCategory, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  )
                )}
              </select>
            </div>

            {/* Custom category */}
            {isOther && (
              <div className="space-y-2">
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">
                  Custom category
                  <span className="ml-1.5 font-normal text-[#9a8f7a]">(optional)</span>
                </label>
                <select
                  value={form.custom_category_select}
                  onChange={(e) =>
                    setForm({ ...form, custom_category_select: e.target.value, custom_category_input: "" })
                  }
                  className={INPUT_CLS}
                >
                  {existingCustomCategories.map((label) => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                  <option value={ADD_NEW}>
                    {existingCustomCategories.length > 0 ? "＋ Add new category…" : "Type a new category…"}
                  </option>
                </select>
                {isAddingNew && (
                  <input
                    type="text"
                    placeholder="e.g. Family loan, Deferred revenue…"
                    value={form.custom_category_input}
                    onChange={(e) => setForm({ ...form, custom_category_input: e.target.value })}
                    className={INPUT_CLS}
                    autoFocus
                  />
                )}
                {errors.custom_category && (
                  <p className="mt-1 text-xs text-[#993c1d]">{errors.custom_category}</p>
                )}
              </div>
            )}

            {/* Balance + Original amount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">
                  Outstanding balance (USD) <span className="text-[#993c1d]">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value })}
                  className={INPUT_CLS}
                />
                {errors.balance && <p className="mt-1 text-xs text-[#993c1d]">{errors.balance}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">Original loan amount</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Optional"
                  value={form.original_amount}
                  onChange={(e) => setForm({ ...form, original_amount: e.target.value })}
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {/* Rate + Monthly payment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">Interest rate (% APR)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={form.interest_rate}
                  onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
                  className={INPUT_CLS}
                />
                {errors.interest_rate && (
                  <p className="mt-1 text-xs text-[#993c1d]">{errors.interest_rate}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">Monthly payment (USD)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.monthly_payment}
                  onChange={(e) => setForm({ ...form, monthly_payment: e.target.value })}
                  className={INPUT_CLS}
                />
                {errors.monthly_payment && (
                  <p className="mt-1 text-xs text-[#993c1d]">{errors.monthly_payment}</p>
                )}
              </div>
            </div>

            {/* Maturity + Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">Maturity date</label>
                <input
                  type="date"
                  value={form.maturity_date}
                  onChange={(e) => setForm({ ...form, maturity_date: e.target.value })}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">Notes</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={INPUT_CLS}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#e4dece] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#d9d0c1] bg-white px-4 py-2 text-sm font-medium text-[#6f675b] transition-colors hover:bg-[#f4ede0]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-[#993c1d] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#712b13]"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}