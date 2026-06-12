"use client";

import { useState } from "react";
import { assetFormSchema, type AssetFormInput } from "@/lib/validations/portfolio";
import { ASSET_CATEGORY_LABELS, type AssetCategory } from "@/data/portfolioTypes";

const ADD_NEW = "__add_new__";

interface AddAssetModalProps {
  defaultCategory?: AssetCategory;
  defaultCustomCategory?: string;
  existingCustomCategories?: string[];
  onClose: () => void;
  onSave: (payload: AssetFormInput) => void;
  lockCustomCategory?: boolean;
}

const LIQUIDITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;

const RISK_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "very_high", label: "Very high" },
] as const;

const INPUT_CLS =
  "w-full rounded-lg border border-[#d9d0c1] bg-white px-3.5 py-2.5 text-sm text-[#1d211c] placeholder-[#b0a898] outline-none transition-colors focus:border-[#7a6332] focus:ring-2 focus:ring-[#7a6332]/20";

export function AddAssetModal({
  defaultCategory,
  defaultCustomCategory,
  existingCustomCategories = [],
  onClose,
  onSave,
  lockCustomCategory,
}: AddAssetModalProps) {
  const [form, setForm] = useState<{
    name: string;
    category: AssetCategory;
    // Either an existing custom label, ADD_NEW sentinel, or empty string
    custom_category_select: string;
    // The free-text input shown only when ADD_NEW is selected
    custom_category_input: string;
    value: string;
    cost_basis: string;
    liquidity: "high" | "medium" | "low";
    risk: "low" | "moderate" | "high" | "very_high";
    notes: string;
    acquired_at: string;
  }>({
    name: "",
    category: defaultCategory ?? "stocks",
    custom_category_select: defaultCustomCategory 
      ?? (existingCustomCategories.length > 0 ? existingCustomCategories[0] : ADD_NEW),
    custom_category_input: "",
    value: "",
    cost_basis: "",
    liquidity: "medium",
    risk: "moderate",
    notes: "",
    acquired_at: "",
  });

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // The resolved custom_category value to submit
  function resolvedCustomCategory(): string | null {
    if (form.category !== "other" || lockCustomCategory) return null;
    if (form.custom_category_select === ADD_NEW) {
      return form.custom_category_input.trim() || null;
    }
    return form.custom_category_select || null;
  }

  function handleSubmit() {
    const result = assetFormSchema.safeParse({
      name: form.name,
      category: form.category,
      custom_category: resolvedCustomCategory(),
      value: form.value === "" ? undefined : Number(form.value),
      cost_basis: form.cost_basis === "" ? null : Number(form.cost_basis),
      liquidity: form.liquidity,
      risk: form.risk,
      notes: form.notes.trim() || null,
      acquired_at: form.acquired_at || null,
    });

    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0]])));
      return;
    }

    setErrors({});
    onSave(result.data);
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
              Portfolio asset
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#1d211c]">Add asset</h2>
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
                Asset name <span className="text-[#993c1d]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Apple Inc., Gold bullion, 123 Main St"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={INPUT_CLS}
              />
              {errors.name && <p className="mt-1 text-xs text-[#993c1d]">{errors.name}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as AssetCategory,
                    custom_category_select: existingCustomCategories.length > 0
                      ? existingCustomCategories[0]
                      : ADD_NEW,
                    custom_category_input: "",
                  })
                }
                className={INPUT_CLS}
              >
                {(Object.entries(ASSET_CATEGORY_LABELS) as [AssetCategory, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  )
                )}
              </select>
            </div>

            {/* Custom category — only when "other" is selected */}
            {isOther && !lockCustomCategory && (
              <div className="space-y-2">
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">
                  Custom category
                  <span className="ml-1.5 font-normal text-[#9a8f7a]">(optional)</span>
                </label>

                {/* Selector: existing names + "Add new…" */}
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

                {/* Free-text input — only when "Add new…" is chosen */}
                {isAddingNew && (
                  <input
                    type="text"
                    placeholder="e.g. Collectibles, Angel investments…"
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

            {/* Value + Cost basis */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">
                  Current value (USD) <span className="text-[#993c1d]">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className={INPUT_CLS}
                />
                {errors.value && <p className="mt-1 text-xs text-[#993c1d]">{errors.value}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">
                  Cost basis (SGD)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="Optional"
                  value={form.cost_basis}
                  onChange={(e) => setForm({ ...form, cost_basis: e.target.value })}
                  className={INPUT_CLS}
                />
                {errors.cost_basis && (
                  <p className="mt-1 text-xs text-[#993c1d]">{errors.cost_basis}</p>
                )}
              </div>
            </div>

            {/* Liquidity */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">Liquidity</label>
              <div className="grid grid-cols-3 gap-2">
                {LIQUIDITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, liquidity: opt.value })}
                    className={`rounded-lg border px-3 py-2.5 text-xs transition-colors ${
                      form.liquidity === opt.value
                        ? "border-[#7a6332] bg-[#f4ede0] font-semibold text-[#5a4520]"
                        : "border-[#d9d0c1] bg-white text-[#6f675b] hover:border-[#b8a87a]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">Risk level</label>
              <div className="grid grid-cols-4 gap-2">
                {RISK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, risk: opt.value })}
                    className={`rounded-lg border px-3 py-2.5 text-xs transition-colors ${
                      form.risk === opt.value
                        ? "border-[#7a6332] bg-[#f4ede0] font-semibold text-[#5a4520]"
                        : "border-[#d9d0c1] bg-white text-[#6f675b] hover:border-[#b8a87a]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Acquired + Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#4a4238]">Acquired</label>
                <input
                  type="date"
                  value={form.acquired_at}
                  onChange={(e) => setForm({ ...form, acquired_at: e.target.value })}
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
            className="rounded-lg bg-[#3b6d11] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#27500a]"
          >
            Save asset
          </button>
        </div>
      </div>
    </div>
  );
}