import { GoalCard, SectionHeader, WhatIfPanel } from "@/components/wealth-components";
import { goals, strategyRecommendations } from "@/data/wealthData";

export default function StrategyPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-[#d9d0c1] bg-[#e1ded8] p-6 sm:p-8">
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
