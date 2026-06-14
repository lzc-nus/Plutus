"use client";

import { useEffect, useState } from "react";
import { PortfolioHeader } from "@/components/dashboard/portfolio/PortfolioHeader";
import { AssetCategorySection } from "@/components/dashboard/portfolio/CategorySection";
import { AddAssetModal } from "@/components/dashboard/portfolio/AddAssetModal";
import { EditAssetModal } from "@/components/dashboard/portfolio/EditAssetModal";
import { ConfirmDeleteDialog } from "@/components/dashboard/portfolio/ConfirmDeleteDialog";
import { listAssets, createAsset, updateAsset, deleteAsset } from "@/lib/api/portfolio";
import type { AssetRead } from "@/lib/api/generated";
import type { AssetFormInput } from "@/lib/validations/portfolio";
import {
  ASSET_CATEGORY_LABELS,
  ASSET_CATEGORY_ICONS,
  type AssetCategory,
} from "@/data/portfolioTypes";
import { useSearchParams, useRouter } from "next/navigation";

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
  const buckets: CategoryBucket[] = [];

  for (const cat of Object.keys(ASSET_CATEGORY_LABELS) as AssetCategory[]) {
    if (cat === "other") continue;
    const items = assets.filter((a) => a.category === cat);
    buckets.push({
      key: cat,
      category: cat,
      label: ASSET_CATEGORY_LABELS[cat],
      icon: ASSET_CATEGORY_ICONS[cat],
      total: items.reduce((sum, a) => sum + Number(a.value), 0),
      items,
    });
  }

  const otherItems = assets.filter((a) => a.category === "other");
  const customLabels = Array.from(
    new Set(otherItems.map((a) => a.custom_category?.trim()).filter((v): v is string => !!v))
  );

  for (const customLabel of customLabels) {
    const items = otherItems.filter((a) => a.custom_category?.trim() === customLabel);
    buckets.push({
      key: `other::${customLabel}`,
      category: "other",
      label: customLabel,
      icon: ASSET_CATEGORY_ICONS["other"],
      total: items.reduce((sum, a) => sum + Number(a.value), 0),
      items,
    });
  }

  const uncategorised = otherItems.filter((a) => !a.custom_category?.trim());
  buckets.push({
    key: "other",
    category: "other",
    label: ASSET_CATEGORY_LABELS["other"],
    icon: ASSET_CATEGORY_ICONS["other"],
    total: uncategorised.reduce((sum, a) => sum + Number(a.value), 0),
    items: uncategorised,
  });

  return buckets;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<AssetCategory | undefined>();
  const [defaultCustomCategory, setDefaultCustomCategory] = useState<string | undefined>();
  const [lockCustomCategory, setLockCustomCategory] = useState(false);

  // Edit modal
  const [editingAsset, setEditingAsset] = useState<AssetRead | null>(null);

  // Delete dialog
  const [deletingAsset, setDeletingAsset] = useState<AssetRead | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await listAssets();
      if (error) throw new Error();
      setAssets(data ?? []);
    } catch {
      setError("Could not load your assets. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(payload: AssetFormInput) {
    const { data, error } = await createAsset(payload);
    if (error || !data) return;
    setAssets((prev) => [...prev, data]);
  }

  async function handleUpdate(id: string, payload: AssetFormInput) {
    const { data, error } = await updateAsset(id, payload);
    if (error || !data) return;
    setAssets((prev) => prev.map((a) => (String(a.id) === id ? data : a)));
  }

  async function handleDelete(id: string) {
    const { error } = await deleteAsset(id);
    if (error) return;
    setAssets((prev) => prev.filter((a) => String(a.id) !== id));
  }

  function openAddModal(category?: AssetCategory, customCategory?: string, lock?: boolean) {
    setDefaultCategory(category);
    setDefaultCustomCategory(customCategory);
    setLockCustomCategory(lock ?? false);
    setAddOpen(true);
  }

  const categories = buildCategories(assets);
  const totalAssets = assets.reduce((sum, a) => sum + Number(a.value), 0);

  const existingCustomCategories = Array.from(
    new Set(
      assets
        .filter((a) => a.category === "other" && a.custom_category?.trim())
        .map((a) => a.custom_category!.trim())
    )
  );

  const lastUsedCustomCategory = assets
    .filter((a) => a.category === "other" && a.custom_category?.trim())
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
    ?.custom_category ?? undefined;

  const unusedStandard = (Object.keys(ASSET_CATEGORY_LABELS) as AssetCategory[]).filter(
    (cat) => cat !== "other" && assets.filter((a) => a.category === cat).length === 0
  );
  const showOtherStub = assets.filter((a) => a.category === "other").length === 0;
  const unusedCategories: AssetCategory[] = [
    ...unusedStandard,
    ...(showOtherStub ? ["other" as AssetCategory] : []),
  ];

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      const timer = window.setTimeout(() => {
        openAddModal(undefined, lastUsedCustomCategory);
        router.replace("/dashboard/portfolio/assets");
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [lastUsedCustomCategory, router, searchParams]);

  return (
    <>
      <div className="grid gap-6">
        {/* Header */}
        <PortfolioHeader
          eyebrow="Assets dashboard"
          title="What you own"
          description="Browse by category. Each section shows individual holdings with value, cost basis, liquidity, and risk."
          backHref="/portfolio"
          backLabel="Balance sheet"
          action={
            <button
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

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-sm text-[#9a8f7a]">
            Loading assets…
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-xl border border-[#f7c1c1] bg-[#fcebeb] px-5 py-4 text-sm text-[#a32d2d]">
            {error}
            <button onClick={fetchAssets} className="ml-3 underline underline-offset-2 hover:text-[#791f1f]">
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
                <p className="text-xl font-bold text-[#1d211c]">{CURRENCY.format(totalAssets)}</p>
              </div>
              <div className="h-8 w-px bg-[#e4dece]" />
              <div>
                <p className="text-xs text-[#9a8f7a]">Holdings</p>
                <p className="text-xl font-bold text-[#1d211c]">{assets.length}</p>
              </div>
              <div className="h-8 w-px bg-[#e4dece]" />
              <div>
                <p className="text-xs text-[#9a8f7a]">Categories</p>
                <p className="text-xl font-bold text-[#1d211c]">
                  {categories.filter((c) => c.items.length > 0).length}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {/* Populated buckets */}
              {categories
                .filter((c) => c.items.length > 0)
                .map((cat) => (
                  <AssetCategorySection
                    key={cat.key}
                    label={cat.label}
                    icon={cat.icon}
                    total={cat.total}
                    items={cat.items}
                    onAdd={() =>
                      openAddModal(
                        cat.category,
                        cat.key.startsWith("other::") ? cat.label : undefined,
                        cat.key === "other"
                      )
                    }
                    onEdit={(asset) => setEditingAsset(asset)}
                    onDelete={(asset) => setDeletingAsset(asset)}
                  />
                ))}

              {/* Unused category stubs */}
              {unusedCategories.length > 0 && (
                <div>
                  <p className="mb-2 px-1 text-xs font-medium uppercase tracking-[0.12em] text-[#9a8f7a]">
                    Unused categories
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {unusedCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => openAddModal(cat)}
                        className="flex items-center gap-3 rounded-xl border border-dashed border-[#d9d0c1] bg-transparent px-4 py-3 text-left transition-colors hover:border-[#b8a87a] hover:bg-[#fbf7ef]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-[#6f675b]">{ASSET_CATEGORY_LABELS[cat]}</p>
                          <p className="text-xs text-[#b0a898]">No entries</p>
                        </div>
                        <svg
                          className="ml-auto h-3.5 w-3.5 shrink-0 text-[#b0a898]"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
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

      {/* Add modal */}
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

      {/* Edit modal */}
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

      {/* Delete dialog */}
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
