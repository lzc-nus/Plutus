import Link from "next/link";

interface PortfolioOverviewCardProps {
  type: "assets" | "liabilities";
  total: number;
  categoryCount: number;
  itemCount: number;
  topCategories: { label: string; value: number; percent: number }[];
  href: string;
}

const FORMATTERS = {
  currency: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }),
  percent: (n: number) => `${n.toFixed(1)}%`,
};

export function PortfolioOverviewCard({
  type,
  total,
  categoryCount,
  itemCount,
  topCategories,
  href,
}: PortfolioOverviewCardProps) {
  const isAssets = type === "assets";

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-[#d9d0c1] bg-[#fbf7ef] p-6 shadow-[0_4px_24px_rgba(43,34,24,0.06)] transition-all duration-200 hover:border-[#b8a87a] hover:shadow-[0_8px_32px_rgba(43,34,24,0.1)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a6332]">
            {isAssets ? "Assets" : "Liabilities"}
          </p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-[#1d211c]">
            {FORMATTERS.currency.format(total)}
          </p>
          <p className="mt-1 text-sm text-[#6f675b]">
            {itemCount} {itemCount === 1 ? "item" : "items"} across{" "}
            {categoryCount} {categoryCount === 1 ? "category" : "categories"}
          </p>
        </div>

        {/* Icon */}
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors duration-200 ${
            isAssets
              ? "border-[#c8d8b0] bg-[#edf5e0] text-[#3b6d11] group-hover:bg-[#dcecc8]"
              : "border-[#e8c8b8] bg-[#faede7] text-[#993c1d] group-hover:bg-[#f5d8cc]"
          }`}
        >
          {isAssets ? (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              viewBox="0 0 24 24"
            >
              <path
                d="M3 3v18h18M7 16l4-5 4 4 4-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              viewBox="0 0 24 24"
            >
              <path
                d="M3 12h18M3 6h18M3 18h12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="my-5 border-t border-[#e4dece]" />

      {/* Top categories */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9a8f7a]">
          By category
        </p>
        {topCategories.length === 0 ? (
          <p className="text-sm text-[#9a8f7a]">No data yet.</p>
        ) : (
          topCategories.slice(0, 4).map((cat) => (
            <div key={cat.label}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm text-[#3d3730]">{cat.label}</span>
                <span className="text-sm font-medium text-[#1d211c]">
                  {FORMATTERS.currency.format(cat.value)}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-[#e4dece]">
                <div
                  className={`h-full rounded-full transition-all ${
                    isAssets ? "bg-[#639922]" : "bg-[#d85a30]"
                  }`}
                  style={{ width: `${Math.min(cat.percent, 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* CTA */}
      <div className="mt-5 flex items-center justify-between border-t border-[#e4dece] pt-4">
        <span className="text-sm font-medium text-[#7a6332]">
          View {isAssets ? "all assets" : "all liabilities"}
        </span>
        <svg
          className="h-4 w-4 text-[#7a6332] transition-transform duration-200 group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            d="M5 12h14M12 5l7 7-7 7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Link>
  );
}