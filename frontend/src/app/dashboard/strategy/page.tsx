"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type HTMLAttributes,
} from "react";
import { SectionHeader } from "@/components/WealthComponents";
import {
  createStrategyGoal,
  deleteStrategyGoal,
  generateStrategyMemo,
  listStrategyGoals,
  updateStrategyGoal,
  type StrategyGoalCreate,
  type StrategyGoalRead,
  type StrategyMemoResponse,
} from "@/lib/api/strategy";
import { formatCurrency } from "@/lib/format";

type GoalStatus = NonNullable<StrategyGoalCreate["status"]>;

type GoalForm = {
  title: string;
  targetAmount: string;
  currentAmount: string;
  horizon: string;
  status: GoalStatus;
  note: string;
};

const DEFAULT_SCENARIO =
  "Assess the current goals, liquidity buffer, debt priorities, and trade-offs before adding a new car purchase or illiquid commitment.";

const INITIAL_GOAL_FORM: GoalForm = {
  title: "",
  targetAmount: "",
  currentAmount: "0",
  horizon: "",
  status: "on_track",
  note: "",
};

const statusOptions: { label: string; value: GoalStatus }[] = [
  { label: "On track", value: "on_track" },
  { label: "On watch", value: "on_watch" },
  { label: "Behind", value: "behind" },
  { label: "Paused", value: "paused" },
  { label: "Completed", value: "completed" },
];

const scenarioOptions = [
  "I buy a $120,000 car next year",
  "I prioritize high-interest debt before investing more",
  "I increase ETF contributions from monthly surplus",
];

const planningRules = [
  "Improve liquidity buffer before adding new illiquid commitments.",
  "Reduce concentrated equity exposure toward the investment policy band.",
  "Rebalance derivative exposure ahead of the next expiry cycle.",
  "Increase systematic ETF allocation from monthly surplus.",
  "Prioritize repayment of high-interest revolving debt.",
];

export default function StrategyPage() {
  const [goals, setGoals] = useState<StrategyGoalRead[]>([]);
  const [goalForm, setGoalForm] = useState<GoalForm>(INITIAL_GOAL_FORM);
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);

  const [generatedMemo, setGeneratedMemo] =
    useState<StrategyMemoResponse | null>(null);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [memoError, setMemoError] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [mutatingGoal, setMutatingGoal] = useState<string | null>(null);

  const metrics = useMemo(() => getGoalMetrics(goals), [goals]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");

      const result = await listStrategyGoals();

      if (cancelled) {
        return;
      }

      if (result.error) { 
        setLoadError(result.error); 
      } else { 
        setGoals(result.data ?? []); 
      } 
      
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function createGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const payload = makeGoalPayload(goalForm);

    if ("error" in payload) {
      setFormError(payload.error);
      return;
    }

    setSavingGoal(true);

    const response = await createStrategyGoal(payload.data);

    setSavingGoal(false);

    if (response.error) {
      setFormError(response.error);
      return;
    }

    if (response.data) {
      setGoals(current => [...current, response.data]);
      setGoalForm(INITIAL_GOAL_FORM);
    }
  }

  async function updateGoal(
    goalId: string,
    payload: { current_amount: string; status: GoalStatus },
  ) {
    setLoadError("");
    setMutatingGoal(goalId);

    const result = await updateStrategyGoal(goalId, payload);

    setMutatingGoal(null);

    if (result.error) {
      setLoadError(result.error);
      return;
    }

    if (result.data) {
      setGoals(current =>
        current.map(goal => (goal.id === goalId ? result.data : goal)),
      );
    }
  }

  async function deleteGoal(goalId: string) {
    setLoadError("");
    setMutatingGoal(goalId);

    const result = await deleteStrategyGoal(goalId);

    setMutatingGoal(null);

    if (result.error) {
      setLoadError(result.error);
      return;
    }

    setGoals(current => current.filter(goal => goal.id !== goalId));
  }

  async function generateStrategy() {
    setGenerating(true);
    setMemoError("");

    const result = await generateStrategyMemo({
      scenario: scenario.trim() || DEFAULT_SCENARIO,
      time_horizon: "annual",
    });

    setGenerating(false);

    if (result.error) {
      setMemoError(result.error);
      return;
    }

    if (!result.data) {
      setMemoError("Unable to generate a strategy memo right now.");
      return;
    }

    setGeneratedMemo(result.data);
  }

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-lg bg-[#1d211c] text-[#fbf7ef] shadow-[0_24px_90px_rgba(43,34,24,0.14)]">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-[#c3a35d]">
              Strategy
            </p>
            <h1 className="font-display mt-3 max-w-4xl text-5xl font-semibold leading-tight">
              Structure decisions before they become commitments.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#d9d0c1]">
              Goals, liquidity, liabilities, and trade-offs are stored as part of
              the strategy record, then passed into the same AI model used for
              insight memos.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase text-[#c3a35d]">
              Capital readiness
            </p>
            <p className="mt-3 text-5xl font-semibold">
              {metrics.progress}%
            </p>
            <p className="mt-2 text-sm leading-6 text-[#d9d0c1]">
              {formatCurrency(metrics.current)} funded across {goals.length}{" "}
              goals.
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#c3a35d]"
                style={{ width: `${metrics.progress}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {loadError ? <ErrorBanner message={loadError} /> : null}

      <section className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 sm:p-7">
          <SectionHeader
            description="Each goal is persisted to your account and included in planning memo snapshots."
            eyebrow="Financial goals"
            title="Capital objectives"
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {loading ? (
              <GoalSkeleton />
            ) : goals.length > 0 ? (
              goals.map(goal => (
                <GoalStructureCard
                  goal={goal}
                  isBusy={mutatingGoal === goal.id}
                  key={`${goal.id}-${goal.updated_at}`}
                  onDelete={deleteGoal}
                  onUpdate={updateGoal}
                />
              ))
            ) : (
              <EmptyGoalsState />
            )}
          </div>
        </div>

        <aside className="grid gap-4">
          <MetricTile
            label="Target capital"
            value={formatCurrency(metrics.target)}
            tone="dark"
          />
          <MetricTile
            label="Remaining"
            value={formatCurrency(metrics.remaining)}
          />
          <MetricTile label="On watch" value={String(metrics.watchCount)} />
        </aside>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 sm:p-7"
          onSubmit={createGoal}
        >
          <SectionHeader
            description="Add goals here before running scenarios so the AI memo can reason from the same records."
            eyebrow="Goal setup"
            title="Add objective"
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Title"
              onChange={value =>
                setGoalForm(form => ({ ...form, title: value }))
              }
              placeholder="Build emergency fund"
              value={goalForm.title}
            />

            <TextInput
              inputMode="decimal"
              label="Target"
              onChange={value =>
                setGoalForm(form => ({ ...form, targetAmount: value }))
              }
              placeholder="60000"
              value={goalForm.targetAmount}
            />

            <TextInput
              inputMode="decimal"
              label="Current"
              onChange={value =>
                setGoalForm(form => ({ ...form, currentAmount: value }))
              }
              placeholder="42600"
              value={goalForm.currentAmount}
            />

            <TextInput
              label="Horizon"
              onChange={value =>
                setGoalForm(form => ({ ...form, horizon: value }))
              }
              placeholder="14 months"
              value={goalForm.horizon}
            />
            <label className="block text-sm font-semibold text-[#353026]">
              Status
              <select
                className="mt-2 h-11 w-full rounded-md border border-[#d0c5b3] bg-[#fffaf2] px-3 text-sm text-[#1d211c] outline-[#8f6f2d]"
                onChange={event =>
                  setGoalForm(form => ({
                    ...form,
                    status: event.target.value as GoalStatus,
                  }))
                }
                value={goalForm.status}
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <TextInput
              label="Note"
              onChange={value =>
                setGoalForm(form => ({ ...form, note: value }))
              }
              placeholder="Reserve covers most essential obligations"
              value={goalForm.note}
            />
          </div>

          {formError ? (
            <p className="mt-4 rounded-md border border-[#d5a58b] bg-[#f2e0d8] px-4 py-3 text-sm leading-6 text-[#8f3f32]">
              {formError}
            </p>
          ) : null}

          <button
            className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-[#1d211c] px-4 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343b32] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={savingGoal}
            type="submit"
          >
            {savingGoal ? "Saving..." : "Save goal"}
          </button>
        </form>

        <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 sm:p-7">
          <SectionHeader
            description="Describe the decision you are considering, then ask the backend strategy flow to generate a planning memo."
            eyebrow="Scenario"
            title="Decision structure"
          />

          <div className="mt-5 flex flex-wrap gap-2">
            {scenarioOptions.map(option => (
              <button
                className="rounded-md border border-[#d0c5b3] bg-[#fffaf2] px-3 py-2 text-sm font-semibold text-[#575044] transition hover:border-[#8f6f2d] hover:text-[#1d211c]"
                key={option}
                onClick={() => setScenario(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>

          <label
            className="mt-5 block text-sm font-semibold text-[#353026]"
            htmlFor="strategy-scenario"
          >
            Scenario
            <textarea
              className="mt-3 min-h-36 w-full resize-none rounded-md border border-[#d0c5b3] bg-[#fffaf2] p-4 text-base font-normal leading-7 text-[#1d211c] outline-[#8f6f2d]"
              id="strategy-scenario"
              maxLength={500}
              onChange={event => setScenario(event.target.value)}
              value={scenario}
            />
          </label>

          <button
            className="mt-4 inline-flex h-11 items-center justify-center rounded-md bg-[#1d211c] px-4 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343b32] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={generating}
            onClick={generateStrategy}
            type="button"
          >
            {generating ? "Generating..." : "Generate strategy memo"}
          </button>

          {memoError ? (
            <p className="mt-4 rounded-md border border-[#d5a58b] bg-[#f2e0d8] px-4 py-3 text-sm leading-6 text-[#8f3f32]">
              {memoError}
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 sm:p-7">
        <SectionHeader
          description="These rules are the standing strategy guardrails; generated memos add context from stored records."
          eyebrow="Planning rules"
          title="Priority order"
        />

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {planningRules.map((recommendation, index) => (
            <article
              className="grid grid-cols-[2.5rem_1fr] gap-4 rounded-md border border-[#e2dacd] bg-[#fffaf2] p-4"
              key={recommendation}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#1d211c] text-sm font-semibold text-[#fbf7ef]">
                {index + 1}
              </span>

              <p className="self-center text-sm leading-6 text-[#575044]">
                {recommendation}
              </p>
            </article>
          ))}
        </div>
      </section>

      {generatedMemo ? <StrategyMemo memo={generatedMemo} /> : <EmptyMemoState />}
    </div>
  );
}

function GoalStructureCard({
  goal,
  isBusy,
  onDelete,
  onUpdate,
}: {
  goal: StrategyGoalRead;
  isBusy: boolean;
  onDelete: (goalId: string) => void;
  onUpdate: (
    goalId: string,
    payload: { current_amount: string; status: GoalStatus },
  ) => void;
}) {
  const [currentAmount, setCurrentAmount] = useState(goal.current_amount);
  const [status, setStatus] = useState<GoalStatus>(
    normalizeGoalStatus(goal.status),
  );

  const target = moneyToNumber(goal.target_amount);
  const current = moneyToNumber(currentAmount);
  const progress =
    target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const remaining = Math.max(target - current, 0);

  return (
    <article className="rounded-lg border border-[#d9d0c1] bg-[#fffaf2] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#1d211c]">
            {goal.title}
          </h3>

          {goal.note ? (
            <p className="mt-2 text-sm leading-6 text-[#696154]">
              {goal.note}
            </p>
          ) : null}
        </div>

        <span className="rounded-md border border-[#d0c5b3] px-2 py-1 text-xs font-semibold uppercase text-[#6f5a24]">
          {formatStatus(goal.status)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-4">
        <div className="h-2 overflow-hidden rounded-full bg-[#e5ddcf]">
          <div
            className="h-full rounded-full bg-[#33483d]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm font-semibold text-[#1d211c]">{progress}%</p>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <GoalStat label="Target" value={formatCurrency(target)} />
        <GoalStat label="Left" value={formatCurrency(remaining)} />
        <GoalStat label="Horizon" value={goal.horizon} />
      </dl>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_9rem]">
        <label className="block text-xs font-semibold uppercase text-[#8a8173]">
          Current
          <input
            className="mt-2 h-10 w-full rounded-md border border-[#d0c5b3] bg-[#fbf7ef] px-3 text-sm font-normal text-[#1d211c] outline-[#8f6f2d]"
            inputMode="decimal"
            onChange={(event) => setCurrentAmount(event.target.value)}
            value={currentAmount}
          />
        </label>

        <label className="block text-xs font-semibold uppercase text-[#8a8173]">
          Status
          <select
            className="mt-2 h-10 w-full rounded-md border border-[#d0c5b3] bg-[#fbf7ef] px-2 text-sm font-normal text-[#1d211c] outline-[#8f6f2d]"
            onChange={event => setStatus(event.target.value as GoalStatus)}
            value={status}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="h-10 rounded-md bg-[#1d211c] px-3 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343b32] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          onClick={() =>
            onUpdate(goal.id, {
              current_amount: currentAmount,
              status: status,
            })
          }
          type="button"
        >
          {isBusy ? "Saving..." : "Update"}
        </button>

        <button
          className="h-10 rounded-md border border-[#d5a58b] px-3 text-sm font-semibold text-[#8f3f32] transition hover:bg-[#f2e0d8] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          onClick={() => onDelete(goal.id)}
          type="button"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function GoalStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-[#8a8173]">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-[#1d211c]">{value}</dd>
    </div>
  );
}

function MetricTile({
  label,
  value,
  tone = "light",
}: {
  label: string;
  value: string;
  tone?: "dark" | "light";
}) {
  const dark = tone === "dark";

  return (
    <article
      className={`rounded-lg p-5 ${
        dark
          ? "bg-[#1d211c] text-[#fbf7ef]"
          : "border border-[#d9d0c1] bg-[#fbf7ef] text-[#1d211c]"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase ${
          dark ? "text-[#c3a35d]" : "text-[#8f6f2d]"
        }`}
      >
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold">
        {value}
      </p>
    </article>
  );
}

function StrategyMemo({ memo }: { memo: StrategyMemoResponse }) {
  const generatedAt = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(memo.generated_at));

  return (
    <section className="grid gap-5">
      <article className="rounded-lg bg-[#1d211c] p-6 text-[#fbf7ef] sm:p-8">
        <p className="text-sm font-semibold uppercase text-[#c3a35d]">
          What-if answer
        </p>
        
        <h2 className="font-display mt-3 text-5xl font-semibold">
          Scenario response
        </h2>

        <p className="mt-4 max-w-4xl text-base leading-7 text-[#d9d0c1]">
          {memo.answer}
        </p>

        <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase text-[#d9d0c1]">
          <span className="rounded-md border border-white/10 px-2 py-1">
            {generatedAt}
          </span>

          <span className="rounded-md border border-white/10 px-2 py-1">
            {memo.model}
          </span>

          <span className="rounded-md border border-white/10 px-2 py-1">
            {memo.time_horizon.replace("_", " ")}
          </span>
        </div>
      </article>

      <article className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6">
        <h3 className="font-display text-3xl font-semibold text-[#1d211c]">
          Scenario
        </h3>

        <p className="mt-4 text-sm leading-6 text-[#575044]">
          {memo.scenario}
        </p>
      </article>

      <section className="grid gap-5 lg:grid-cols-3">
        <MemoList title="Key Considerations" items={memo.key_considerations} />
        <MemoList title="Trade-offs" items={memo.trade_offs} />
        <MemoList title="Next Steps" items={memo.next_steps} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <MemoList title="Assumptions" items={memo.assumptions} />

        <p className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 text-sm leading-6 text-[#696154]">
          {memo.disclaimer}
        </p>
      </section>
    </section>
  );
}

function MemoList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <article className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6">
      <h3 className="font-display text-3xl font-semibold text-[#1d211c]">
        {title}
      </h3>

      {items.length > 0 ? (
        <ul className="mt-5 grid gap-3 text-sm leading-6 text-[#575044]">
          {items.map(item => (
            <li className="border-l border-[#c3a35d] pl-3" key={item}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-[#696154]">
          Nothing returned.
        </p>
      )}
    </article>
  );
}

function TextInput({
  inputMode,
  label,
  onChange,
  placeholder,
  value,
}: {
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-semibold text-[#353026]">
      {label}

      <input
        className="mt-2 h-11 w-full rounded-md border border-[#d0c5b3] bg-[#fffaf2] px-3 text-sm font-normal text-[#1d211c] outline-[#8f6f2d]"
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function GoalSkeleton() {
  return (
    <>
      {[0, 1].map((item) => (
        <article
          className="min-h-52 rounded-lg border border-[#d9d0c1] bg-[#fffaf2] p-5"
          key={item}
        >
          <div className="h-5 w-2/3 rounded bg-[#e5ddcf]" />
          <div className="mt-4 h-4 w-full rounded bg-[#e5ddcf]" />
          <div className="mt-2 h-4 w-4/5 rounded bg-[#e5ddcf]" />
          <div className="mt-8 h-2 rounded-full bg-[#e5ddcf]" />
        </article>
      ))}
    </>
  );
}

function EmptyGoalsState() {
  return (
    <section className="rounded-lg border border-dashed border-[#d0c5b3] bg-[#f4efe6] p-6 md:col-span-2">
      <SectionHeader
        description="Add at least one goal so the strategy memo can reason about funding gaps and trade-offs."
        eyebrow="No goals"
        title="No goals yet"
      />
    </section>
  );
}

function EmptyMemoState() {
  return (
    <section className="rounded-lg border border-dashed border-[#d0c5b3] bg-[#f4efe6] p-8 text-center">
      <h2 className="font-display text-4xl font-semibold text-[#1d211c]">
        No planning memo generated yet
      </h2>

      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#696154]">
        Generate a strategy memo to test the scenario against the current goals,
        portfolio, liability, and transaction records.
      </p>
    </section>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-[#d5a58b] bg-[#f2e0d8] p-5 text-sm leading-6 text-[#8f3f32]">
      {message}
    </section>
  );
}

function getGoalMetrics(goals: StrategyGoalRead[]) {
  let target = 0; 
  let current = 0; 
  let watchCount = 0; 
  
  for (const goal of goals) { 
    target += moneyToNumber(goal.target_amount); 
    current += moneyToNumber(goal.current_amount); 
    
    if (goal.status === "on_watch" || goal.status === "behind") { 
      watchCount++; 
    } 
  } 
  
  const remaining = Math.max(target - current, 0); 
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0; 
  
  return { 
    target, 
    current, 
    remaining, 
    progress, 
    watchCount, 
  };
}

function makeGoalPayload(
  form: GoalForm,
): { data: StrategyGoalCreate } | { error: string } {
  const title = form.title.trim();
  const horizon = form.horizon.trim();
  const target = moneyToNumber(form.targetAmount);
  const current = moneyToNumber(form.currentAmount);

  if (!title || !horizon) {
    return { 
      error: "Add a title and horizon before saving the goal." 
    };
  }

  if (target <= 0) {
    return { 
      error: "Target amount must be greater than zero." 
    };
  }

  if (current < 0 || current > target) {
    return { 
      error: "Current amount must be between zero and the target." 
    };
  }

  return {
    data: {
      title,
      target_amount: toMoney(target),
      current_amount: toMoney(current),
      horizon,
      status: form.status,
      note: form.note.trim() || null,
    },
  };
}

function normalizeGoalStatus(status: string): GoalStatus {
  if (statusOptions.some(item => item.value === status)) { 
    return status as GoalStatus; 
  } 
  
  return "on_track";
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function moneyToNumber(value: string | number | null | undefined) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function toMoney(value: number) {
  return value.toFixed(2);
}
