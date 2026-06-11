export type AssetCategory =
  | "stocks"
  | "bonds"
  | "real_estate"
  | "cash"
  | "crypto"
  | "commodities"
  | "private_equity"
  | "other";

export type LiabilityCategory =
  | "mortgage"
  | "auto_loan"
  | "student_loan"
  | "credit_card"
  | "personal_loan"
  | "tax_payable"
  | "other";

export type LiquidityLevel = "high" | "medium" | "low";
export type RiskLevel = "low" | "moderate" | "high" | "very_high";

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  value: number;
  costBasis?: number;
  changePercent?: number;
  liquidity: LiquidityLevel;
  risk: RiskLevel;
  notes?: string;
  acquiredAt?: string;
}

export interface Liability {
  id: string;
  name: string;
  category: LiabilityCategory;
  balance: number;
  originalAmount?: number;
  interestRate?: number;
  monthlyPayment?: number;
  maturityDate?: string;
  notes?: string;
}

export interface CategorySummary<T extends AssetCategory | LiabilityCategory> {
  category: T;
  label: string;
  totalValue: number;
  count: number;
  items: T extends AssetCategory ? Asset[] : Liability[];
}

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  stocks: "Stocks & Equities",
  bonds: "Bonds & Fixed Income",
  real_estate: "Real Estate",
  cash: "Cash & Equivalents",
  crypto: "Crypto & Digital Assets",
  commodities: "Commodities",
  private_equity: "Private Equity",
  other: "Other Assets",
};

export const LIABILITY_CATEGORY_LABELS: Record<LiabilityCategory, string> = {
  mortgage: "Mortgage",
  auto_loan: "Auto Loan",
  student_loan: "Student Loan",
  credit_card: "Credit Card",
  personal_loan: "Personal Loan",
  tax_payable: "Tax Payable",
  other: "Other Liabilities",
};

export const ASSET_CATEGORY_ICONS: Record<AssetCategory, string> = {
  stocks: "ti-trending-up",
  bonds: "ti-file-invoice",
  real_estate: "ti-building-estate",
  cash: "ti-cash",
  crypto: "ti-currency-bitcoin",
  commodities: "ti-tools",
  private_equity: "ti-briefcase",
  other: "ti-dots",
};

export const LIABILITY_CATEGORY_ICONS: Record<LiabilityCategory, string> = {
  mortgage: "ti-home",
  auto_loan: "ti-car",
  student_loan: "ti-school",
  credit_card: "ti-credit-card",
  personal_loan: "ti-user",
  tax_payable: "ti-receipt-tax",
  other: "ti-dots",
};