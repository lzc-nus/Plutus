export type Asset = {
  id: string;
  name: string;
  category: string;
  value: number;
  percentage: number;
  change: number;
  liquidity: "Liquid" | "Semi-liquid" | "Illiquid";
  riskLabel: string;
};

export type Liability = {
  id: string;
  name: string;
  balance: number;
  monthlyPayment: number;
  interestRate: number;
  maturity: string;
  riskLabel: string;
};

export type TransactionRange = "1D" | "1M" | "1Y";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  account: string;
  amount: number;
  impact: string;
  range: TransactionRange[];
};

export type RiskItem = {
  id: string;
  title: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  reason: string;
};

export type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  horizon: string;
  status: string;
  note: string;
};

export type NextAction = {
  id: string;
  title: string;
  explanation: string;
  priority: "Medium" | "High" | "Critical";
  due: string;
};

export type CashflowBreakdownItem = {
  id: string;
  label: string;
  value: number;
  percentage: number;
};

export type AIReportSection = {
  id: string;
  title: string;
  body: string;
};

export const financialSnapshot = {
  netWorth: 1207840,
  inflow: 18420,
  outflow: 11760,
  safeToSpend: 3850,
  totalAssets: 1452300,
  totalLiabilities: 244460,
  monthlyRepayment: 6840,
  liabilityRisk: "Moderate interest-rate sensitivity",
  riskScore: 72,
  riskLabel: "Elevated",
  riskSummary:
    "Concentration, leverage, and liquidity exposure require attention.",
};

export const inflowBreakdown: CashflowBreakdownItem[] = [
  { id: "salary", label: "Salary", value: 7368, percentage: 40 },
  { id: "business", label: "Business income", value: 4605, percentage: 25 },
  { id: "dividends", label: "Dividends", value: 2763, percentage: 15 },
  { id: "interest", label: "Interest", value: 1842, percentage: 10 },
  { id: "other", label: "Other inflow", value: 1842, percentage: 10 },
];

export const outflowBreakdown: CashflowBreakdownItem[] = [
  { id: "housing", label: "Housing", value: 4116, percentage: 35 },
  { id: "investments", label: "Investments", value: 2352, percentage: 20 },
  { id: "card", label: "Credit card", value: 1764, percentage: 15 },
  { id: "tax", label: "Tax reserve", value: 1764, percentage: 15 },
  { id: "lifestyle", label: "Lifestyle", value: 1176, percentage: 10 },
  { id: "other", label: "Other outflow", value: 588, percentage: 5 },
];

export const assets: Asset[] = [
  {
    id: "stocks",
    name: "Stocks",
    category: "Public markets",
    value: 420000,
    percentage: 28.9,
    change: 4.2,
    liquidity: "Liquid",
    riskLabel: "Market risk",
  },
  {
    id: "cash",
    name: "Cash",
    category: "Banking",
    value: 126480,
    percentage: 8.7,
    change: 2.4,
    liquidity: "Liquid",
    riskLabel: "Liquid",
  },
  {
    id: "futures",
    name: "Futures",
    category: "Derivatives",
    value: 58000,
    percentage: 4.0,
    change: -1.8,
    liquidity: "Liquid",
    riskLabel: "Leveraged",
  },
  {
    id: "options",
    name: "Options",
    category: "Derivatives",
    value: 35700,
    percentage: 2.5,
    change: 8.1,
    liquidity: "Liquid",
    riskLabel: "High convexity",
  },
  {
    id: "etfs",
    name: "ETFs",
    category: "Public markets",
    value: 210000,
    percentage: 14.5,
    change: 3.6,
    liquidity: "Liquid",
    riskLabel: "Diversified",
  },
  {
    id: "commodities",
    name: "Commodities",
    category: "Real assets",
    value: 88400,
    percentage: 6.1,
    change: 1.1,
    liquidity: "Semi-liquid",
    riskLabel: "Inflation hedge",
  },
  {
    id: "house",
    name: "House",
    category: "Real estate",
    value: 480000,
    percentage: 33.1,
    change: 0.5,
    liquidity: "Illiquid",
    riskLabel: "Illiquid",
  },
  {
    id: "cars",
    name: "Cars",
    category: "Personal assets",
    value: 42000,
    percentage: 2.9,
    change: -1.2,
    liquidity: "Illiquid",
    riskLabel: "Depreciating",
  },
  {
    id: "jewelry",
    name: "Jewelry",
    category: "Alternatives",
    value: 18000,
    percentage: 1.2,
    change: 0,
    liquidity: "Illiquid",
    riskLabel: "Alternative",
  },
  {
    id: "private-credit",
    name: "Private credit",
    category: "Alternatives",
    value: 91200,
    percentage: 6.3,
    change: 4.1,
    liquidity: "Semi-liquid",
    riskLabel: "Credit risk",
  },
  {
    id: "crypto",
    name: "Crypto",
    category: "Digital assets",
    value: 32420,
    percentage: 2.2,
    change: 11.4,
    liquidity: "Liquid",
    riskLabel: "Volatile",
  },
];

export const liabilities: Liability[] = [
  {
    id: "mortgage",
    name: "Mortgage",
    balance: 176000,
    monthlyPayment: 4200,
    interestRate: 4.9,
    maturity: "2046",
    riskLabel: "Secured, long duration",
  },
  {
    id: "credit-card",
    name: "Credit card balance",
    balance: 8450,
    monthlyPayment: 1250,
    interestRate: 19.8,
    maturity: "Rolling",
    riskLabel: "High interest",
  },
  {
    id: "student-loan",
    name: "Student loan",
    balance: 21900,
    monthlyPayment: 540,
    interestRate: 5.2,
    maturity: "2032",
    riskLabel: "Fixed repayment",
  },
  {
    id: "personal-loan",
    name: "Personal loan",
    balance: 12200,
    monthlyPayment: 430,
    interestRate: 8.6,
    maturity: "2029",
    riskLabel: "Medium interest",
  },
  {
    id: "credit-facility",
    name: "Credit facility",
    balance: 23400,
    monthlyPayment: 320,
    interestRate: 7.4,
    maturity: "On demand",
    riskLabel: "Variable rate",
  },
  {
    id: "margin-loan",
    name: "Margin loan",
    balance: 25000,
    monthlyPayment: 100,
    interestRate: 8.1,
    maturity: "Callable",
    riskLabel: "Collateral risk",
  },
  {
    id: "other-debt",
    name: "Other debt",
    balance: 7500,
    monthlyPayment: 0,
    interestRate: 0,
    maturity: "Unscheduled",
    riskLabel: "Monitor",
  },
];

export const riskItems: RiskItem[] = [
  {
    id: "single-stock",
    title: "Single-stock concentration",
    severity: "High",
    reason: "One issuer represents 18% of liquid public-market exposure.",
  },
  {
    id: "short-term-liability",
    title: "High short-term liability load",
    severity: "High",
    reason: "Rolling debt and credit balances absorb near-term cashflow.",
  },
  {
    id: "cash-buffer",
    title: "Low cash buffer relative to commitments",
    severity: "Medium",
    reason: "Liquid reserve covers 4.7 months of committed outflows.",
  },
  {
    id: "options-expiry",
    title: "Option exposure expiring within 30 days",
    severity: "Critical",
    reason: "Convex exposure could require fast collateral decisions.",
  },
];

export const nextActions: NextAction[] = [
  {
    id: "idle-cash",
    title: "Review idle cash",
    explanation:
      "Shift $18,000 into short-term Treasuries or money market equivalents.",
    priority: "High",
    due: "Generated today",
  },
  {
    id: "concentration",
    title: "Lower concentration",
    explanation: "Reduce single-stock exposure by 4% over the next rebalance.",
    priority: "High",
    due: "Due this week",
  },
  {
    id: "tax-review",
    title: "Tax review",
    explanation: "Harvest eligible losses before the next reporting cycle.",
    priority: "Medium",
    due: "Before month-end",
  },
];

export const transactions: Transaction[] = [
  {
    id: "salary",
    date: "May 15, 2026",
    description: "Salary credited",
    category: "Income",
    account: "Operating cash",
    amount: 8500,
    impact: "Positive cashflow",
    range: ["1D", "1M", "1Y"],
  },
  {
    id: "etf-buy",
    date: "May 14, 2026",
    description: "ETF purchase",
    category: "Investment",
    account: "Brokerage",
    amount: -2400,
    impact: "Diversification",
    range: ["1M", "1Y"],
  },
  {
    id: "option-premium",
    date: "May 13, 2026",
    description: "Option premium paid",
    category: "Derivatives",
    account: "Options book",
    amount: -740,
    impact: "Convex risk",
    range: ["1M", "1Y"],
  },
  {
    id: "margin-call",
    date: "May 12, 2026",
    description: "Futures margin call",
    category: "Derivatives",
    account: "Futures account",
    amount: -1100,
    impact: "Liquidity drag",
    range: ["1M", "1Y"],
  },
  {
    id: "dividend",
    date: "May 10, 2026",
    description: "Dividend received",
    category: "Income",
    account: "Global equity mandate",
    amount: 320,
    impact: "Income",
    range: ["1M", "1Y"],
  },
  {
    id: "card-payment",
    date: "May 08, 2026",
    description: "Credit card payment",
    category: "Liability",
    account: "Premium card",
    amount: -1250,
    impact: "Debt reduction",
    range: ["1M", "1Y"],
  },
  {
    id: "mortgage",
    date: "Apr 30, 2026",
    description: "Mortgage repayment",
    category: "Liability",
    account: "Primary residence",
    amount: -4200,
    impact: "Fixed obligation",
    range: ["1M", "1Y"],
  },
  {
    id: "commodity",
    date: "Mar 18, 2026",
    description: "Commodity position increase",
    category: "Real assets",
    account: "Commodities sleeve",
    amount: -9800,
    impact: "Inflation hedge",
    range: ["1Y"],
  },
  {
    id: "jewelry",
    date: "Feb 12, 2026",
    description: "Jewelry appraisal update",
    category: "Alternatives",
    account: "Private inventory",
    amount: 1200,
    impact: "Illiquid mark",
    range: ["1Y"],
  },
  {
    id: "car-depreciation",
    date: "Jan 31, 2026",
    description: "Car depreciation adjustment",
    category: "Personal assets",
    account: "Vehicle book",
    amount: -1800,
    impact: "Depreciation",
    range: ["1Y"],
  },
];

export const goals: Goal[] = [
  {
    id: "property",
    title: "Buy property in 5 years",
    targetAmount: 250000,
    currentAmount: 105000,
    horizon: "5 years",
    status: "On watch",
    note: "Down payment plan needs higher monthly surplus.",
  },
  {
    id: "emergency",
    title: "Build emergency fund",
    targetAmount: 60000,
    currentAmount: 42600,
    horizon: "14 months",
    status: "On track",
    note: "Reserve covers most essential obligations.",
  },
  {
    id: "retirement",
    title: "Retirement portfolio",
    targetAmount: 2500000,
    currentAmount: 775000,
    horizon: "18 years",
    status: "On track",
    note: "Compounding rate remains acceptable.",
  },
  {
    id: "car",
    title: "Car purchase",
    targetAmount: 120000,
    currentAmount: 21600,
    horizon: "18 months",
    status: "Behind",
    note: "Purchase would pressure liquidity if financed.",
  },
];

export const aiReportSections: AIReportSection[] = [
  {
    id: "executive-summary",
    title: "Executive Summary",
    body: "The household balance sheet remains strong, with high asset coverage and positive monthly inflow. The near-term concern is not solvency; it is liquidity discipline under leverage, derivatives exposure, and concentrated equity risk.",
  },
  {
    id: "risk-score",
    title: "Risk Score Explanation",
    body: "Risk Score is 72 / 100, labeled Elevated. The score is driven by equity concentration, leveraged derivatives exposure, short-term liabilities, and a cash buffer that is low relative to committed obligations.",
  },
  {
    id: "key-risk-drivers",
    title: "Key Risk Drivers",
    body: "The largest contributors are single-stock exposure, futures margin variability, option expirations inside 30 days, and high-interest revolving credit. These items can interact during volatility and force decisions at unfavorable moments.",
  },
  {
    id: "liquidity",
    title: "Liquidity Assessment",
    body: "Liquid assets remain meaningful, but the spendable reserve after obligations is thinner than the portfolio size suggests. Idle cash should be segmented into operating cash, emergency reserve, and yield-bearing reserve.",
  },
  {
    id: "concentration",
    title: "Concentration Assessment",
    body: "Single-name equity exposure is above the target band for a private wealth mandate. A gradual reduction of 4% over the next rebalance would reduce idiosyncratic risk without forcing a disruptive sale.",
  },
  {
    id: "leverage",
    title: "Liability and Leverage Assessment",
    body: "Mortgage debt is manageable, but margin and credit facility exposure should be watched. Variable-rate balances and callable leverage deserve priority over long-duration secured debt.",
  },
  {
    id: "cashflow",
    title: "Spending and Cashflow Assessment",
    body: "Monthly inflow exceeds outflow, but safe-to-spend remains constrained once obligations, reserve targets, and near-term investment commitments are included.",
  },
  {
    id: "recommended-actions",
    title: "Recommended Actions",
    body: "Reduce concentrated equity exposure, move idle cash into short-term instruments, retire high-interest revolving balances, and review option expiries before adding new risk.",
  },
  {
    id: "confidence",
    title: "Confidence / Assumptions",
    body: "Confidence is medium-high. The analysis assumes current asset marks are accurate, liabilities are complete, and no material tax events or private asset repricings occur this month.",
  },
];

export const strategyRecommendations = [
  "Improve liquidity buffer before adding new illiquid commitments.",
  "Reduce concentrated equity exposure toward the investment policy band.",
  "Rebalance derivative exposure ahead of the next expiry cycle.",
  "Increase systematic ETF allocation from monthly surplus.",
  "Prioritize repayment of high-interest revolving debt.",
];
