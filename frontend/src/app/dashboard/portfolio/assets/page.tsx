"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { PortfolioHeader } from "@/components/dashboard/portfolio/PortfolioHeader";
import { AssetCategorySection } from "@/components/dashboard/portfolio/CategorySection";
import { AddAssetModal } from "@/components/dashboard/portfolio/AddAssetModal";
import { EditAssetModal } from "@/components/dashboard/portfolio/EditAssetModal";
import { ConfirmDeleteDialog } from "@/components/dashboard/portfolio/ConfirmDeleteDialog";
import { AssetSearchFilterBar } from "@/components/dashboard/portfolio/AssetSearchFilterBar";

import { 
  listAssets, 
  createAsset, 
  updateAsset, 
  deleteAsset 
} from "@/lib/api/portfolio";

import type { AssetRead } from "@/lib/api/generated";
import type { AssetFormInput } from "@/lib/validations/portfolio";

import { filterAssets } from "@/lib/portfolio/filterAssets";
import {
  ASSET_CATEGORY_LABELS,
  ASSET_CATEGORY_ICONS,
  DEFAULT_ASSET_FILTERS,
  type AssetCategory,
  type AssetFilterState
} from "@/data/portfolioTypes";

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

interface CategoryBucket {
  key: string;
  category: AssetCategory;
  label: string;
  icon: string;
  total: number;
  items: AssetRead[];
}

function buildCategories(assets: AssetRead[]): CategoryBucket[] {
  const categories: CategoryBucket[] = [];

  for (const category of Object.keys(
    ASSET_CATEGORY_LABELS
  ) as AssetCategory[]) {
    if (category === "other") {
      continue;
    }

    const items = assets.filter(asset => asset.category === category);

    categories.push({
      key: category,
      category: category,
      label: ASSET_CATEGORY_LABELS[category],
      icon: ASSET_CATEGORY_ICONS[category],
      total: items.reduce((sum, asset) => sum + Number(asset.value), 0),
      items,
    });
  }

  const otherAssets = assets.filter((asset) => asset.category === "other");

  const customCategories = Array.from(
    new Set(
      otherAssets
        .map(asset => asset.custom_category?.trim())
        .filter((category): category is string => Boolean(category))
    )
  );

  for (const category of customCategories) {
    const items = otherAssets.filter(
      asset => asset.custom_category?.trim() === category,
    );

    categories.push({
      key: `other::${category}`,
      category: "other",
      label: category,
      icon: ASSET_CATEGORY_ICONS.other,
      total: items.reduce((sum, asset) => sum + Number(asset.value), 0),
      items,
    });
  }

  const uncategorised = otherAssets.filter(
    asset => !asset.custom_category?.trim()
  );

  categories.push({
    key: "other",
    category: "other",
    label: ASSET_CATEGORY_LABELS.other,
    icon: ASSET_CATEGORY_ICONS.other,
    total: uncategorised.reduce(
      (sum, asset) => sum + Number(asset.value), 
      0
    ),
    items: uncategorised,
  });

  return categories;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // add modal
  const [addOpen, setAddOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<AssetCategory | undefined>();
  const [defaultCustomCategory, setDefaultCustomCategory] = useState<string | undefined>();
  const [lockCustomCategory, setLockCustomCategory] = useState(false);

  // edit modal
  const [editingAsset, setEditingAsset] = useState<AssetRead | null>(null);

  // delete dialog
  const [deletingAsset, setDeletingAsset] = useState<AssetRead | null>(null);

  const [filters, setFilters] = useState<AssetFilterState>(DEFAULT_ASSET_FILTERS);

  const searchParams = useSearchParams(); 
  const router = useRouter();

  useEffect(() => {
    void fetchAssets();
  }, []);

  async function fetchAssets() {
    setLoading(true);
    setError(null);
    
    try {  
      const { data, error } = await listAssets();

      if (error) {
        throw new Error("Failed to load assets");
      }

      setAssets(data ?? []);
    } catch {
      setError("Could not load your assets. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(payload: AssetFormInput): Promise<boolean> {
    const { data, error } = await createAsset(payload);

    if (error || !data) {
      return false;
    }

    setAssets(current => [...current, data]);
    return true;
  }

  async function handleUpdate(id: string, payload: AssetFormInput): Promise<boolean> {
    const { data, error } = await updateAsset(id, payload);

    if (error || !data) {
      return false;
    }

    setAssets(current => 
      current.map(asset => 
        String(asset.id) === id ? data : asset
      )
    );

    return true;
  }

  async function handleDelete(id: string): Promise<boolean> {
    const { error } = await deleteAsset(id);

    if (error) {
      return false;
    }

    setAssets(current => 
      current.filter(asset => String(asset.id) !== id)
    );

    return true;
  }

  function openAddModal(category?: AssetCategory, customCategory?: string, lockCategory?: boolean) {
    setDefaultCategory(category);
    setDefaultCustomCategory(customCategory);
    setLockCustomCategory(lockCategory ?? false);
    setAddOpen(true);
  }

  const filteredAssets = filterAssets(assets, filters);
  const categories = buildCategories(filteredAssets);

  const totalAssets = filteredAssets.reduce(
    (sum, asset) => sum + Number(asset.value), 
    0
  );

  const populatedCategories = categories.filter(category => category.items.length > 0);

  const existingCustomCategories = Array.from(
    new Set(
      assets
        .filter(asset => asset.category === "other" && asset.custom_category?.trim())
        .map((asset) => asset.custom_category!.trim())
    )
  );

  const lastUsedCustomCategory = assets
    .filter(asset => asset.category === "other" && asset.custom_category?.trim())
    .sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0]?.custom_category ?? undefined;

  useEffect(() => {
    if (searchParams.get("add") !== "true") {
      return;
    }

    const timer = window.setTimeout(() => {
      openAddModal(undefined, lastUsedCustomCategory);
      router.replace("/dashboard/portfolio/assets");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [lastUsedCustomCategory, router, searchParams]);
  
  const unusedStandardCategories = (
    Object.keys(ASSET_CATEGORY_LABELS) as AssetCategory[]
  ).filter(
    category => category !== "other" && !assets.some(asset => asset.category === category),
  );

  const hasOtherAssets = assets.some(asset => asset.category === "other");

  const unusedCategories: AssetCategory[] = [
    ...unusedStandardCategories
  ];

  if (!hasOtherAssets) {
    unusedCategories.push("other");
  }

  return (
    <>
      <div className="grid gap-6">
        <PortfolioHeader
          eyebrow="Assets dashboard"
          title="What you own"
          description="Browse by category. Each section shows individual holdings with value, cost basis, liquidity, and risk."
          backHref="/dashboard/portfolio"
          backLabel="Balance sheet"
          action={
            <button
              type='button'
              onClick={() => openAddModal(undefined, lastUsedCustomCategory)}
              className="flex items-center gap-2 rounded-lg bg-[#3b6d11] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#27500a]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Add asset
            </button>
          }
        />

        {loading && (
          <div className="flex items-center justify-center py-16 text-sm text-[#9a8f7a]">
            Loading assets…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl border border-[#f7c1c1] bg-[#fcebeb] px-5 py-4 text-sm text-[#a32d2d]">
            {error}

            <button
              type='button'
              onClick={fetchAssets} 
              className="ml-3 underline underline-offset-2 hover:text-[#791f1f]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Summary strip */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-[#d9d0c1] bg-[#fbf7ef] px-5 py-4">
              <div>
                <p className="text-xs text-[#9a8f7a]">Total assets</p>
                <p className="text-xl font-bold text-[#1d211c]">
                  {CURRENCY.format(totalAssets)}
                </p>
              </div>

              <div className="h-8 w-px bg-[#e4dece]" />

              <div>
                <p className="text-xs text-[#9a8f7a]">Holdings</p>
                <p className="text-xl font-bold text-[#1d211c]">
                  {assets.length}
                </p>
              </div>

              <div className="h-8 w-px bg-[#e4dece]" />

              <div>
                <p className="text-xs text-[#9a8f7a]">Categories</p>
                <p className="text-xl font-bold text-[#1d211c]">
                  {populatedCategories.length}
                </p>
              </div>
            </div>

            <AssetSearchFilterBar 
              filters={filters} 
              onChange={setFilters} 
            />

            <div className="grid gap-3">
              {populatedCategories.length === 0 && filteredAssets.length === 0 && assets.length > 0 && (
                <div className="rounded-xl border border-[#d9d0c1] bg-[#fbf7ef] px-5 py-10 text-center">
                  <p className="text-sm text-[#6f675b]">
                    No assets match your search or filters.
                  </p>

                  <button
                    type='button'
                    onClick={() => setFilters(DEFAULT_ASSET_FILTERS)}
                    className="mt-2 text-sm font-medium text-[#7a6332] underline underline-offset-2 hover:text-[#5a4520]"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {populatedCategories
                .map(category => (
                  <AssetCategorySection
                    key={category.key}
                    label={category.label}
                    icon={category.icon}
                    total={category.total}
                    items={category.items}
                    onAdd={() =>
                      openAddModal(
                        category.category,
                        category.key.startsWith("other::") 
                          ? category.label 
                          : undefined,
                        category.key === "other",
                      )
                    }
                    onEdit={setEditingAsset}
                    onDelete={setDeletingAsset}
                  />
                ))}

              {unusedCategories.length > 0 && (
                <div>
                  <p className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.12em] text-[#9a8f7a]">
                    Unused categories
                  </p>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {unusedCategories.map(category=> (
                      <button
                        type="button"
                        key={category}
                        onClick={() => openAddModal(category)}
                        className="flex items-center gap-3 rounded-xl border border-dashed border-[#d9d0c1] bg-transparent px-4 py-3 text-left transition-colors hover:border-[#b8a87a] hover:bg-[#fbf7ef]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-[#6f675b]">
                            {ASSET_CATEGORY_LABELS[category]}
                          </p>
                          <p className="text-xs text-[#b0a898]">
                            No entries
                          </p>
                        </div>

                        <svg
                          className="ml-auto h-3.5 w-3.5 shrink-0 text-[#b0a898]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path 
                            d="M12 5v14M5 12h14" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                          />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {addOpen && (
        <AddAssetModal
          defaultCategory={defaultCategory}
          defaultCustomCategory={defaultCustomCategory}
          existingCustomCategories={existingCustomCategories}
          lockCustomCategory={lockCustomCategory}
          onClose={() => setAddOpen(false)}
          onSave={handleCreate}
        />
      )}

      {editingAsset && (
        <EditAssetModal
          asset={editingAsset}
          existingCustomCategories={existingCustomCategories}
          onClose={() => setEditingAsset(null)}
          onSave={handleUpdate}
          onDelete={() => {
            setDeletingAsset(editingAsset);
            setEditingAsset(null);
          }}
        />
      )}

      {deletingAsset && (
        <ConfirmDeleteDialog
          itemName={deletingAsset.name}
          itemType="asset"
          onConfirm={() => handleDelete(String(deletingAsset.id))}
          onClose={() => setDeletingAsset(null)}
        />
      )}
    </>
  );
}
