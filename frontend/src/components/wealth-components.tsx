"use client";

import { useMemo, useState } from "react";
import type {
  AIReportSection,
  Asset,
  CashflowBreakdownItem,
  Goal,
  Liability,
  NextAction,
  RiskItem,
  Transaction,
  TransactionRange,
} from "@/data/wealthData";
import {
  formatCurrency,
  formatCurrencyWithCents,
  formatPercent,
} from "@/lib/format";

export type PageKey = "overview" | "portfolio" | "ai-insight" | "strategy";

const navItems: { key: PageKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "portfolio", label: "Portfolio" },
  { key: "ai-insight", label: "AI Insight" },
  { key: "strategy", label: "Strategy" },
];

export function PageShell({ activePage, onNavigate, children, }: {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f4efe6] text-[#1d211c]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-5 sm:px-8 lg:px-10">
        <TopNav activePage={activePage} onNavigate={onNavigate} />
        {children}
      </div>
    </main>
  );
}

export function TopNav({
  activePage,
  onNavigate,
}: {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d9d0c1] pb-5">
      <button
        className="brand-logo font-display text-left font-semibold"
        onClick={() => onNavigate("overview")}
        type="button"
      >
        Two Sicilies
      </button>
      <nav
        aria-label="Primary navigation"
        className="order-3 flex w-full items-center gap-2 overflow-x-auto text-sm font-medium text-[#696154] md:order-2 md:w-auto md:gap-3"
      >
        {navItems.map((item) => (
          <button
            aria-current={activePage === item.key ? "page" : undefined}
            className={`h-10 shrink-0 rounded-md px-3 transition ${
              activePage === item.key
                ? "bg-[#1d211c] text-[#fbf7ef]"
                : "text-[#696154] hover:bg-[#e9e1d3] hover:text-[#1d211c]"
            }`}
            key={item.key}
            onClick={() => onNavigate(item.key)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
      <button
        className="group order-2 inline-flex h-11 items-center gap-3 rounded-full border border-[#c8b58a] bg-[#fbf7ef] py-1 pl-1.5 pr-4 text-sm font-semibold text-[#2a241b] shadow-[0_10px_30px_rgba(43,34,24,0.08)] transition hover:border-[#8f6f2d] hover:bg-[#fffaf2] md:order-3"
        onClick={() => onNavigate("ai-insight")}
        type="button"
      >
        <span className="relative grid size-8 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_25%,#f5e8ff_0%,#a78bfa_35%,#6d28d9_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_0_0_3px_rgba(124,58,237,0.12)] transition group-hover:scale-105">
          <span className="absolute inset-0 rounded-full border border-white/35" />
          <svg
            aria-hidden="true"
            className="relative size-4.5 text-white drop-shadow-sm"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M13.4 4.5 15.2 10l5.3 2-5.3 2-1.8 5.5-1.9-5.5-5.2-2 5.2-2 1.9-5.5Z"
              stroke="currentColor"
              strokeLinejoin="round"
              strokeWidth="2.4"
            />
            <path
              d="m5.9 4 .8 2.3 2.4.9-2.4.9-.8 2.3L5 8.1l-2.3-.9L5 6.3 5.9 4Z"
              stroke="currentColor"
              strokeLinejoin="round"
              strokeWidth="2.2"
            />
          </svg>
        </span>
        <span className="leading-none">
          <span className="block text-[11px] font-semibold uppercase text-[#8f6f2d]">
            AI
          </span>
          <span className="block">Open brief</span>
        </span>
      </button>
    </header>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold uppercase text-[#8f6f2d]">
          {eyebrow}
        </p>
        <h2 className="font-display mt-2 text-4xl font-semibold leading-tight">
          {title}
        </h2>
      </div>
      {description ? (
        <p className="max-w-md text-sm leading-6 text-[#696154]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  sublabel,
  dominant,
}: {
  label: string;
  value: string;
  sublabel: string;
  dominant?: boolean;
}) {
  return (
    <article
      className={`rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 shadow-[0_18px_70px_rgba(43,34,24,0.06)] ${
        dominant ? "md:col-span-2" : ""
      }`}
    >
      <p className="text-sm font-semibold uppercase text-[#8f6f2d]">{label}</p>
      <p
        className={`mt-4 font-semibold tracking-tight ${
          dominant ? "text-6xl" : "text-4xl"
        }`}
      >
        {value}
      </p>
      <p className="mt-3 text-sm text-[#696154]">{sublabel}</p>
    </article>
  );
}

export function CashflowBreakdownChart({
  title,
  total,
  subtitle,
  items,
  colors,
}: {
  title: string;
  total: number;
  subtitle: string;
  items: CashflowBreakdownItem[];
  colors: string[];
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segments = items.reduce<
    (CashflowBreakdownItem & { length: number; offset: number })[]
  >((accumulator, item) => {
    const length = circumference * (item.percentage / 100);
    const offset = accumulator.reduce(
      (totalOffset, segment) => totalOffset + segment.length,
      0,
    );
    return [...accumulator, { ...item, length, offset }];
  }, []);

  return (
    <article className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 shadow-[0_18px_70px_rgba(43,34,24,0.06)]">
      <p className="text-sm font-semibold uppercase text-[#8f6f2d]">
        {title}
      </p>
      <div className="mt-5 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="relative size-44">
          <svg
            aria-label={`${title} breakdown pie chart`}
            className="-rotate-90"
            role="img"
            viewBox="0 0 120 120"
          >
            <circle
              cx="60"
              cy="60"
              fill="transparent"
              r={radius}
              stroke="#e5ddcf"
              strokeWidth="18"
            />
            {segments.map((item, index) => (
                <circle
                  cx="60"
                  cy="60"
                  fill="transparent"
                  key={item.id}
                  r={radius}
                  stroke={colors[index % colors.length]}
                  strokeDasharray={`${item.length} ${
                    circumference - item.length
                  }`}
                  strokeDashoffset={-item.offset}
                  strokeLinecap="butt"
                  strokeWidth="18"
                />
            ))}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-xs uppercase text-[#8a8173]">Total</p>
              <p className="text-xl font-semibold">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {items.map((item, index) => (
            <CashflowBreakdownLegend
              color={colors[index % colors.length]}
              item={item}
              key={item.id}
            />
          ))}
          <p className="border-t border-[#e2dacd] pt-4 text-sm leading-6 text-[#696154]">
            {subtitle}
          </p>
        </div>
      </div>
    </article>
  );
}

function CashflowBreakdownLegend({
  color,
  item,
}: {
  color: string;
  item: CashflowBreakdownItem;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4">
      <div className="flex items-center gap-3">
        <span
          className="size-3 rounded-sm"
          style={{ backgroundColor: color }}
        />
        <div>
          <p className="font-semibold">{item.label}</p>
          <p className="text-sm text-[#756d60]">
            {item.percentage}% of monthly total
          </p>
        </div>
      </div>
      <p className="font-semibold">{formatCurrency(item.value)}</p>
    </div>
  );
}

export function WealthEquation({
  assets,
  liabilities,
  netWorth,
}: {
  assets: number;
  liabilities: number;
  netWorth: number;
}) {
  return (
    <section className="rounded-lg bg-[#1d211c] p-6 text-[#fbf7ef] shadow-[0_24px_90px_rgba(43,34,24,0.12)] sm:p-8">
      <p className="text-sm font-semibold uppercase text-[#c3a35d]">
        Net worth composition
      </p>
      <div className="mt-6 grid gap-4 text-center md:grid-cols-[1fr_auto_1fr_auto_1.1fr] md:items-center">
        <EquationTerm label="Assets" value={formatCurrency(assets)} />
        <EquationSymbol symbol="-" />
        <EquationTerm label="Liabilities" value={formatCurrency(liabilities)} />
        <EquationSymbol symbol="=" />
        <EquationTerm label="Net Worth" value={formatCurrency(netWorth)} />
      </div>
    </section>
  );
}

function EquationTerm({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-[#cfc5b4]">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function EquationSymbol({ symbol }: { symbol: string }) {
  return <p className="font-display text-4xl text-[#c3a35d]">{symbol}</p>;
}

export function AssetCard({ asset }: { asset: Asset }) {
  return (
    <article className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{asset.name}</p>
          <p className="mt-1 text-sm text-[#756d60]">{asset.category}</p>
        </div>
        <span className="rounded-md border border-[#d0c5b3] px-2 py-1 text-xs font-semibold text-[#6f5a24]">
          {asset.liquidity}
        </span>
      </div>
      <p className="mt-6 text-3xl font-semibold">{formatCurrency(asset.value)}</p>
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <SmallStat label="Share" value={`${asset.percentage.toFixed(1)}%`} />
        <SmallStat label="Change" value={formatPercent(asset.change)} />
        <SmallStat label="Risk" value={asset.riskLabel} />
      </div>
    </article>
  );
}

export function LiabilityCard({ liability }: { liability: Liability }) {
  return (
    <article className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{liability.name}</p>
          <p className="mt-1 text-sm text-[#756d60]">{liability.riskLabel}</p>
        </div>
        <span className="text-sm font-semibold text-[#8f3f32]">
          {liability.interestRate.toFixed(1)}%
        </span>
      </div>
      <p className="mt-6 text-3xl font-semibold">
        {formatCurrency(liability.balance)}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <SmallStat
          label="Monthly"
          value={formatCurrency(liability.monthlyPayment)}
        />
        <SmallStat label="Maturity" value={liability.maturity} />
      </div>
    </article>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-[#8a8173]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

export function RiskScoreCard({
  score,
  label,
  summary,
}: {
  score: number;
  label: string;
  summary: string;
}) {
  return (
    <article className="rounded-lg bg-[#1d211c] p-6 text-[#fbf7ef] sm:p-7">
      <p className="text-sm font-semibold uppercase text-[#c3a35d]">
        AI risk score
      </p>
      <div className="mt-5 flex items-end gap-3">
        <p className="text-6xl font-semibold">{score}</p>
        <p className="pb-2 text-xl text-[#cfc5b4]">/ 100</p>
      </div>
      <p className="mt-4 text-2xl font-semibold">{label}</p>
      <p className="mt-3 text-sm leading-6 text-[#d9d0c1]">{summary}</p>
    </article>
  );
}

export function RiskItemCard({
  item,
  onViewInsight,
}: {
  item: RiskItem;
  onViewInsight: () => void;
}) {
  return (
    <article className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-semibold">{item.title}</h3>
        <span className="rounded-md bg-[#eadfc9] px-2 py-1 text-xs font-semibold text-[#8f3f32]">
          {item.severity}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#696154]">{item.reason}</p>
      <button
        className="mt-4 text-sm font-semibold text-[#8f6f2d] underline-offset-4 hover:underline"
        onClick={onViewInsight}
        type="button"
      >
        View in AI Insight
      </button>
    </article>
  );
}

export function NextActionCard({ action }: { action: NextAction }) {
  return (
    <article className="border-l border-[#c3a35d] bg-[#fbf7ef] py-1 pl-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{action.title}</h3>
        <span className="rounded-md border border-[#d0c5b3] px-2 py-1 text-xs font-semibold text-[#6f5a24]">
          {action.priority}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#696154]">
        {action.explanation}
      </p>
      <p className="mt-2 text-xs uppercase text-[#8a8173]">{action.due}</p>
    </article>
  );
}

export function TransactionRangeToggle({
  value,
  onChange,
}: {
  value: TransactionRange;
  onChange: (value: TransactionRange) => void;
}) {
  const ranges: TransactionRange[] = ["1D", "1M", "1Y"];
  return (
    <div className="inline-flex rounded-md border border-[#d0c5b3] bg-[#f4efe6] p-1">
      {ranges.map((range) => (
        <button
          className={`h-9 rounded px-4 text-sm font-semibold transition ${
            value === range
              ? "bg-[#1d211c] text-[#fbf7ef]"
              : "text-[#696154] hover:text-[#1d211c]"
          }`}
          key={range}
          onClick={() => onChange(range)}
          type="button"
        >
          {range}
        </button>
      ))}
    </div>
  );
}

export function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#d9d0c1] bg-[#fbf7ef]">
      <div className="hidden grid-cols-[0.9fr_1.4fr_0.9fr_1fr_0.8fr_1fr] gap-4 border-b border-[#d9d0c1] px-5 py-3 text-xs font-semibold uppercase text-[#8a8173] lg:grid">
        <span>Date</span>
        <span>Description</span>
        <span>Category</span>
        <span>Account</span>
        <span className="text-right">Amount</span>
        <span>Impact</span>
      </div>
      <div className="divide-y divide-[#e2dacd]">
        {transactions.map((item) => (
          <div
            className="grid gap-3 px-5 py-4 text-sm lg:grid-cols-[0.9fr_1.4fr_0.9fr_1fr_0.8fr_1fr] lg:items-center"
            key={item.id}
          >
            <p className="text-[#756d60]">{item.date}</p>
            <p className="font-semibold">{item.description}</p>
            <p>{item.category}</p>
            <p className="text-[#756d60]">{item.account}</p>
            <p
              className={`font-semibold lg:text-right ${
                item.amount > 0 ? "text-[#1f6b48]" : "text-[#8f3f32]"
              }`}
            >
              {formatCurrencyWithCents(item.amount)}
            </p>
            <p>
              <span className="rounded-md border border-[#d0c5b3] px-2 py-1 text-xs font-semibold text-[#6f5a24]">
                {item.impact}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AIReportCard({
  score,
  label,
  sections,
}: {
  score: number;
  label: string;
  sections: AIReportSection[];
}) {
  return (
    <article id="risk-report" className="rounded-lg bg-[#fbf7ef] p-6 sm:p-8">
      <div className="border-b border-[#d9d0c1] pb-6">
        <p className="text-sm font-semibold uppercase text-[#8f6f2d]">
          AI generated report
        </p>
        <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="font-display text-5xl font-semibold">
            Private wealth memorandum
          </h2>
          <p className="text-lg font-semibold">
            Risk Score: {score} / 100 · {label}
          </p>
        </div>
      </div>
      <div className="mt-8 grid gap-6">
        {sections.map((section) => (
          <section className="max-w-4xl" key={section.id}>
            <h3 className="font-display text-3xl font-semibold">
              {section.title}
            </h3>
            <p className="mt-3 text-base leading-8 text-[#575044]">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}

export function GoalCard({ goal }: { goal: Goal }) {
  const progress = Math.round((goal.currentAmount / goal.targetAmount) * 100);
  return (
    <article className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{goal.title}</h3>
          <p className="mt-1 text-sm text-[#756d60]">{goal.note}</p>
        </div>
        <span className="rounded-md border border-[#d0c5b3] px-2 py-1 text-xs font-semibold text-[#6f5a24]">
          {goal.status}
        </span>
      </div>
      <div className="mt-5 h-2 rounded-full bg-[#e5ddcf]">
        <div
          className="h-2 rounded-full bg-[#33483d]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <SmallStat label="Target" value={formatCurrency(goal.targetAmount)} />
        <SmallStat label="Progress" value={`${progress}%`} />
        <SmallStat label="Horizon" value={goal.horizon} />
      </div>
    </article>
  );
}

export function WhatIfPanel() {
  const [scenario, setScenario] = useState("I buy a $120,000 car next year");
  const [submitted, setSubmitted] = useState(scenario);

  const analysis = useMemo(() => {
    const normalized = submitted.toLowerCase();
    const carScenario = normalized.includes("car");
    const debtScenario =
      normalized.includes("debt") || normalized.includes("credit facility");
    const investScenario =
      normalized.includes("invest") || normalized.includes("etf");

    if (debtScenario) {
      return {
        title: "Debt reduction scenario",
        score: "Risk score may fall from 72 to 68.",
        recommendation:
          "Prioritize variable-rate and high-interest balances before adding illiquid assets.",
      };
    }

    if (investScenario) {
      return {
        title: "Systematic investment scenario",
        score: "Risk score may remain near 72 if liquidity buffers are preserved.",
        recommendation:
          "Increase ETF allocation only after keeping emergency reserves above six months of obligations.",
      };
    }

    if (carScenario) {
      return {
        title: "Vehicle purchase scenario",
        score: "Risk score may rise from 72 to 76.",
        recommendation:
          "Purchase only if safe-to-spend remains positive after down payment, insurance, and emergency reserve requirements.",
      };
    }

    return {
      title: "Scenario analysis",
      score: "Risk score impact depends on financing terms and timing.",
      recommendation:
        "Keep the decision reversible until liquidity, liabilities, and goal progress are measured against the plan.",
    };
  }, [submitted]);

  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6">
        <p className="text-sm font-semibold uppercase text-[#8f6f2d]">
          What if
        </p>
        <label
          className="mt-4 block text-sm font-semibold text-[#353026]"
          htmlFor="scenario"
        >
          Scenario
        </label>
        <textarea
          className="mt-3 min-h-36 w-full resize-none rounded-md border border-[#d0c5b3] bg-[#fffaf2] p-4 text-base outline-[#8f6f2d]"
          id="scenario"
          onChange={(event) => setScenario(event.target.value)}
          value={scenario}
        />
        <button
          className="mt-4 h-11 rounded-md bg-[#1d211c] px-4 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343b32]"
          onClick={() => setSubmitted(scenario)}
          type="button"
        >
          Run what-if analysis
        </button>
      </div>

      <article className="rounded-lg bg-[#1d211c] p-6 text-[#fbf7ef]">
        <p className="text-sm font-semibold uppercase text-[#c3a35d]">
          Preserved analysis
        </p>
        <h3 className="font-display mt-3 text-4xl font-semibold">
          {analysis.title}
        </h3>
        <div className="mt-6 grid gap-4 text-sm leading-6 text-[#e7dfd0]">
          <p>Scenario: {submitted}</p>
          <p>Net worth: depreciating or financed purchases reduce flexibility.</p>
          <p>Cashflow: monthly obligations should stay below planned surplus.</p>
          <p>Liabilities: new borrowing increases repayment sensitivity.</p>
          <p>{analysis.score}</p>
          <p>Goal progress: near-term goals slow if reserves are used.</p>
          <p>Recommendation: {analysis.recommendation}</p>
          <p>
            Assumptions: no major market drawdown, stable income, and current
            liability rates remain within the modeled range.
          </p>
        </div>
      </article>
    </section>
  );
}

export function PdfExportButton() {
  return (
    <button
      className="h-11 rounded-md bg-[#1d211c] px-4 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343b32]"
      onClick={() => window.print()}
      type="button"
    >
      Save as PDF
    </button>
  );
}

export function AllocationBar({ assets }: { assets: Asset[] }) {
  const colors = [
    "#33483d",
    "#b99a52",
    "#9b5548",
    "#6f7568",
    "#c8b58a",
    "#5d4e3e",
    "#d8d0c1",
    "#8a8173",
    "#a97f63",
    "#566e63",
    "#7b6b52",
  ];

  return (
    <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6">
      <div className="flex h-5 overflow-hidden rounded-sm bg-[#e5ddcf]">
        {assets.map((asset, index) => (
          <div
            key={asset.id}
            style={{
              width: `${asset.percentage}%`,
              backgroundColor: colors[index % colors.length],
            }}
            title={`${asset.name}: ${asset.percentage}%`}
          />
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset, index) => (
          <div className="flex items-center gap-2 text-sm" key={asset.id}>
            <span
              className="size-3 rounded-sm"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-[#696154]">{asset.name}</span>
            <span className="font-semibold">{asset.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
