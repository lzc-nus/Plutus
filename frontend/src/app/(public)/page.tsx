import Link from "next/link";

const metrics = [
  ["5 min", "to build a wealth snapshot"],
  ["24/7", "portfolio monitoring"],
  ["AI", "risk and decision briefs"],
];

const features = [
  {
    title: "Unified Wealth View",
    body: "Track assets, liabilities, cash flow, commitments, and goals in one operating dashboard.",
  },
  {
    title: "AI Risk Briefs",
    body: "Turn transactions and portfolio exposure into plain-language risk notes and next actions.",
  },
  {
    title: "Scenario Planning",
    body: "Model major decisions before they hit your liquidity, debt profile, or investment plan.",
  },
];

const workflow = [
  "Connect financial inputs",
  "Review your live dashboard",
  "Act on AI-ranked priorities",
];

export default function PublicHomePage() {
  return (
    <main className="bg-[#f4efe6] text-[#1d211c]">
      <section
        className="relative min-h-[92vh] overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(29,33,28,0.88), rgba(29,33,28,0.62), rgba(29,33,28,0.18)), url('/landing/wealth-office.jpg')",
        }}
      >
        <div className="mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-center px-6 py-24 text-[#fbf7ef] lg:px-10">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#d8bd75]">
              AI wealth intelligence
            </p>

            <h1 className="brand-script text-5xl leading-none sm:text-8xl">
              Plutus
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#eee4d4]">
              A private wealth command center for founders, operators, and
              families who need sharper visibility over capital, risk, cash
              flow, and decisions.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#d8bd75] px-6 text-sm font-bold text-[#1d211c] transition hover:bg-[#ecd48b]"
              >
                Create account
              </Link>

              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-md border border-[#fbf7ef]/40 px-6 text-sm font-bold text-[#fbf7ef] transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="mt-16 grid max-w-2xl gap-3 sm:grid-cols-3">
            {metrics.map(([value, label]) => (
              <div
                key={label}
                className="border-l border-[#d8bd75]/70 bg-black/18 px-4 py-3 backdrop-blur-sm"
              >
                <p className="text-2xl font-semibold">{value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#dfd4c2]">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8f6f2d]">
            Built for decisions
          </p>

          <h2 className="font-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            Financial clarity before the decision becomes expensive.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-1">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6"
            >
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#696154]">
                {feature.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#1d211c] px-6 py-20 text-[#fbf7ef] lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d8bd75]">
              Product flow
            </p>

            <h2 className="font-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
              From raw financial activity to ranked action.
            </h2>
            
            <div className="mt-8 grid gap-4">
              {workflow.map((item, index) => (
                <div key={item} className="flex gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#d8bd75] text-sm font-bold text-[#1d211c]">
                    {index + 1}
                  </span>

                  <p className="pt-1 text-lg text-[#eee4d4]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#252a24] p-5 shadow-2xl">
            <div className="rounded-md bg-[#fbf7ef] p-5 text-[#1d211c]">
              <div className="flex items-center justify-between border-b border-[#d9d0c1] pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-[#8f6f2d]">
                    Wealth snapshot
                  </p>
                  <p className="mt-1 text-2xl font-semibold">$1,207,840</p>
                </div>

                <p className="rounded-full bg-[#e8dfcf] px-3 py-1 text-xs font-semibold">
                  Elevated risk
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                {["Liquidity buffer", "Debt exposure", "Single-stock risk"].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-md bg-[#f4efe6] px-4 py-3"
                    >
                      <span className="text-sm font-medium">{item}</span>
                      <span className="text-sm text-[#8f3f32]">Review</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-8 text-center sm:p-12">
          <h2 className="font-display text-4xl font-semibold">
            Start with a clearer view of your capital.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#696154]">
            Create an account, fill in your asset information, add your first transactions, and begin building
            the financial intelligence layer for your wealth decisions.
          </p>
          
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-md bg-[#1d211c] px-6 text-sm font-bold text-[#fbf7ef] transition hover:bg-[#343b32]"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
