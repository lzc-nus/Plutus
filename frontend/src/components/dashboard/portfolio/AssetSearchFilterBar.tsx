"use client";

import { useState } from "react";
import {
  ASSET_CATEGORY_LABELS,
  DEFAULT_ASSET_FILTERS,
  type AssetCategory,
  type AssetFilterState,
  type LiquidityLevel,
  type RiskLevel,
} from "@/data/portfolioTypes";

interface AssetSearchFilterBarProps {
  filters: AssetFilterState;
  onChange: (filters: AssetFilterState) => void;
  availableCustomCategories?: string[];
}

const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "very_high", label: "Very high" },
];

const LIQUIDITY_OPTIONS: { value: LiquidityLevel; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const INPUT_CLS =
  "w-full rounded-lg border border-[#d9d0c1] bg-white px-3 py-2 text-sm text-[#1d211c] placeholder-[#b0a898] outline-none transition-colors focus:border-[#7a6332] focus:ring-2 focus:ring-[#7a6332]/20";

function countActiveFilters(filters: AssetFilterState): number {
  let count = 0;

  if (filters.categories.length > 0) {
    count++;
  }

  if (filters.riskLevels.length > 0) {
    count++;
  }

  if (filters.liquidityLevels.length > 0) {
    count++;
  }

  if (filters.valueMin || filters.valueMax) {
    count++;
  }

  if (filters.acquiredFrom || filters.acquiredTo) {
    count++;
  }

  return count;
}

export function AssetSearchFilterBar({ filters, onChange }: AssetSearchFilterBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  const activeFilterCount = countActiveFilters(filters);

  function toggleCategory(category: AssetCategory) {
    const next = filters.categories.includes(category)
      ? filters.categories.filter(item => item !== category)
      : [...filters.categories, category];

    onChange({ ...filters, categories: next });
  }

  function toggleRisk(risk: RiskLevel) {
    const next = filters.riskLevels.includes(risk)
      ? filters.riskLevels.filter(item => item !== risk)
      : [...filters.riskLevels, risk];

    onChange({ ...filters, riskLevels: next });
  }

  function toggleLiquidity(liquidity: LiquidityLevel) {
    const next = filters.liquidityLevels.includes(liquidity)
      ? filters.liquidityLevels.filter(item => item !== liquidity)
      : [...filters.liquidityLevels, liquidity];

    onChange({ ...filters, liquidityLevels: next });
  }

  function clearFilters() {
    onChange(DEFAULT_ASSET_FILTERS);
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
            placeholder="Search assets by name…"
            value={filters.search}
            onChange={event => onChange({ ...filters, search: event.target.value })}
            className={`${INPUT_CLS} pl-9`}
          />
        </div>

        <button
          onClick={() => setPanelOpen(open => !open)}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            panelOpen || activeFilterCount > 0
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

          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#7a6332] text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        {(activeFilterCount > 0 || filters.search) && (
          <button
            onClick={clearFilters}
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
              {(Object.entries(ASSET_CATEGORY_LABELS) as [AssetCategory, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    onClick={() => toggleCategory(value)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      filters.categories.includes(value)
                        ? "border-[#7a6332] bg-[#7a6332] text-white"
                        : "border-[#d9d0c1] bg-white text-[#6f675b] hover:border-[#b8a87a]"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Risk */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[#9a8f7a]">
              Risk level
            </p>

            <div className="flex flex-wrap gap-1.5">
              {RISK_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => toggleRisk(option.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    filters.riskLevels.includes(option.value)
                      ? "border-[#7a6332] bg-[#7a6332] text-white"
                      : "border-[#d9d0c1] bg-white text-[#6f675b] hover:border-[#b8a87a]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Liquidity */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[#9a8f7a]">
              Liquidity
            </p>

            <div className="flex flex-wrap gap-1.5">
              {LIQUIDITY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => toggleLiquidity(option.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    filters.liquidityLevels.includes(option.value)
                      ? "border-[#7a6332] bg-[#7a6332] text-white"
                      : "border-[#d9d0c1] bg-white text-[#6f675b] hover:border-[#b8a87a]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Value range + Acquired date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[#9a8f7a]">
                Value range
              </p>

              <div className="flex items-center gap-2">
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

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-[#9a8f7a]">
                Acquired date range
              </p>
              
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.acquiredFrom}
                  onChange={event => onChange({ ...filters, acquiredFrom: event.target.value })}
                  className={INPUT_CLS}
                />
                
                <span className="text-[#9a8f7a]">
                  –
                </span>

                <input
                  type="date"
                  value={filters.acquiredTo}
                  onChange={event => onChange({ ...filters, acquiredTo: event.target.value })}
                  className={INPUT_CLS}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}