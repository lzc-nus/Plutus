"use client";

import { useEffect, useState } from "react";
import { PortfolioHeader } from "@/components/dashboard/portfolio/PortfolioHeader";
import { PortfolioOverviewCard } from "@/components/dashboard/portfolio/PortfolioOverviewCard";
import { PdfExportButton } from "@/components/WealthComponents";
import { listAssets, listLiabilities } from "@/lib/api/portfolio";
import type { AssetRead, LiabilityRead } from "@/lib/api/generated";
import {
  PortfolioSearchFilterBar,
  DEFAULT_OVERVIEW_FILTERS,
  type PortfolioOverviewFilterState,
} from "@/components/dashboard/portfolio/PortfolioSearchFilterBar";
import {
  ASSET_CATEGORY_LABELS,
  LIABILITY_CATEGORY_LABELS,
  type AssetCategory,
  type LiabilityCategory,
} from "@/data/portfolioTypes";

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function groupAssets(assets: AssetRead[], totalAssets: number, filters: PortfolioOverviewFilterState) {
  const map = new Map<AssetCategory, { label: string; value: number; count: number }>();

  for (const asset of assets) {
    const cat = asset.category as AssetCategory;
    const existing = map.get(cat);
    if (existing) {
      existing.value += Number(asset.value);
      existing.count += 1;
    } else {
      map.set(cat, {
        label: ASSET_CATEGORY_LABELS[cat],
        value: Number(asset.value),
        count: 1,
      });
    }
  }

  const search = filters.search.trim().toLowerCase();
  const valueMin = filters.valueMin === "" ? null : Number(filters.valueMin);
  const valueMax = filters.valueMax === "" ? null : Number(filters.valueMax);

  return Array.from(map.entries())
    .filter(([cat, group]) => {
      if (filters.assetCategories.length > 0 && !filters.assetCategories.includes(cat)) return false;
      if (search && !group.label.toLowerCase().includes(search)) return false;
      if (valueMin !== null && !Number.isNaN(valueMin) && group.value < valueMin) return false;
      if (valueMax !== null && !Number.isNaN(valueMax) && group.value > valueMax) return false;
      return true;
    })
    .map(([, group]) => group)
    .sort((a, b) => b.value - a.value)
    .map((cat) => ({
      ...cat,
      percent: totalAssets > 0 ? (cat.value / totalAssets) * 100 : 0,
    }));
}

function groupLiabilities(liabilities: LiabilityRead[], totalLiabilities: number, filters: PortfolioOverviewFilterState) {
  const map = new Map<LiabilityCategory, { label: string; value: number; count: number }>();

  for (const liability of liabilities) {
    const cat = liability.category as LiabilityCategory;
    const existing = map.get(cat);
    if (existing) {
      existing.value += Number(liability.balance);
      existing.count += 1;
    } else {
      map.set(cat, {
        label: LIABILITY_CATEGORY_LABELS[cat],
        value: Number(liability.balance),
        count: 1,
      });
    }
  }

  const search = filters.search.trim().toLowerCase();
  const valueMin = filters.valueMin === "" ? null : Number(filters.valueMin);
  const valueMax = filters.valueMax === "" ? null : Number(filters.valueMax);

  return Array.from(map.entries())
    .filter(([cat, group]) => {
      if (filters.liabilityCategories.length > 0 && !filters.liabilityCategories.includes(cat)) return false;
      if (search && !group.label.toLowerCase().includes(search)) return false;
      if (valueMin !== null && !Number.isNaN(valueMin) && group.value < valueMin) return false;
      if (valueMax !== null && !Number.isNaN(valueMax) && group.value > valueMax) return false;
      return true;
    })
    .map(([, group]) => group)
    .sort((a, b) => b.value - a.value)
    .map((cat) => ({
      ...cat,
      percent: totalLiabilities > 0 ? (cat.value / totalLiabilities) * 100 : 0,
    }));
}

export default function PortfolioPage() {
  const [assets, setAssets] = useState<AssetRead[]>([]);
  const [liabilities, setLiabilities] = useState<LiabilityRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PortfolioOverviewFilterState>(DEFAULT_OVERVIEW_FILTERS);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const [assetsRes, liabilitiesRes] = await Promise.all([
        listAssets(),
        listLiabilities(),
      ]);
      if (assetsRes.error || liabilitiesRes.error) throw new Error();
      setAssets(assetsRes.data ?? []);
      setLiabilities(liabilitiesRes.data ?? []);
    } catch {
      setError("Could not load your portfolio. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const totalAssets = assets.reduce((sum, a) => sum + Number(a.value), 0);
  const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.balance), 0);
  const netWorth = totalAssets - totalLiabilities;
  const isPositive = netWorth >= 0;

  const assetGroups = groupAssets(assets, totalAssets, filters);
  const liabilityGroups = groupLiabilities(liabilities, totalLiabilities, filters);

  return (
    <div className="grid gap-6">
      {/* Page header */}
      <PortfolioHeader
        eyebrow="Portfolio"
        title="Balance sheet"
        description="Your complete financial picture — assets you own less liabilities you owe."
        action={<PdfExportButton />}
      />

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-[#f7c1c1] bg-[#fcebeb] px-5 py-4 text-sm text-[#a32d2d]">
          {error}
          <button
            onClick={fetchData}
            className="ml-3 underline underline-offset-2 hover:text-[#791f1f]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Net worth banner */}
      <div className="rounded-xl border border-[#d9d0c1] bg-[#fbf7ef] px-6 py-5 shadow-[0_2px_12px_rgba(43,34,24,0.05)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6332]">
          Net worth
        </p>

        {loading ? (
          <div className="mt-2 h-10 w-48 animate-pulse rounded-lg bg-[#e4dece]" />
        ) : (
          <>
            <p className={`mt-1.5 text-4xl font-bold tracking-tight ${isPositive ? "text-[#1d211c]" : "text-[#993c1d]"}`}>
              {CURRENCY.format(netWorth)}
            </p>

            {/* Equation bar */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-[#3b6d11]">{CURRENCY.format(totalAssets)}</span>
              <span className="text-[#9a8f7a]">assets</span>
              <span className="text-[#b0a898]">−</span>
              <span className="font-medium text-[#993c1d]">{CURRENCY.format(totalLiabilities)}</span>
              <span className="text-[#9a8f7a]">liabilities</span>
              <span className="text-[#b0a898]">=</span>
              <span className={`font-semibold ${isPositive ? "text-[#1d211c]" : "text-[#993c1d]"}`}>
                {CURRENCY.format(netWorth)}
              </span>
            </div>

            {/* Equity ratio bar */}
            {totalAssets > 0 && (
              <div className="mt-4">
                <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[#e4dece]">
                  <div
                    className="h-full bg-[#639922] transition-all"
                    style={{
                      width: `${Math.min(((totalAssets - totalLiabilities) / totalAssets) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-[#9a8f7a]">
                  <span>Equity</span>
                  <span>
                    {(((totalAssets - totalLiabilities) / totalAssets) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Search & filter */}
      {!loading && !error && (
        <PortfolioSearchFilterBar filters={filters} onChange={setFilters} />
      )}

      {/* Overview cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl bg-[#f0e8d8]" />
          <div className="h-64 animate-pulse rounded-xl bg-[#f0e8d8]" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <PortfolioOverviewCard
            type="assets"
            total={totalAssets}
            categoryCount={assetGroups.length}
            itemCount={assets.length}
            topCategories={assetGroups}
            href="/dashboard/portfolio/assets"
          />
          <PortfolioOverviewCard
            type="liabilities"
            total={totalLiabilities}
            categoryCount={liabilityGroups.length}
            itemCount={liabilities.length}
            topCategories={liabilityGroups}
            href="/dashboard/portfolio/liabilities"
          />
        </div>
      )}
    </div>
  );
}
