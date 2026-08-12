"use client";

import { usePathname, useRouter } from "next/navigation";
import type { UserRead } from "@/lib/api/generated";
import { logoutAccount } from "@/lib/api/auth";

type HeaderMeta = {
  title: string;
  description: string;
};

const routeMeta: Array<{ path: string; meta: HeaderMeta }> = [
  {
    path: "/dashboard/transactions/new",
    meta: {
      title: "New Transaction",
      description: "Log movement across income, spending, transfers, and obligations.",
    },
  },
  {
    path: "/dashboard/overview",
    meta: {
      title: "Overview",
      description: "A concise command center for net worth, cashflow, risk, and next actions.",
    },
  },
  {
    path: "/dashboard/portfolio",
    meta: {
      title: "Portfolio",
      description: "Review assets, liabilities, allocation, and balance sheet exposure.",
    },
  },
  {
    path: "/dashboard/transactions",
    meta: {
      title: "Transactions",
      description: "Trace the financial movements that explain how your position changes.",
    },
  },
  {
    path: "/dashboard/calendar",
    meta: {
      title: "Calendar",
      description: "Track commitments, payments, reviews, and financial events before they arrive.",
    },
  },
  {
    path: "/dashboard/insights",
    meta: {
      title: "Insights",
      description: "Generate the risk score and explanations shown on your overview.",
    },
  },
  {
    path: "/dashboard/strategy",
    meta: {
      title: "Strategy",
      description: "Compare decisions, scenarios, and recommendations before acting.",
    },
  },
  {
    path: "/dashboard/community",
    meta: {
      title: "Community",
      description: "Follow discussions, publish market notes, and save the ideas worth revisiting.",
    },
  },
  {
    path: "/dashboard/settings",
    meta: {
      title: "Settings",
      description: "Manage account details, security preferences, and product configuration.",
    },
  },
  {
    path: "/dashboard",
    meta: {
      title: "Dashboard",
      description: "Your private Plutus workspace.",
    },
  },
];

function getHeaderMeta(pathname: string) {
  return (
    routeMeta.find(
      route => pathname === route.path || pathname.startsWith(`${route.path}/`)
    )?.meta ??
    routeMeta[routeMeta.length - 1].meta
  );
}

type HeaderProps = {
  currentUser: UserRead;
};

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .map(part => part[0]?.toUpperCase())
    .join("");
}

function HeaderIcon({ name }: { name: "logout" }) {
  const paths = {
    logout: (
      <>
        <path d="M10 6H6.5A1.5 1.5 0 0 0 5 7.5v9A1.5 1.5 0 0 0 6.5 18H10" />
        <path d="M13 8l4 4-4 4" />
        <path d="M9 12h8" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.9}
    >
      {paths[name]}
    </svg>
  );
}

export default function Header({ currentUser }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const meta = getHeaderMeta(pathname);
  const displayName = currentUser.username || currentUser.email;
  const dateLabel = new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  async function handleLogout() {
    await logoutAccount();
    
    window.dispatchEvent(new Event("plutus-auth-refresh"));
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#d9d0c1] bg-[#f4efe6]/90 shadow-[0_18px_45px_rgba(43,34,24,0.06)] backdrop-blur-xl">
      <div className="flex min-h-24 flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#7a6332]">
            <span>
              Private dashboard
            </span>
            
            <span className="h-1 w-1 rounded-full bg-[#b99a52]" />
            
            <span>
              {dateLabel}
            </span>
          </div>

          <h1 className="mt-2 truncate text-2xl font-bold text-[#1d211c] sm:text-3xl">
            {meta.title}
          </h1>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#6f675b]">
            {meta.description}
          </p>
        </div>

        <div className="flex items-center rounded-md border border-[#d9d0c1] bg-[#fbf7ef]/82 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
          <div className="flex h-10 items-center gap-3 px-2.5 pr-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#d8bd75]/22 text-xs font-black text-[#5f4a1b]">
              {getInitials(displayName)}
            </span>
            
            <span className="hidden min-w-0 sm:grid">
              <span className="max-w-36 truncate text-sm font-bold text-[#1d211c]">
                {displayName}
              </span>
              
              <span className="max-w-36 truncate text-[0.72rem] font-medium text-[#7c7468]">
                {currentUser.email}
              </span>
            </span>
          </div>

          <div className="h-7 w-px bg-[#d9d0c1]" />

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-bold text-[#5a241d] transition hover:bg-[#f3e3dc]"
          >
            <HeaderIcon name="logout" />
            
            <span className="hidden sm:inline">
              Logout
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
