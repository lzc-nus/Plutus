import type { AssetRead } from "@/lib/api/generated";
import type { AssetFilterState } from "@/data/portfolioTypes";

/**
 * Pure function, safe to call on every render.
 */
export function filterAssets(assets: AssetRead[], filters: AssetFilterState): AssetRead[] {
  const search = filters.search.trim().toLowerCase();

  const valueMin = filters.valueMin === "" ? null : Number(filters.valueMin);
  const valueMax = filters.valueMax === "" ? null : Number(filters.valueMax);

  const acquiredFrom = filters.acquiredFrom || null;
  const acquiredTo = filters.acquiredTo || null;

  return assets.filter(asset => {
    // Name search
    if (search && !asset.name.toLowerCase().includes(search)) {
      return false;
    }

    // Category
    if (filters.categories.length > 0 && !filters.categories.includes(asset.category as AssetFilterState["categories"][number])) {
      return false;
    }

    // Risk
    if (filters.riskLevels.length > 0 && !filters.riskLevels.includes(asset.risk as AssetFilterState["riskLevels"][number])) {
      return false;
    }

    // Liquidity
    if (
      filters.liquidityLevels.length > 0 &&
      !filters.liquidityLevels.includes(asset.liquidity as AssetFilterState["liquidityLevels"][number])
    ) {
      return false;
    }

    // Value range
    const value = Number(asset.value);
    if (valueMin !== null && !Number.isNaN(valueMin) && value < valueMin) {
      return false;
    }
    if (valueMax !== null && !Number.isNaN(valueMax) && value > valueMax) {
      return false;
    }

    // Acquired date range
    if (acquiredFrom || acquiredTo) {
      if (!asset.acquired_at) {
        return false;
      }
      if (acquiredFrom && asset.acquired_at < acquiredFrom) {
        return false;
      }
      if (acquiredTo && asset.acquired_at > acquiredTo) {
        return false;
      }
    }

    return true;
  });
}