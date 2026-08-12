import type { LiabilityRead } from "@/lib/api/generated";
import type { LiabilityFilterState } from "@/data/portfolioTypes";

/**
 * Pure function, safe to call on every render.
 */
export function filterLiabilities(
  liabilities: LiabilityRead[],
  filters: LiabilityFilterState
): LiabilityRead[] {
  const search = filters.search.trim().toLowerCase();

  const rateMin = filters.rateMin === "" ? null : Number(filters.rateMin);
  const rateMax = filters.rateMax === "" ? null : Number(filters.rateMax);

  const balanceMin = filters.balanceMin === "" ? null : Number(filters.balanceMin);
  const balanceMax = filters.balanceMax === "" ? null : Number(filters.balanceMax);

  const maturityFrom = filters.maturityFrom || null;
  const maturityTo = filters.maturityTo || null;

  return liabilities.filter(liability => {
    // Name search
    if (search && !liability.name.toLowerCase().includes(search)) {
      return false;
    }

    // Category
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(liability.category as LiabilityFilterState["categories"][number])
    ) {
      return false;
    }

    // Interest rate range — liabilities without a rate are excluded if a rate filter is set
    if (rateMin !== null || rateMax !== null) {
      if (liability.interest_rate == null) {
        return false;
      }

      const rate = Number(liability.interest_rate);
      
      if (rateMin !== null && !Number.isNaN(rateMin) && rate < rateMin) {
        return false;
      }
      if (rateMax !== null && !Number.isNaN(rateMax) && rate > rateMax) {
        return false;
      }
    }

    // Balance range
    const balance = Number(liability.balance);
    if (balanceMin !== null && !Number.isNaN(balanceMin) && balance < balanceMin) {
      return false;
    }
    if (balanceMax !== null && !Number.isNaN(balanceMax) && balance > balanceMax) {
      return false;
    }

    // Maturity date range — liabilities without a maturity date are excluded if a date filter is set
    if (maturityFrom || maturityTo) {
      if (!liability.maturity_date) {
        return false;
      }
      if (maturityFrom && liability.maturity_date < maturityFrom) {
        return false;
      }
      if (maturityTo && liability.maturity_date > maturityTo) {
        return false;
      }
    }

    return true;
  });
}