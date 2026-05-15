// this file runs as a client component.
"use client";

import { useMemo, useState } from "react";
import {
  AIReportCard,
  AllocationBar,
  AssetCard,
  CashflowBreakdownChart,
  GoalCard,
  LiabilityCard,
  MetricCard,
  NextActionCard,
  PageShell,
  PdfExportButton,
  RiskItemCard,
  RiskScoreCard,
  SectionHeader,
  TransactionList,
  TransactionRangeToggle,
  WealthEquation,
  WhatIfPanel,
  type PageKey,
} from "@/components/wealth-components";
import {
  aiReportSections,
  assets,
  financialSnapshot,
  goals,
  inflowBreakdown,
  liabilities,
  nextActions,
  outflowBreakdown,
  riskItems,
  strategyRecommendations,
  transactions,
  user,
  type TransactionRange,
} from "@/data/wealthData";
import { formatCurrency, formatCurrencyWithCents } from "@/lib/format";

export default function Home() {
  const [activePage, setActivePage] = useState<PageKey>("overview");

  const navigate = (page: PageKey) => {
    setActivePage(page);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <PageShell activePage={activePage} onNavigate={navigate}>
      {activePage === "overview" ? (
        <OverviewPage onNavigate={navigate} />
      ) : null}
      {activePage === "portfolio" ? <PortfolioPage /> : null}
      {activePage === "ai-insight" ? <AIInsightPage /> : null}
      {activePage === "strategy" ? <StrategyPage /> : null}
    </PageShell>
  );
}

function OverviewPage({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const liabilityBreakdown = liabilities.slice(0, 5);
  const recentMovements = transactions.slice(0, 5);

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 shadow-[0_24px_90px_rgba(43,34,24,0.08)] sm:p-8">
        <div className="absolute right-6 top-6 hidden h-28 w-28 rounded-full border border-[#c3a35d] opacity-50 sm:block" />
        <div className="absolute right-12 top-12 hidden h-16 w-16 rounded-full border border-[#c3a35d] opacity-50 sm:block" />
        <div className="relative max-w-4xl">
          <p className="text-sm font-semibold uppercase text-[#8f6f2d]">
            Welcome back, dear {user.position} {user.name}.
          </p>
        </div>
      </section>
      
      <section className="relative overflow-hidden rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 shadow-[0_24px_90px_rgba(43,34,24,0.08)] sm:p-8">
        <div className="absolute right-6 top-6 hidden h-28 w-28 rounded-full border border-[#c3a35d] opacity-50 sm:block" />
        <div className="absolute right-12 top-12 hidden h-16 w-16 rounded-full border border-[#c3a35d] opacity-50 sm:block" />
        <div className="relative max-w-4xl">
          <p className="text-sm font-semibold uppercase text-[#8f6f2d]">
            Renaissance wealth intelligence
          </p>
          <h1 className="font-display mt-5 text-5xl font-semibold leading-none sm:text-6xl lg:text-7xl">
            Private capital, reasoned with precision.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#696154]">
            A private wealth office interface for monitoring assets,
            liabilities, AI risk, and the next decisions that shape long-term
            capital.
          </p>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          dominant
          label="Net Worth"
          sublabel="Total assets less total liabilities"
          value={formatCurrency(financialSnapshot.netWorth)}
        />
        <MetricCard
          label="Safe to Spend"
          sublabel="AI-guided, after obligations"
          value={formatCurrency(financialSnapshot.safeToSpend)}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <CashflowBreakdownChart
          colors={["#33483d", "#5f725e", "#b99a52", "#c8b58a", "#8a8173"]}
          items={inflowBreakdown}
          subtitle="Sources of monthly inflow before obligations and investment decisions."
          title="Inflow breakdown"
          total={financialSnapshot.inflow}
        />
        <CashflowBreakdownChart
          colors={[
            "#9b5548",
            "#b99a52",
            "#6f7568",
            "#5d4e3e",
            "#c8b58a",
            "#8a8173",
          ]}
          items={outflowBreakdown}
          subtitle="Uses of monthly outflow across commitments, reserves, and lifestyle spend."
          title="Outflow breakdown"
          total={financialSnapshot.outflow}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 sm:p-7">
          <SectionHeader
            description="Liabilities are treated as commitments, not alarms. The goal is to preserve optionality and avoid expensive debt drag."
            eyebrow="Liabilities"
            title={formatCurrency(financialSnapshot.totalLiabilities)}
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-[#756d60]">Monthly repayment</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatCurrency(financialSnapshot.monthlyRepayment)}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-[#756d60]">Interest risk</p>
              <p className="mt-1 text-2xl font-semibold">
                {financialSnapshot.liabilityRisk}
              </p>
            </div>
          </div>
          <div className="mt-6 divide-y divide-[#e2dacd]">
            {liabilityBreakdown.map((liability) => (
              <div
                className="grid grid-cols-[1fr_auto] gap-4 py-3 text-sm"
                key={liability.id}
              >
                <div>
                  <p className="font-semibold">{liability.name}</p>
                  <p className="mt-1 text-[#756d60]">{liability.riskLabel}</p>
                </div>
                <p className="font-semibold">
                  {formatCurrency(liability.balance)}
                </p>
              </div>
            ))}
          </div>
        </article>

        <section className="grid gap-5">
          <RiskScoreCard
            label={financialSnapshot.riskLabel}
            score={financialSnapshot.riskScore}
            summary={financialSnapshot.riskSummary}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {riskItems.map((item) => (
              <RiskItemCard
                item={item}
                key={item.id}
                onViewInsight={() => onNavigate("ai-insight")}
              />
            ))}
          </div>
        </section>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <article className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 sm:p-7">
          <SectionHeader eyebrow="Next actions" title="Most urgent" />
          <div className="mt-6 grid gap-5">
            {nextActions.map((action) => (
              <NextActionCard action={action} key={action.id} />
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 sm:p-7">
          <SectionHeader eyebrow="Recent movements" title="Account activity" />
          <div className="mt-5 divide-y divide-[#e2dacd]">
            {recentMovements.map((movement) => (
              <div
                className="grid gap-2 py-4 sm:grid-cols-[1fr_0.7fr_auto] sm:items-center"
                key={movement.id}
              >
                <div>
                  <p className="font-semibold">{movement.description}</p>
                  <p className="mt-1 text-sm text-[#756d60]">
                    {movement.date} · {movement.category}
                  </p>
                </div>
                <p className="text-sm text-[#756d60]">{movement.account}</p>
                <p
                  className={`font-semibold ${
                    movement.amount > 0 ? "text-[#1f6b48]" : "text-[#8f3f32]"
                  }`}
                >
                  {formatCurrencyWithCents(movement.amount)}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function PortfolioPage() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <SectionHeader
          description="Net worth is counted as all marked assets less all outstanding liabilities, with liquidity and risk kept visible."
          eyebrow="Portfolio"
          title="Complete balance sheet"
        />
        <PdfExportButton />
      </div>

      <WealthEquation
        assets={financialSnapshot.totalAssets}
        liabilities={financialSnapshot.totalLiabilities}
        netWorth={financialSnapshot.netWorth}
      />

      <section className="grid gap-5">
        <SectionHeader
          description="Each asset category is marked with current value, portfolio share, recent change, liquidity, and risk label."
          eyebrow="Assets dashboard"
          title="What you own"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <AssetCard asset={asset} key={asset.id} />
          ))}
        </div>
      </section>

      <section className="grid gap-5">
        <SectionHeader
          description="Liabilities are tracked by balance, monthly payment, rate, maturity, and risk characteristics."
          eyebrow="Liabilities dashboard"
          title="What you owe"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {liabilities.map((liability) => (
            <LiabilityCard liability={liability} key={liability.id} />
          ))}
        </div>
      </section>

      <section className="grid gap-5">
        <SectionHeader
          description="A restrained allocation view for understanding exposure without visual noise."
          eyebrow="Allocation view"
          title="Capital distribution"
        />
        <AllocationBar assets={assets} />
      </section>
    </div>
  );
}

function AIInsightPage() {
  const [range, setRange] = useState<TransactionRange>("1M");
  const visibleTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.range.includes(range)),
    [range],
  );

  return (
    <div className="grid gap-6">
      <section className="rounded-lg bg-[#1d211c] p-6 text-[#fbf7ef] sm:p-8">
        <p className="text-sm font-semibold uppercase text-[#c3a35d]">
          AI Insight
        </p>
        <h1 className="font-display mt-3 text-5xl font-semibold leading-tight">
          Private banking memo, generated from your financial record.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#d9d0c1]">
          Mock report today, structured for a future backend AI response
          tomorrow. The Overview risk score is sourced from this same report
          model.
        </p>
      </section>

      <section className="grid gap-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeader
            description="Switch between daily, monthly, and annual movements."
            eyebrow="Transaction record"
            title="Movements and risk tags"
          />
          <TransactionRangeToggle onChange={setRange} value={range} />
        </div>
        <TransactionList transactions={visibleTransactions} />
      </section>

      <AIReportCard
        label={financialSnapshot.riskLabel}
        score={financialSnapshot.riskScore}
        sections={aiReportSections}
      />
    </div>
  );
}

function StrategyPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 sm:p-8">
        <SectionHeader
          description="Goals are measured against liquidity, liabilities, and current portfolio risk before the system recommends new commitments."
          eyebrow="Strategy"
          title="Goals and what-if planning"
        />
      </section>

      <section className="grid gap-5">
        <SectionHeader eyebrow="Financial goals" title="Capital objectives" />
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <GoalCard goal={goal} key={goal.id} />
          ))}
        </div>
      </section>

      <WhatIfPanel />

      <section className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 sm:p-7">
        <SectionHeader
          description="Recommendations are mock outputs for now, ready to be replaced by strategy API results later."
          eyebrow="Strategy recommendations"
          title="Current priorities"
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {strategyRecommendations.map((recommendation) => (
            <article
              className="border-l border-[#c3a35d] pl-4"
              key={recommendation}
            >
              <p className="text-sm leading-6 text-[#575044]">
                {recommendation}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
