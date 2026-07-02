"use client";

import { useMemo, useState } from "react";

export interface TransactionFilterState {
  search: string;
  categories: string[];
  accounts: string[];
  impacts: string[];
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}

export const DEFAULT_TRANSACTION_FILTERS: TransactionFilterState = {
  search: "",
  categories: [],
  accounts: [],
  impacts: [],
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
};

interface TransactionSearchFilterBarProps {
  filters: TransactionFilterState;
  onChange: (filters: TransactionFilterState) => void;
  availableCategories: string[];
  availableAccounts: string[];
  availableImpacts: string[];
}

const INPUT_CLS =
  "w-full rounded-lg border border-[#d9d0c1] bg-white px-3 py-2 text-sm text-[#1d211c] placeholder-[#b0a898] outline-none transition-colors focus:border-[#7a6332] focus:ring-2 focus:ring-[#7a6332]/20";

function countActiveFilters(filters: TransactionFilterState): number {
  let count = 0;
  if (filters.categories.length > 0) count += 1;
  if (filters.accounts.length > 0) count += 1;
  if (filters.impacts.length > 0) count += 1;
  if (filters.dateFrom || filters.dateTo) count += 1;
  if (filters.amountMin || filters.amountMax) count += 1;
  return count;
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[#9a8f7a]">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((value) => (
          <button
            key={value}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              selected.includes(value)
                ? "border-[#7a6332] bg-[#7a6332] text-white"
                : "border-[#d9d0c1] bg-white text-[#6f675b] hover:border-[#b8a87a]"
            }`}
            onClick={() => onToggle(value)}
          >
            {value}
          </button>
        ))}
        {options.length === 0 && <p className="text-xs text-[#9a8f7a]">None in this view.</p>}
      </div>
    </div>
  );
}

/**
 * Search/filter bar for /dashboard/transactions. Filters the already-fetched
 * ledger for the selected range — client-side only, same pattern as
 * PortfolioSearchFilterBar.
 */
export function TransactionSearchFilterBar({
  filters,
  onChange,
  availableCategories,
  availableAccounts,
  availableImpacts,
}: TransactionSearchFilterBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  const sortedCategories = useMemo(() => [...availableCategories].sort(), [availableCategories]);
  const sortedAccounts = useMemo(() => [...availableAccounts].sort(), [availableAccounts]);
  const sortedImpacts = useMemo(() => [...availableImpacts].sort(), [availableImpacts]);

  function toggle(key: "categories" | "accounts" | "impacts", value: string) {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  }

  function clearAll() {
    onChange(DEFAULT_TRANSACTION_FILTERS);
  }

  return (
    <div className="rounded-xl border border-[#d9d0c1] bg-[#fbf7ef] shadow-[0_2px_12px_rgba(43,34,24,0.05)]">
      <div className="flex items-center gap-2 p-3">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a8f7a]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            className={`${INPUT_CLS} pl-9`}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search description, category, account…"
            type="text"
            value={filters.search}
          />
        </div>

        <button
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            panelOpen || activeCount > 0
              ? "border-[#7a6332] bg-[#f4ede0] text-[#5a4520]"
              : "border-[#d9d0c1] bg-white text-[#6f675b] hover:border-[#b8a87a]"
          }`}
          onClick={() => setPanelOpen((o) => !o)}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#7a6332] text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        {(activeCount > 0 || filters.search) && (
          <button
            className="shrink-0 text-xs font-medium text-[#9a8f7a] underline underline-offset-2 hover:text-[#6f675b]"
            onClick={clearAll}
          >
            Clear
          </button>
        )}
      </div>

      {panelOpen && (
        <div className="space-y-4 border-t border-[#e4dece] p-4">
          <ChipGroup
            label="Categories"
            onToggle={(v) => toggle("categories", v)}
            options={sortedCategories}
            selected={filters.categories}
          />

          <ChipGroup
            label="Accounts"
            onToggle={(v) => toggle("accounts", v)}
            options={sortedAccounts}
            selected={filters.accounts}
          />

          <ChipGroup
            label="Impact"
            onToggle={(v) => toggle("impacts", v)}
            options={sortedImpacts}
            selected={filters.impacts}
          />

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[#9a8f7a]">
              Date range
            </p>
            <div className="flex items-center gap-2 sm:w-1/2">
              <input
                className={INPUT_CLS}
                onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
                type="date"
                value={filters.dateFrom}
              />
              <span className="text-[#9a8f7a]">–</span>
              <input
                className={INPUT_CLS}
                onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
                type="date"
                value={filters.dateTo}
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[#9a8f7a]">
              Amount range
            </p>
            <div className="flex items-center gap-2 sm:w-1/2">
              <input
                className={INPUT_CLS}
                onChange={(e) => onChange({ ...filters, amountMin: e.target.value })}
                placeholder="Min"
                type="number"
                value={filters.amountMin}
              />
              <span className="text-[#9a8f7a]">–</span>
              <input
                className={INPUT_CLS}
                onChange={(e) => onChange({ ...filters, amountMax: e.target.value })}
                placeholder="Max"
                type="number"
                value={filters.amountMax}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}