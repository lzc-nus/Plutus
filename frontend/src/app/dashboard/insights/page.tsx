"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/WealthComponents";
import {
  generateInsight,
  type InsightFocus,
  type InsightResponse,
  type InsightSeverity,
  type InsightTimeHorizon,
} from "@/lib/api/insights";
import { saveLatestInsight, useLatestInsight } from "@/lib/insightStorage";

const horizonOptions: { label: string; value: InsightTimeHorizon }[] = [
  { label: "Daily", value: "daily" },
  { label: "Monthly", value: "monthly" },
  { label: "Annual", value: "annual" },
  { label: "All time", value: "all_time" },
];

const focusOptions: { label: string; value: InsightFocus }[] = [
  { label: "Complete", value: "complete" },
  { label: "Cashflow", value: "cashflow" },
  { label: "Portfolio", value: "portfolio" },
  { label: "Risk", value: "risk" },
];

const severityStyles: Record<InsightSeverity, string> = {
  positive: "border-[#9ac5a8] bg-[#e9f4ec] text-[#1f6b48]",
  neutral: "border-[#d0c5b3] bg-[#f4efe6] text-[#5f574b]",
  watch: "border-[#d7bd73] bg-[#f5ebce] text-[#7b5d12]",
  risk: "border-[#d5a58b] bg-[#f2e0d8] text-[#8f3f32]",
};

export default function InsightsPage() {
  const [timeHorizon, setTimeHorizon] = useState<InsightTimeHorizon>("monthly");
  const [focus, setFocus] = useState<InsightFocus>("complete");
  const [question, setQuestion] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const insight = useLatestInsight()?.insight ?? null;

  async function handleGenerate() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await generateInsight({
        time_horizon: timeHorizon,
        focus,
        question: question.trim() || null,
      });

      if (result.error) {
        setErrorMessage(result.error);
        return;
      }

      if (!result.data) {
        setErrorMessage("Unable to generate insight right now.");
        return;
      }

      saveLatestInsight(result.data);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 rounded-lg bg-[#1d211c] p-6 text-[#fbf7ef] shadow-[0_24px_90px_rgba(43,34,24,0.12)] lg:grid-cols-[1fr_22rem] lg:items-end lg:p-8">
        <div>
          <p className="text-sm font-semibold uppercase text-[#c3a35d]">
            Insights
          </p>
          <h1 className="font-display mt-3 text-5xl font-semibold leading-tight">
            Risk score generated from your financial records.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#d9d0c1]">
            Uses stored transactions, assets, liabilities, and goals to produce
            the risk report shown on the overview page.
          </p>
        </div>
      </section>

      <section className="grid gap-5 rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 shadow-[0_18px_70px_rgba(43,34,24,0.06)] sm:p-7">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <SectionHeader
            description="Choose the analysis window, set the risk focus, and add a precise question when you want the report to investigate something specific."
            eyebrow="Risk report"
            title="Insight run"
          />

          <button
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#1d211c] px-4 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343b32] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            onClick={handleGenerate}
            type="button"
          >
            {isLoading ? "Generating..." : "Generate insight"}
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[16rem_16rem_1fr]">
          <fieldset>
            <legend className="text-sm font-semibold text-[#353026]">
              Horizon
            </legend>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {horizonOptions.map((option) => (
                <button
                  className={`h-10 rounded-md border px-3 text-sm font-semibold transition ${
                    timeHorizon === option.value
                      ? "border-[#1d211c] bg-[#1d211c] text-[#fbf7ef]"
                      : "border-[#d0c5b3] bg-[#fffaf2] text-[#696154] hover:text-[#1d211c]"
                  }`}
                  key={option.value}
                  onClick={() => setTimeHorizon(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-[#353026]">
              Focus
            </legend>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {focusOptions.map((option) => (
                <button
                  className={`h-10 rounded-md border px-3 text-sm font-semibold transition ${
                    focus === option.value
                      ? "border-[#1d211c] bg-[#1d211c] text-[#fbf7ef]"
                      : "border-[#d0c5b3] bg-[#fffaf2] text-[#696154] hover:text-[#1d211c]"
                  }`}
                  key={option.value}
                  onClick={() => setFocus(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label 
            className="block text-sm font-semibold text-[#353026]" 
            htmlFor="insight-question"
          >
            Question

            <textarea
              className="mt-3 min-h-32 w-full resize-none rounded-md border border-[#d0c5b3] bg-[#fffaf2] p-4 text-base font-normal text-[#1d211c] outline-[#8f6f2d]"
              id="insight-question"
              maxLength={500}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Example: What changed this month, and what should I review first?"
              value={question}
            />
          </label>
        </div>
      </section>

      {errorMessage ? (
        <section className="rounded-lg border border-[#d5a58b] bg-[#f2e0d8] p-6 text-[#8f3f32]">
          <p className="text-sm font-semibold uppercase">
            Insight unavailable
          </p>

          <p className="mt-2 text-sm leading-6">{errorMessage}</p>

          {errorMessage.includes("OPENAI_API_KEY") ? (
            <p className="mt-3 text-sm leading-6">
              Add OPENAI_API_KEY to backend/.env, keep OPENAI_MODEL configured,
              and restart the backend.
            </p>
          ) : null}
        </section>
      ) : null}

      {insight ? <InsightReport insight={insight} /> : <EmptyInsightState />}
    </div>
  );
}

function EmptyInsightState() {
  return (
    <section className="rounded-lg border border-dashed border-[#d0c5b3] bg-[#f4efe6] p-8 text-center">
      <h2 className="font-display text-4xl font-semibold text-[#1d211c]">
        No risk report generated yet
      </h2>

      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#696154]">
        Run the insight generator to save a risk score for the overview page.
      </p>
    </section>
  );
}

function InsightReport({ insight }: { insight: InsightResponse }) {
  const generatedAt = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(insight.generated_at));

  const timeHorizon = insight.time_horizon.replace("_", " ");

  return (
    <section className="grid gap-5">
      <article className="rounded-lg bg-[#1d211c] p-6 text-[#fbf7ef] shadow-[0_24px_90px_rgba(43,34,24,0.12)] sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-[#c3a35d]">
              Generated risk report
            </p>

            <h2 className="font-display mt-3 text-5xl font-semibold">
              {insight.label}
            </h2>

            <p className="mt-4 max-w-3xl text-base leading-7 text-[#d9d0c1]">
              {insight.executive_summary}
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-5 text-center">
            <p className="text-sm font-semibold uppercase text-[#c3a35d]">
              Risk score
            </p>

            <p className="mt-3 text-6xl font-semibold">
              {insight.score}
            </p>

            <p className="mt-2 text-sm text-[#d9d0c1]">out of 100</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase text-[#d9d0c1]">
          <span className="rounded-md border border-white/10 px-2 py-1">
            {generatedAt}
          </span>
          <span className="rounded-md border border-white/10 px-2 py-1">
            {insight.model}
          </span>
          <span className="rounded-md border border-white/10 px-2 py-1">
            {timeHorizon}
          </span>
          <span className="rounded-md border border-white/10 px-2 py-1">
            {insight.focus}
          </span>
        </div>
      </article>

      <section className="grid gap-5 lg:grid-cols-2">
        {insight.sections.map((section) => (
          <article
            className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6"
            key={`${section.title}-${section.severity}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-3xl font-semibold text-[#1d211c]">
                {section.title}
              </h3>

              <span
                className={`rounded-md border px-2 py-1 text-xs font-semibold uppercase ${severityStyles[section.severity]}`}
              >
                {section.severity}
              </span>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#575044]">
              {section.summary}
            </p>

            <ul className="mt-5 grid gap-2 text-sm text-[#696154]">
              {section.signals.map((signal) => (
                <li 
                  className="rounded-md bg-[#f4efe6] px-3 py-2" 
                  key={signal}
                >
                  {signal}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <InsightList title="Action Items" items={insight.action_items} />

        <InsightList 
          title="Risk Flags" 
          items={insight.risk_flags} 
          empty="No material flags returned." 
        />

        <InsightList title="Assumptions" items={insight.assumptions} />
      </section>

      <p className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-5 text-sm leading-6 text-[#696154]">
        {insight.disclaimer}
      </p>
    </section>
  );
}

function InsightList({
  title,
  items,
  empty = "Nothing returned.",
}: {
  title: string;
  items: string[];
  empty?: string;
}) {
  return (
    <article className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6">
      <h3 className="font-display text-3xl font-semibold text-[#1d211c]">
        {title}
      </h3>
      
      {items.length > 0 ? (
        <ul className="mt-5 grid gap-3 text-sm leading-6 text-[#575044]">
          {items.map((item) => (
            <li className="border-l border-[#c3a35d] pl-3" key={item}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-[#696154]">{empty}</p>
      )}
    </article>
  );
}
