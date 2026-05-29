export type DashboardTip = {
  id: string;
  title: string;
  body: string;
};

export const dashboardTips: DashboardTip[] = [
  {
    id: "balance-sheet",
    title: "Balance sheet",
    body: "Track assets and liabilities separately. Net worth only becomes useful when both sides stay current.",
  },
  {
    id: "liquidity",
    title: "Liquidity",
    body: "Keep enough cash for near-term obligations before judging the rest of the portfolio by return alone.",
  },
  {
    id: "debt-cost",
    title: "Debt cost",
    body: "High-interest liabilities usually deserve attention before adding more speculative exposure.",
  },
  {
    id: "cashflow",
    title: "Cashflow",
    body: "Transactions explain movement. Portfolio records explain current state. Keep both clean.",
  },
  {
    id: "concentration",
    title: "Concentration",
    body: "A rising net worth can still hide risk if too much value sits in one asset, employer, or market.",
  },
  {
    id: "tax-reserve",
    title: "Tax reserve",
    body: "Estimated taxes belong in obligations early, not as a surprise after gains or income arrive.",
  },
  {
    id: "review-rhythm",
    title: "Review rhythm",
    body: "Small, regular updates beat rare cleanups. Fresh records make every insight sharper.",
  },
];
