"use client";

import { useState } from "react";
import {
  ASSET_CATEGORY_LABELS,
  LIABILITY_CATEGORY_LABELS,
  type AssetCategory,
  type LiabilityCategory,
} from "@/data/portfolioTypes";

export interface PortfolioOverviewFilterState {
  search: string;
  assetCategories: AssetCategory[];
  liabilityCategories: LiabilityCategory[];
  valueMin: string;
  valueMax: string;
}

export const DEFAULT_OVERVIEW_FILTERS: PortfolioOverviewFilterState = {
  search: "",
  assetCategories: [],
  liabilityCategories: [],
  valueMin: "",
  valueMax: "",
};

interface PortfolioSearchFilterBarProps {
  filters: PortfolioOverviewFilterState;
  onChange: (filters: PortfolioOverviewFilterState) => void;
}

const INPUT_CLS =
  "w-full rounded-lg border border-[#d9d0c1] bg-white px-3 py-2 text-sm text-[#1d211c] placeholder-[#b0a898] outline-none transition-colors focus:border-[#7a6332] focus:ring-2 focus:ring-[#7a6332]/20";

function countActiveFilters(filters: PortfolioOverviewFilterState): number {
  let count = 0;

  if (filters.assetCategories.length > 0) {
    count++;
  }

  if (filters.liabilityCategories.length > 0) {
    count++;
  }

  if (filters.valueMin || filters.valueMax) {
    count++;
  }

  return count;
}

export function PortfolioSearchFilterBar({ filters, onChange }: PortfolioSearchFilterBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  function toggleAssetCategory(category: AssetCategory) {
    const categories = filters.assetCategories.includes(category)
      ? filters.assetCategories.filter(item => item !== category)
      : [...filters.assetCategories, category];

    onChange({ 
      ...filters, 
      assetCategories: categories 
    });
  }

  function toggleLiabilityCategory(category: LiabilityCategory) {
    const categories = filters.liabilityCategories.includes(category)
      ? filters.liabilityCategories.filter(item => item !== category)
      : [...filters.liabilityCategories, category];

    onChange({ 
      ...filters, 
      liabilityCategories: categories 
    });
  }

  function clearAll() {
    onChange(DEFAULT_OVERVIEW_FILTERS);
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
            placeholder="Search categories…"
            value={filters.search}
            onChange={event => onChange({ 
              ...filters, 
              search: event.target.value 
            })}
            className={`${INPUT_CLS} pl-9`}
          />
        </div>

        <button
          onClick={() => setPanelOpen(open => !open)}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            panelOpen || activeCount > 0
              ? "border-[#7a6332] bg-[#f4ede0] text-[#5a4520]"
              : "border-[#d9d0c1] bg-white text-[#6f675b] hover:border-[#b8a87a]"
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
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#7a6332] text-[10px] font-bold text-white">
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
          
          {/* Asset categories */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[#9a8f7a]">
              Asset categories
            </p>
          
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(ASSET_CATEGORY_LABELS) as [AssetCategory, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    onClick={() => toggleAssetCategory(value)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      filters.assetCategories.includes(value)
                        ? "border-[#3b6d11] bg-[#3b6d11] text-white"
                        : "border-[#d9d0c1] bg-white text-[#6f675b] hover:border-[#a8c888]"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Liability categories */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[#9a8f7a]">
              Liability categories
            </p>

            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(LIABILITY_CATEGORY_LABELS) as [LiabilityCategory, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    onClick={() => toggleLiabilityCategory(value)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      filters.liabilityCategories.includes(value)
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

          {/* Value range (apply to both assets and liabilities totals) */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[#9a8f7a]">
              Category total range
            </p>

            <div className="flex items-center gap-2 sm:w-1/2">
              <input
                type="number"
                min={0}
                placeholder="Min"
                value={filters.valueMin}
                onChange={event => onChange({ ...filters, valueMin: event.target.value })}
                className={INPUT_CLS}
              />

              <span className="text-[#9a8f7a]">
                –
              </span>
              
              <input
                type="number"
                min={0}
                placeholder="Max"
                value={filters.valueMax}
                onChange={event => onChange({ ...filters, valueMax: event.target.value })}
                className={INPUT_CLS}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}