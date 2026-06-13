"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Great_Vibes } from "next/font/google";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

const logoFont = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const STORAGE_KEY = "plutus_sidebar_collapsed";

type IconName =
  | "overview"
  | "portfolio"
  | "transactions"
  | "calendar"
  | "insights"
  | "strategy"
  | "settings"
  | "asset"
  | "liability"
  | "chevron"
  | "community"
  | "profile";

type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  exact?: boolean;
};

const quickActions: NavItem[] = [
  { label: "Add asset", href: "/dashboard/portfolio/assets?add=true", icon: "asset", exact: true },
  { label: "Add liability", href: "/dashboard/portfolio/liabilities?add=true", icon: "liability", exact: true },
  { label: "New transaction", href: "/dashboard/transactions/new", icon: "transactions", exact: true },
];

function isActivePath(pathname: string, item: NavItem) {
  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function getSidebarSnapshot() {
  if (typeof window === "undefined") {
    return "false";
  }

  return localStorage.getItem(STORAGE_KEY) ?? "false";
}

function subscribeSidebarPreference(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener("plutus-sidebar-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("plutus-sidebar-change", onStoreChange);
  };
}

function Icon({ name }: { name: IconName }) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  const paths: Record<IconName, ReactNode> = {
    overview: (
      <>
        <path d="M4 13.5 12 5l8 8.5" />
        <path d="M6.5 12.5V20h11v-7.5" />
        <path d="M10 20v-5h4v5" />
      </>
    ),
    portfolio: (
      <>
        <path d="M5 9h14v10H5z" />
        <path d="M9 9V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V9" />
        <path d="M5 13h14" />
      </>
    ),
    transactions: (
      <>
        <path d="M7 7h10" />
        <path d="M14 4l3 3-3 3" />
        <path d="M17 17H7" />
        <path d="m10 14-3 3 3 3" />
      </>
    ),
    calendar: (
      <>
        <path d="M7 4v3" />
        <path d="M17 4v3" />
        <path d="M5 8h14" />
        <path d="M5 6.5h14V20H5z" />
        <path d="M8 12h2" />
        <path d="M14 12h2" />
        <path d="M8 16h2" />
      </>
    ),
    insights: (
      <>
        <path d="M12 3.8 13.9 9l5.3 1.9-5.3 1.9L12 18.2l-1.9-5.4-5.3-1.9L10.1 9 12 3.8Z" />
        <path d="M18.2 4.8v2.4" />
        <path d="M17 6h2.4" />
        <path d="M5.8 16.8v2.4" />
        <path d="M4.6 18h2.4" />
      </>
    ),
    strategy: (
      <>
        <path d="M5 19 19 5" />
        <path d="M8 5h11v11" />
        <path d="M5 11h5" />
        <path d="M13 19h6" />
      </>
    ),
    settings: (
      <>
        <path d="M4 7h9" />
        <path d="M17 7h3" />
        <circle cx="15" cy="7" r="2" />
        <path d="M4 17h3" />
        <path d="M11 17h9" />
        <circle cx="9" cy="17" r="2" />
      </>
    ),
    asset: (
      <>
        <path d="M12 4v16" />
        <path d="M5 10h14" />
        <path d="M7 10l2.5 7h5L17 10" />
      </>
    ),
    liability: (
      <>
        <path d="M5 7h14" />
        <path d="M7 7v13h10V7" />
        <path d="M9 11h6" />
        <path d="M9 15h4" />
      </>
    ),
    chevron: <path d="m9 6 6 6-6 6" />,
    community: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </>
    ),
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" {...commonProps}>
      {paths[name]}
    </svg>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const navGroups = [
    {
      label: "Command",
      items: [
        { label: "Overview", href: "/dashboard/overview", icon: "overview" },
        { label: "Portfolio", href: "/dashboard/portfolio", icon: "portfolio" },
        { label: "Transactions", href: "/dashboard/transactions", icon: "transactions" },
        { label: "Calendar", href: "/dashboard/calendar", icon: "calendar" },
      ],
    },
    {
      label: "Intelligence",
      items: [
        { label: "AI Insights", href: "/dashboard/ai", icon: "insights" },
        { label: "Strategy", href: "/dashboard/strategy", icon: "strategy" },
      ],
    },
    {
      label: "Social",
      items: [
        { label: "Community", href: "/dashboard/community", icon: "community" },
        { label: "Profile", href: user ? `/profile/${user.id}` : "#", icon: "profile" },
      ],
    },
    {
      label: "Account",
      items: [{ label: "Settings", href: "/dashboard/settings", icon: "settings" }],
    },
  ] satisfies Array<{ label: string; items: NavItem[] }>;

  const storedPreference = useSyncExternalStore(
    subscribeSidebarPreference,
    getSidebarSnapshot,
    () => "false",
  );
  const isCollapsed = storedPreference === "true";

  function toggleSidebar() {
    const nextValue = !isCollapsed;
    localStorage.setItem(STORAGE_KEY, String(nextValue));
    window.dispatchEvent(new Event("plutus-sidebar-change"));
  }

  const expanded = !isCollapsed;

  return (
    <aside
      data-collapsed={isCollapsed}
      className="group relative hidden h-screen shrink-0 border-r border-[#d7c6a3]/25 bg-[#171b17] text-[#f8efd9] shadow-[18px_0_60px_rgba(23,27,23,0.18)] transition-[width] duration-300 ease-out md:flex md:w-72 data-[collapsed=true]:md:w-[5.5rem]"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(216,189,117,0.09),transparent_38%),radial-gradient(circle_at_20%_0%,rgba(216,189,117,0.18),transparent_30%)]" />
      <div className="relative flex min-w-0 flex-1 flex-col px-3 py-4 group-data-[collapsed=true]:px-2">
        <div className="flex h-16 items-center justify-between gap-3 rounded-md border border-[#d7c6a3]/14 bg-[#10140f]/68 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-[height,padding] duration-300 group-data-[collapsed=true]:h-14 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-2">
          {expanded ? (
            <Link
              href="/dashboard/overview"
              aria-label="Plutus dashboard overview"
              className="flex min-w-0 flex-1 items-center"
            >
              <span className="grid min-w-0 leading-none">
                <span className={`${logoFont.className} truncate text-4xl text-[#f2d88a]`}>
                  Plutus
                </span>
                <span className="truncate text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-[#a99b82]">
                  Private ledger
                </span>
              </span>
            </Link>
          ) : null}

          <button
            type="button"
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={expanded}
            onClick={toggleSidebar}
            title={expanded ? "Collapse sidebar" : "Expand sidebar"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d8bd75]/20 bg-[#20251d] text-[#d8bd75] transition hover:border-[#d8bd75]/50 hover:bg-[#2b3127] group-data-[collapsed=true]:h-8 group-data-[collapsed=true]:w-8"
          >
            <span className={expanded ? "rotate-180 transition-transform" : "transition-transform"}>
              <Icon name="chevron" />
            </span>
          </button>
        </div>

        <nav aria-label="Dashboard navigation" className="mt-5 flex-1 overflow-y-auto pr-1 group-data-[collapsed=true]:mt-4 group-data-[collapsed=true]:pr-0">
          <div className="grid gap-5">
            {navGroups.map((group) => (
              <div key={group.label} className="grid gap-2">
                {expanded ? (
                  <p className="px-3 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#9f9278]">
                    {group.label}
                  </p>
                ) : null}

                <div className="grid gap-1">
                  {group.items.map((item) => {
                    const active = isActivePath(pathname, item);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        title={expanded ? undefined : item.label}
                        className={`relative flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                          active
                            ? "bg-[#d8bd75] text-[#171b17] shadow-[0_14px_35px_rgba(216,189,117,0.22)]"
                            : "text-[#d9cfbb] hover:bg-[#f8efd9]/8 hover:text-[#f8efd9]"
                        } ${expanded ? "justify-start" : "justify-center"}`}
                      >
                        <Icon name={item.icon} />
                        {expanded ? <span className="truncate">{item.label}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="mt-4 border-t border-[#d7c6a3]/16 pt-4">
          {expanded ? (
            <p className="px-3 text-[0.65rem] font-bold uppercase tracking-[0.24em] text-[#9f9278]">
              Quick add
            </p>
          ) : null}

          <div className="mt-2 grid gap-1">
            {quickActions.map((item) => {
              const active = isActivePath(pathname, item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={expanded ? undefined : item.label}
                  className={`flex h-10 items-center gap-3 rounded-md border px-3 text-sm font-semibold transition ${
                    active
                      ? "border-[#d8bd75] bg-[#d8bd75]/18 text-[#f6dda2]"
                      : "border-[#d7c6a3]/14 bg-[#10140f]/55 text-[#d9cfbb] hover:border-[#d8bd75]/35 hover:text-[#f8efd9]"
                  } ${expanded ? "justify-start" : "justify-center"}`}
                >
                  <Icon name={item.icon} />
                  {expanded ? <span className="truncate">{item.label}</span> : null}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

