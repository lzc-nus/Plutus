import {
  CashflowBreakdownChart,
  MetricCard,
  NextActionCard,
  RiskItemCard,
  RiskScoreCard,
  SectionHeader,
} from "@/components/wealth-components";
import {
  financialSnapshot,
  inflowBreakdown,
  liabilities,
  nextActions,
  outflowBreakdown,
  riskItems,
  transactions,
  user,
} from "@/data/wealthData";
import { formatCurrency, formatCurrencyWithCents } from "@/lib/format";

export default function OverviewPage() {
  const liabilityBreakdown = liabilities.slice(0, 5);
  const recentMovements = transactions.slice(0, 5);

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 shadow-[0_24px_90px_rgba(43,34,24,0.08)] sm:p-8">
        <div className="relative max-w-4xl">
          <p className="text-sm font-semibold uppercase text-[#7a6332]">
            Welcome back, dear {user.name}.
          </p>
          <h2 className="font-display mt-3 text-4xl font-semibold leading-tight text-[#1d211c] sm:text-5xl">
            Your financial position at a glance.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[#696154]">
            A concise command center for net worth, cashflow, obligations, risk signals, and next actions.
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
          dominant
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
              <RiskItemCard item={item} key={item.id} />
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
