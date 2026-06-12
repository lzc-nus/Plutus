import Link from "next/link";

interface PortfolioHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
}

export function PortfolioHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  action,
}: PortfolioHeaderProps) {
  return (
    <div className="rounded-lg border border-[#d9d0c1] bg-[#fbf7ef] p-6 shadow-[0_20px_70px_rgba(43,34,24,0.08)]">
      {backHref && (
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#7a6332] hover:text-[#5a4520] transition-colors"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="M19 12H5M12 5l-7 7 7 7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {backLabel ?? "Back"}
        </Link>
      )}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7a6332]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#1d211c]">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f675b]">
            {description}
          </p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}