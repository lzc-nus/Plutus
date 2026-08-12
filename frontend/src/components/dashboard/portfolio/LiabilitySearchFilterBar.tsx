"use client";

import { useState } from "react";
import {
  LIABILITY_CATEGORY_LABELS,
  DEFAULT_LIABILITY_FILTERS,
  type LiabilityCategory,
  type LiabilityFilterState,
} from "@/data/portfolioTypes";
import { openAsBlob } from "fs";

interface LiabilitySearchFilterBarProps {
  filters: LiabilityFilterState;
  onChange: (filters: LiabilityFilterState) => void;
}

const INPUT_CLS =
  "w-full rounded-lg border border-[#d9d0c1] bg-white px-3 py-2 text-sm text-[#1d211c] placeholder-[#b0a898] outline-none transition-colors focus:border-[#7a6332] focus:ring-2 focus:ring-[#7a6332]/20";

function countActiveFilters(filters: LiabilityFilterState): number {
  let count = 0;

  if (filters.categories.length > 0) {
    count++;
  }

  if (filters.rateMin || filters.rateMax) {
    count++;
  }

  if (filters.balanceMin || filters.balanceMax) {
    count++;
  }

  if (filters.maturityFrom || filters.maturityTo) {
    count++;
  }

  return count;
}

export function LiabilitySearchFilterBar({ filters, onChange }: LiabilitySearchFilterBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  function toggleCategory(category: LiabilityCategory) {
    const next = filters.categories.includes(category)
      ? filters.categories.filter(item => item !== category)
      : [...filters.categories, category];
    onChange({ ...filters, categories: next });
  }

  function clearAll() {
    onChange(DEFAULT_LIABILITY_FILTERS);
  }

  return (
    <div className="rounded-xl border border-[#d9d0c1] bg-[#fbf7ef] shadow-[0_2px_12px_rgba(43,34,24,0.05)]">
      
      {/* Search row */}
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
            type="text"
            placeholder="Search liabilities by name…"
            value={filters.search}
            onChange={event => onChange({ ...filters, search: event.target.value })}
            className={`${INPUT_CLS} pl-9`}
          />
        </div>

        <button
          onClick={() => setPanelOpen(open => !open)}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            panelOpen || activeCount > 0
              ? "border-[#993c1d] bg-[#faece7] text-[#712b13]"
              : "border-[#d9d0c1] bg-white text-[#6f675b] hover:border-[#c8907a]"
          }`}
        >
          <svg 
            className="h-4 w-4" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth={2} 
            viewBox="0 0 24 24"
          >
            <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          Filters

          {activeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#993c1d] text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        {(activeCount > 0 || filters.search) && (
          <button
            onClick={clearAll}
            className="shrink-0 text-xs font-medium text-[#9a8f7a] underline underline-offset-2 hover:text-[#6f675b]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {panelOpen && (
        <div className="space-y-4 border-t border-[#e4dece] p-4">
          {/* Category */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[#9a8f7a]">
              Category
            </p>

            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(LIABILITY_CATEGORY_LABELS) as [LiabilityCategory, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    onClick={() => toggleCategory(value)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      filters.categories.includes(value)
                        ? "border-[#993c1d] bg-[#993c1d] text-white"
                        : "border-[#d9d0c1] bg-white text-[#6f675b] hover:border-[#c8907a]"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Interest rate range + Balance range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[#9a8f7a]">
                Interest rate range (% APR)
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Min"
                  value={filters.rateMin}
                  onChange={event => onChange({ ...filters, rateMin: event.target.value })}
                  className={INPUT_CLS}
                />

                <span className="text-[#9a8f7a]">
                  –
                </span>
                
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Max"
                  value={filters.rateMax}
                  onChange={event => onChange({ ...filters, rateMax: event.target.value })}
                  className={INPUT_CLS}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[#9a8f7a]">
                Balance range
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={filters.balanceMin}
                  onChange={event => onChange({ ...filters, balanceMin: event.target.value })}
                  className={INPUT_CLS}
                />

                <span className="text-[#9a8f7a]">
                  –
                </span>
                
                <input
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={filters.balanceMax}
                  onChange={event => onChange({ ...filters, balanceMax: event.target.value })}
                  className={INPUT_CLS}
                />
              </div>
            </div>
          </div>

          {/* Maturity date range */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[#9a8f7a]">
              Maturity date range
            </p>

            <div className="flex items-center gap-2 sm:w-1/2">
              <input
                type="date"
                value={filters.maturityFrom}
                onChange={event => onChange({ ...filters, maturityFrom: event.target.value })}
                className={INPUT_CLS}
              />

              <span className="text-[#9a8f7a]">
                –
              </span>
              
              <input
                type="date"
                value={filters.maturityTo}
                onChange={event => onChange({ ...filters, maturityTo: event.target.value })}
                className={INPUT_CLS}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}