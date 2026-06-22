"use client";

import { useEffect, useState } from "react";
import { PortfolioHeader } from "@/components/dashboard/portfolio/PortfolioHeader";
import { LiabilityCategorySection } from "@/components/dashboard/portfolio/CategorySection";
import { AddLiabilityModal } from "@/components/dashboard/portfolio/AddLiabilityModal";
import { EditLiabilityModal } from "@/components/dashboard/portfolio/EditLiabilityModal";
import { ConfirmDeleteDialog } from "@/components/dashboard/portfolio/ConfirmDeleteDialog";
import { LiabilitySearchFilterBar } from "@/components/dashboard/portfolio/LiabilitySearchFilterBar";
import { listLiabilities, createLiability, updateLiability, deleteLiability } from "@/lib/api/portfolio";
import type { LiabilityRead } from "@/lib/api/generated";
import type { LiabilityFormInput } from "@/lib/validations/portfolio";
import { filterLiabilities } from "@/lib/portfolio/filterLiabilities";
import {
  LIABILITY_CATEGORY_LABELS,
  LIABILITY_CATEGORY_ICONS,
  DEFAULT_LIABILITY_FILTERS,
  type LiabilityCategory,
  type LiabilityFilterState
} from "@/data/portfolioTypes";
import { useRouter, useSearchParams } from "next/navigation";

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

interface CategoryBucket {
  key: string;
  category: LiabilityCategory;
  label: string;
  icon: string;
  total: number;
  items: LiabilityRead[];
}

function buildCategories(liabilities: LiabilityRead[]): CategoryBucket[] {
  const buckets: CategoryBucket[] = [];

  for (const cat of Object.keys(LIABILITY_CATEGORY_LABELS) as LiabilityCategory[]) {
    if (cat === "other") continue;
    const items = liabilities.filter((l) => l.category === cat);
    buckets.push({
      key: cat,
      category: cat,
      label: LIABILITY_CATEGORY_LABELS[cat],
      icon: LIABILITY_CATEGORY_ICONS[cat],
      total: items.reduce((sum, l) => sum + Number(l.balance), 0),
      items,
    });
  }

  const otherItems = liabilities.filter((l) => l.category === "other");
  const customLabels = Array.from(
    new Set(otherItems.map((l) => l.custom_category?.trim()).filter((v): v is string => !!v))
  );

  for (const customLabel of customLabels) {
    const items = otherItems.filter((l) => l.custom_category?.trim() === customLabel);
    buckets.push({
      key: `other::${customLabel}`,
      category: "other",
      label: customLabel,
      icon: LIABILITY_CATEGORY_ICONS["other"],
      total: items.reduce((sum, l) => sum + Number(l.balance), 0),
      items,
    });
  }

  const uncategorised = otherItems.filter((l) => !l.custom_category?.trim());
  buckets.push({
    key: "other",
    category: "other",
    label: LIABILITY_CATEGORY_LABELS["other"],
    icon: LIABILITY_CATEGORY_ICONS["other"],
    total: uncategorised.reduce((sum, l) => sum + Number(l.balance), 0),
    items: uncategorised,
  });

  return buckets;
}

export default function LiabilitiesPage() {
  const [liabilities, setLiabilities] = useState<LiabilityRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<LiabilityCategory | undefined>();
  const [defaultCustomCategory, setDefaultCustomCategory] = useState<string | undefined>();
  const [lockCustomCategory, setLockCustomCategory] = useState(false);

  // Edit modal
  const [editingLiability, setEditingLiability] = useState<LiabilityRead | null>(null);

  // Delete dialog
  const [deletingLiability, setDeletingLiability] = useState<LiabilityRead | null>(null);

  const [filters, setFilters] = useState<LiabilityFilterState>(DEFAULT_LIABILITY_FILTERS);

  useEffect(() => {
    fetchLiabilities();
  }, []);

  async function fetchLiabilities() {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await listLiabilities();
      if (error) throw new Error();
      setLiabilities(data ?? []);
    } catch {
      setError("Could not load your liabilities. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(payload: LiabilityFormInput): Promise<boolean> {
    const { data, error } = await createLiability(payload);
    if (error || !data) return false;
    setLiabilities((prev) => [...prev, data]);
    return true;
  }

  async function handleUpdate(id: string, payload: LiabilityFormInput): Promise<boolean> {
    const { data, error } = await updateLiability(id, payload);
    if (error || !data) return false;
    setLiabilities((prev) => prev.map((l) => (String(l.id) === id ? data : l)));
    return true;
  }

  async function handleDelete(id: string): Promise<boolean> {
    const { error } = await deleteLiability(id);
    if (error) return false;
    setLiabilities((prev) => prev.filter((l) => String(l.id) !== id));
    return true;
  }

  function openAddModal(category?: LiabilityCategory, customCategory?: string, lock?: boolean) {
    setDefaultCategory(category);
    setDefaultCustomCategory(customCategory);
    setLockCustomCategory(lock ?? false);
    setAddOpen(true);
  }

  const filteredLiabilities = filterLiabilities(liabilities, filters);
  const categories = buildCategories(filteredLiabilities);
  const totalLiabilities = filteredLiabilities.reduce((sum, l) => sum + Number(l.balance), 0);
  const totalMonthlyPayments = filteredLiabilities.reduce(
    (sum, l) => sum + Number(l.monthly_payment ?? 0),
    0
  );

  const existingCustomCategories = Array.from(
    new Set(
      liabilities
        .filter((l) => l.category === "other" && l.custom_category?.trim())
        .map((l) => l.custom_category!.trim())
    )
  );

  const lastUsedCustomCategory = liabilities
    .filter((l) => l.category === "other" && l.custom_category?.trim())
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
    ?.custom_category ?? undefined;

  const unusedStandard = (Object.keys(LIABILITY_CATEGORY_LABELS) as LiabilityCategory[]).filter(
    (cat) => cat !== "other" && liabilities.filter((l) => l.category === cat).length === 0
  );
  const showOtherStub = liabilities.filter((l) => l.category === "other").length === 0;
  const unusedCategories: LiabilityCategory[] = [
    ...unusedStandard,
    ...(showOtherStub ? ["other" as LiabilityCategory] : []),
  ];

  const searchParams = useSearchParams();
  const router = useRouter();
  
  useEffect(() => {
    if (searchParams.get("add") === "true") {
      const timer = window.setTimeout(() => {
        openAddModal(undefined, lastUsedCustomCategory);
        router.replace("/dashboard/portfolio/liabilities");
      }, 0);
  
      return () => window.clearTimeout(timer);
    }
  }, [lastUsedCustomCategory, router, searchParams]);

  return (
    <>
      <div className="grid gap-6">
        {/* Header */}
        <PortfolioHeader
          eyebrow="Liabilities dashboard"
          title="What you owe"
          description="Browse by obligation type. Each section shows individual liabilities with balance, rate, and payment schedule."
          backHref="/dashboard/portfolio"
          backLabel="Balance sheet"
          action={
            <button
              onClick={() => openAddModal(undefined, lastUsedCustomCategory)}
              className="flex items-center gap-2 rounded-lg bg-[#993c1d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#712b13]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Add liability
            </button>
          }
        />

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-sm text-[#9a8f7a]">
            Loading liabilities…
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-xl border border-[#f7c1c1] bg-[#fcebeb] px-5 py-4 text-sm text-[#a32d2d]">
            {error}
            <button onClick={fetchLiabilities} className="ml-3 underline underline-offset-2 hover:text-[#791f1f]">
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
                <p className="text-xs text-[#9a8f7a]">Total owed</p>
                <p className="text-xl font-bold text-[#993c1d]">{CURRENCY.format(totalLiabilities)}</p>
              </div>
              <div className="h-8 w-px bg-[#e4dece]" />
              <div>
                <p className="text-xs text-[#9a8f7a]">Obligations</p>
                <p className="text-xl font-bold text-[#1d211c]">{liabilities.length}</p>
              </div>
              <div className="h-8 w-px bg-[#e4dece]" />
              <div>
                <p className="text-xs text-[#9a8f7a]">Monthly payments</p>
                <p className="text-xl font-bold text-[#1d211c]">{CURRENCY.format(totalMonthlyPayments)}</p>
              </div>
              <div className="h-8 w-px bg-[#e4dece]" />
              <div>
                <p className="text-xs text-[#9a8f7a]">Categories</p>
                <p className="text-xl font-bold text-[#1d211c]">
                  {categories.filter((c) => c.items.length > 0).length}
                </p>
              </div>
            </div>

            {/* Search & filter */}
            <LiabilitySearchFilterBar filters={filters} onChange={setFilters} />

            <div className="grid gap-3">
              {categories.filter((c) => c.items.length > 0).length === 0 && filteredLiabilities.length === 0 && liabilities.length > 0 && (
                <div className="rounded-xl border border-[#d9d0c1] bg-[#fbf7ef] px-5 py-10 text-center">
                  <p className="text-sm text-[#6f675b]">No liabilities match your search or filters.</p>
                  <button
                    onClick={() => setFilters(DEFAULT_LIABILITY_FILTERS)}
                    className="mt-2 text-sm font-medium text-[#7a6332] underline underline-offset-2 hover:text-[#5a4520]"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {/* Populated buckets */}
              {categories
                .filter((c) => c.items.length > 0)
                .map((cat) => (
                  <LiabilityCategorySection
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
                    onEdit={(liability) => setEditingLiability(liability)}
                    onDelete={(liability) => setDeletingLiability(liability)}
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
                        className="flex items-center gap-3 rounded-xl border border-dashed border-[#d9d0c1] bg-transparent px-4 py-3 text-left transition-colors hover:border-[#c8907a] hover:bg-[#fbf7ef]"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-[#6f675b]">{LIABILITY_CATEGORY_LABELS[cat]}</p>
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
        <AddLiabilityModal
          defaultCategory={defaultCategory}
          defaultCustomCategory={defaultCustomCategory}
          existingCustomCategories={existingCustomCategories}
          lockCustomCategory={lockCustomCategory}
          onClose={() => setAddOpen(false)}
          onSave={handleCreate}
        />
      )}

      {/* Edit modal */}
      {editingLiability && (
        <EditLiabilityModal
          liability={editingLiability}
          existingCustomCategories={existingCustomCategories}
          onClose={() => setEditingLiability(null)}
          onSave={handleUpdate}
        />
      )}

      {/* Delete dialog */}
      {deletingLiability && (
        <ConfirmDeleteDialog
          itemName={deletingLiability.name}
          itemType="liability"
          onConfirm={() => handleDelete(String(deletingLiability.id))}
          onClose={() => setDeletingLiability(null)}
        />
      )}
    </>
  );
}
