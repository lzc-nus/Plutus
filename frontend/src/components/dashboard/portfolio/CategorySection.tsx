"use client";

import { useState } from "react";
import type { AssetRead, LiabilityRead } from "@/lib/api/generated";

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const RISK_STYLES: Record<string, string> = {
  low: "bg-[#edf5e0] text-[#3b6d11] border-[#c8d8b0]",
  moderate: "bg-[#faeeda] text-[#854f0b] border-[#f0c870]",
  high: "bg-[#faece7] text-[#993c1d] border-[#e8c8b8]",
  very_high: "bg-[#fcebeb] text-[#a32d2d] border-[#f7c1c1]",
};

const LIQUIDITY_STYLES: Record<string, string> = {
  high: "text-[#3b6d11]",
  medium: "text-[#854f0b]",
  low: "text-[#993c1d]",
};

// ── Shared row action buttons ─────────────────────────────────────────────
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/row:opacity-100">
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="rounded-md p-1.5 text-[#9a8f7a] transition-colors hover:bg-[#ede6d8] hover:text-[#1d211c]"
        aria-label="Edit"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="rounded-md p-1.5 text-[#9a8f7a] transition-colors hover:bg-[#fcebeb] hover:text-[#a32d2d]"
        aria-label="Delete"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

// ── Asset row ─────────────────────────────────────────────────────────────
function AssetRow({
  asset,
  onEdit,
  onDelete,
}: {
  asset: AssetRead;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const gain =
    asset.cost_basis != null
      ? ((Number(asset.value) - Number(asset.cost_basis)) / Number(asset.cost_basis)) * 100
      : null;

  return (
    <div
      className="group/row flex cursor-pointer items-center gap-4 py-3 hover:bg-[#f4ede0] -mx-5 px-5 transition-colors"
      onClick={onEdit}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#1d211c]">{asset.name}</p>
        {asset.notes && (
          <p className="mt-0.5 truncate text-xs text-[#9a8f7a]">{asset.notes}</p>
        )}
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${RISK_STYLES[asset.risk]}`}>
          {asset.risk.replace("_", " ")}
        </span>
        <span className={`text-xs ${LIQUIDITY_STYLES[asset.liquidity]}`}>
          {asset.liquidity} liq.
        </span>
      </div>

      {gain !== null && (
        <p className={`hidden text-xs font-medium sm:block ${gain >= 0 ? "text-[#3b6d11]" : "text-[#993c1d]"}`}>
          {`${gain >= 0 ? "+" : ""}${gain.toFixed(2)}%`}
        </p>
      )}

      <p className="shrink-0 text-sm font-semibold text-[#1d211c]">
        {CURRENCY.format(Number(asset.value))}
      </p>

      <RowActions onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

// ── Liability row ─────────────────────────────────────────────────────────
function LiabilityRow({
  liability,
  onEdit,
  onDelete,
}: {
  liability: LiabilityRead;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="group/row flex cursor-pointer items-center gap-4 py-3 hover:bg-[#f4ede0] -mx-5 px-5 transition-colors"
      onClick={onEdit}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#1d211c]">{liability.name}</p>
        {liability.maturity_date && (
          <p className="mt-0.5 text-xs text-[#9a8f7a]">Matures {liability.maturity_date}</p>
        )}
      </div>

      <div className="hidden flex-col items-end gap-0.5 sm:flex">
        {liability.interest_rate != null && (
          <p className="text-xs text-[#9a8f7a]">
            {Number(liability.interest_rate).toFixed(2)}% APR
          </p>
        )}
        {liability.monthly_payment != null && (
          <p className="text-xs text-[#6f675b]">
            {CURRENCY.format(Number(liability.monthly_payment))}/mo
          </p>
        )}
      </div>

      <p className="shrink-0 text-sm font-semibold text-[#993c1d]">
        {CURRENCY.format(Number(liability.balance))}
      </p>

      <RowActions onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

// ── Category shell ────────────────────────────────────────────────────────
function CategoryShell({
  label,
  icon,
  total,
  count,
  onAdd,
  children,
}: {
  label: string;
  icon: string;
  total: number;
  count: number;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="overflow-hidden rounded-xl border border-[#d9d0c1] bg-[#fbf7ef] shadow-[0_2px_12px_rgba(43,34,24,0.05)]">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 p-5 text-left transition-colors hover:bg-[#f4ede0]"
      >
        <span className="text-lg" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1d211c]">{label}</p>
          <p className="text-xs text-[#9a8f7a]">{count} {count === 1 ? "item" : "items"}</p>
        </div>
        <p className="mr-3 shrink-0 text-base font-bold text-[#1d211c]">
          {CURRENCY.format(total)}
        </p>
        <svg
          className={`h-4 w-4 shrink-0 text-[#9a8f7a] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-[#e4dece]">
          {count === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
              <p className="text-sm text-[#9a8f7a]">Nothing here yet.</p>
              <button
                onClick={onAdd}
                className="text-sm font-medium text-[#7a6332] underline underline-offset-2 hover:text-[#5a4520]"
              >
                Add your first entry
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#e4dece] px-5">{children}</div>
          )}

          {count > 0 && (
            <button
              onClick={onAdd}
              className="flex w-full items-center gap-1.5 border-t border-[#e4dece] px-5 py-3 text-xs font-medium text-[#7a6332] transition-colors hover:bg-[#f4ede0] hover:text-[#5a4520]"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Add to {label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Public section components ─────────────────────────────────────────────
interface AssetCategorySectionProps {
  label: string;
  icon: string;
  total: number;
  items: AssetRead[];
  onAdd: () => void;
  onEdit: (asset: AssetRead) => void;
  onDelete: (asset: AssetRead) => void;
}

interface LiabilityCategorySectionProps {
  label: string;
  icon: string;
  total: number;
  items: LiabilityRead[];
  onAdd: () => void;
  onEdit: (liability: LiabilityRead) => void;
  onDelete: (liability: LiabilityRead) => void;
}

export function AssetCategorySection({
  label,
  icon,
  total,
  items,
  onAdd,
  onEdit,
  onDelete,
}: AssetCategorySectionProps) {
  return (
    <CategoryShell label={label} icon={icon} total={total} count={items.length} onAdd={onAdd}>
      {items.map((asset) => (
        <AssetRow
          key={asset.id}
          asset={asset}
          onEdit={() => onEdit(asset)}
          onDelete={() => onDelete(asset)}
        />
      ))}
    </CategoryShell>
  );
}

export function LiabilityCategorySection({
  label,
  icon,
  total,
  items,
  onAdd,
  onEdit,
  onDelete,
}: LiabilityCategorySectionProps) {
  return (
    <CategoryShell label={label} icon={icon} total={total} count={items.length} onAdd={onAdd}>
      {items.map((liability) => (
        <LiabilityRow
          key={liability.id}
          liability={liability}
          onEdit={() => onEdit(liability)}
          onDelete={() => onDelete(liability)}
        />
      ))}
    </CategoryShell>
  );
}
