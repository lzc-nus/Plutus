"use client";

import { useId, useState } from "react";
import { liabilityFormSchema, type LiabilityFormInput } from "@/lib/validations/portfolio";
import { LIABILITY_CATEGORY_LABELS, type LiabilityCategory } from "@/data/portfolioTypes";
import type { LiabilityRead } from "@/lib/api/generated";
import { CustomCategoryField } from "./CustomCategoryField";

interface EditLiabilityModalProps {
  liability: LiabilityRead;
  existingCustomCategories?: string[];
  onClose: () => void;
  onSave: (id: string, payload: LiabilityFormInput) => boolean | Promise<boolean>;
}

const INPUT_CLS =
  "w-full rounded-lg border border-[#d9d0c1] bg-white px-3.5 py-2.5 text-sm text-[#1d211c] placeholder-[#b0a898] outline-none transition-colors focus:border-[#7a6332] focus:ring-2 focus:ring-[#7a6332]/20";

export function EditLiabilityModal({
  liability,
  existingCustomCategories = [],
  onClose,
  onSave,
}: EditLiabilityModalProps) {
  const customCategoryId = useId();

  const [form, setForm] = useState<{
    name: string;
    category: LiabilityCategory;
    custom_category: string;
    balance: string;
    original_amount: string;
    interest_rate: string;
    monthly_payment: string;
    maturity_date: string;
    notes: string;
  }>({
    name: liability.name,
    category: liability.category as LiabilityCategory,
    custom_category: liability.custom_category ?? "",
    balance: String(liability.balance),
    original_amount: liability.original_amount != null ? String(liability.original_amount) : "",
    interest_rate: liability.interest_rate != null ? String(liability.interest_rate) : "",
    monthly_payment: liability.monthly_payment != null ? String(liability.monthly_payment) : "",
    maturity_date: liability.maturity_date ?? "",
    notes: liability.notes ?? "",
  });

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function resolvedCustomCategory(): string | null {
    if (form.category !== "other") {
      return null;
    }
    
    return form.custom_category.trim() || null;
  }

  async function handleSubmit() {
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
      const fieldErrors = result.error.flatten().fieldErrors;

      setErrors(
        Object
          .fromEntries(
            Object
              .entries(fieldErrors)
              .map(([key, messages]) => [key, messages?.[0]])
          )
      );

      setSubmitError("");
      return;
    }

    setErrors({});
    setSubmitError("");
    setIsSaving(true);

    try {
      const saved = await onSave(String(liability.id), result.data);

      if (!saved) {
        setSubmitError("Could not save this liability. Please try again.");
        return;
      }

      onClose();
    } catch {
      setSubmitError("Could not save this liability. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const isOther = form.category === "other";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(29,33,28,0.5)] p-4 sm:items-center"
      onClick={event => event.target === event.currentTarget && !isSaving && onClose()}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#d9d0c1] bg-[#fbf7ef] shadow-[0_24px_80px_rgba(43,34,24,0.2)]">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#e4dece] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6332]">
              Portfolio liability
            </p>

            <h2 className="mt-1 text-xl font-bold text-[#1d211c]">
              Edit liability
            </h2>

            <p className="mt-0.5 text-sm text-[#9a8f7a]">
              {liability.name}
            </p>
          </div>

          <button
            onClick={onClose}
            className="mt-0.5 rounded-lg p-1.5 text-[#9a8f7a] transition-colors hover:bg-[#ede6d8] hover:text-[#1d211c]"
            aria-label="Close"
          >
            <svg 
              className="h-5 w-5"  
              fill="none" 
              stroke="currentColor" 
              strokeWidth={2} 
              viewBox="0 0 24 24"
            >
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
                onChange={event => setForm({ ...form, name: event.target.value })}
                className={INPUT_CLS}
              />

              {errors.name && (
                <p className="mt-1 text-xs text-[#993c1d]">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">
                Category
              </label>
              
              <select
                value={form.category}
                onChange={event => {
                  const nextCategory = event.target.value as LiabilityCategory;

                  setForm({
                    ...form,
                    category: nextCategory,
                    custom_category: nextCategory === "other" ? form.custom_category : "",
                  });
                }}
                className={INPUT_CLS}
              >
                {(
                  Object.entries(LIABILITY_CATEGORY_LABELS) as [
                    LiabilityCategory, 
                    string
                  ][]
                ).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Custom category */}
            {isOther && (
              <CustomCategoryField
                id={customCategoryId}
                value={form.custom_category}
                suggestions={existingCustomCategories}
                placeholder="e.g. Family loan, deferred revenue"
                error={errors.custom_category}
                onChange={value => setForm({ ...form, custom_category: value })}
              />
            )}

            {/* Balance + Original amount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">
                  Outstanding balance <span className="text-[#993c1d]">*</span>
                </label>

                <input
                  type="number"
                  min={0}
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value })}
                  className={INPUT_CLS}
                />

                {errors.balance && (
                  <p className="mt-1 text-xs text-[#993c1d]">
                    {errors.balance}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">
                  Original loan amount
                </label>
                
                <input
                  type="number"
                  min={0}
                  placeholder="Optional"
                  value={form.original_amount}
                  onChange={event => setForm({ ...form, original_amount: event.target.value })}
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {/* Rate + Monthly payment */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">
                  Interest rate (% APR)
                </label>
                
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={form.interest_rate}
                  onChange={event => setForm({ ...form, interest_rate: event.target.value })}
                  className={INPUT_CLS}
                />

                {errors.interest_rate && (
                  <p className="mt-1 text-xs text-[#993c1d]">
                    {errors.interest_rate}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">
                  Monthly payment
                </label>
                
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.monthly_payment}
                  onChange={event => setForm({ ...form, monthly_payment: event.target.value })}
                  className={INPUT_CLS}
                />

                {errors.monthly_payment && (
                  <p className="mt-1 text-xs text-[#993c1d]">
                    {errors.monthly_payment}
                  </p>
                )}
              </div>
            </div>

            {/* Maturity + Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">
                  Maturity date
                </label>
                
                <input
                  type="date"
                  value={form.maturity_date}
                  onChange={event => setForm({ ...form, maturity_date: event.target.value })}
                  className={INPUT_CLS}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">
                  Notes
                </label>
                
                <input
                  type="text"
                  placeholder="Optional"
                  value={form.notes}
                  onChange={event => setForm({ ...form, notes: event.target.value })}
                  className={INPUT_CLS}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#e4dece] px-6 py-4">
          {submitError ? <p className="mb-3 text-sm text-[#993c1d]">{submitError}</p> : null}
          
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-[#d9d0c1] bg-white px-4 py-2 text-sm font-medium text-[#6f675b] transition-colors hover:bg-[#f4ede0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="rounded-lg bg-[#993c1d] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#712b13] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
