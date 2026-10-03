"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  SharedAllocation,
  SharedFinancialProfile as SharedFinancialProfileData,
} from "@/lib/api/generated";
import { getSharedFinancialProfile } from "@/lib/api/profileSharing";

function formatCategory(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function useCurrencyFormatter(currency: string) {
  return useMemo(
    () =>
      new Intl.NumberFormat("en", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }),
    [currency],
  );
}

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.9}
    >
      <path d="M12 3 4.5 6v5.5c0 4.7 3.1 8 7.5 9.5 4.4-1.5 7.5-4.8 7.5-9.5V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function AllocationList({
  title,
  countLabel,
  items,
  currency,
}: {
  title: string;
  countLabel: string;
  items: SharedAllocation[];
  currency: string;
}) {
  const formatter = useCurrencyFormatter(currency);

  return (
    <section className="border-t border-[#cfc3b1] pt-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-[#1d211c]">
          {title}
        </h2>
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#827667]">
          {countLabel}
        </span>
      </div>

      {items.length ? (
        <div className="mt-5 grid gap-5">
          {items.map((item) => {
            const percent = Number(item.share_percent);
            return (
              <div key={item.category}>
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-bold text-[#3b3f37]">
                    {formatCategory(item.category)}
                  </span>
                  <span className="text-right font-semibold tabular-nums text-[#655c50]">
                    {formatter.format(Number(item.value))} · {percent.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ded5c7]">
                  <div
                    className="h-full rounded-full bg-[#8f6f2d] transition-[width] duration-200 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-[#6f665a]">
          No values have been added to this part of the profile.
        </p>
      )}
    </section>
  );
}

function LoadingProfile() {
  return (
    <main className="min-h-[72vh] bg-[#f4efe6] px-6 py-14 text-[#1d211c] lg:px-10">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="h-5 w-40 rounded bg-[#ded5c7]" />
        <div className="mt-8 h-14 max-w-xl rounded bg-[#ded5c7]" />
        <div className="mt-5 h-5 max-w-md rounded bg-[#e6ded1]" />
        <div className="mt-12 grid gap-8 border-y border-[#cfc3b1] py-8 sm:grid-cols-3">
          <div className="h-20 rounded bg-[#ded5c7]" />
          <div className="h-20 rounded bg-[#ded5c7]" />
          <div className="h-20 rounded bg-[#ded5c7]" />
        </div>
      </div>
    </main>
  );
}

export default function SharedFinancialProfile({ token }: { token: string }) {
  const [profile, setProfile] = useState<SharedFinancialProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;

    void getSharedFinancialProfile(token)
      .then((result) => {
        if (!active) {
          return;
        }
        if (result.error || !result.data) {
          setUnavailable(true);
          return;
        }
        setProfile(result.data);
      })
      .catch(() => {
        if (active) {
          setUnavailable(true);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  const formatter = useCurrencyFormatter(profile?.base_currency ?? "SGD");

  if (loading) {
    return <LoadingProfile />;
  }

  if (unavailable || !profile) {
    return (
      <main className="grid min-h-[72vh] place-items-center bg-[#f4efe6] px-6 py-16 text-[#1d211c]">
        <div className="max-w-lg text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#e8dfcf] text-[#6b5d43]">
            <ShieldIcon />
          </div>
          <h1 className="font-display mt-5 text-4xl font-semibold">
            This profile is unavailable
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#6f665a]">
            The owner may have turned off sharing or replaced this link. Ask
            them for a current link if you still need access.
          </p>
        </div>
      </main>
    );
  }

  const displayName = profile.display_name || profile.username;
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <main className="min-h-[72vh] bg-[#f4efe6] px-6 py-12 text-[#1d211c] sm:py-16 lg:px-10">
      <article className="mx-auto max-w-5xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[#6b5d43]">
          <ShieldIcon />
          Shared financial profile
        </div>

        <header className="mt-8 grid gap-7 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[#1d211c] text-lg font-bold text-[#d8bd75]">
            {initials || "P"}
          </div>
          <div>
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
              {displayName}&apos;s financial profile
            </h1>
            <p className="mt-2 text-sm font-semibold text-[#827667]">
              @{profile.username}
            </p>
            {profile.bio ? (
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#5e5549]">
                {profile.bio}
              </p>
            ) : null}
          </div>
        </header>

        <section className="mt-12 grid gap-y-8 border-y border-[#cfc3b1] py-8 sm:grid-cols-3 sm:divide-x sm:divide-[#cfc3b1]">
          <div className="sm:pr-7">
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#827667]">
              Net worth
            </p>
            <p className="mt-2 break-words text-3xl font-semibold tabular-nums text-[#1d211c]">
              {formatter.format(Number(profile.net_worth))}
            </p>
          </div>
          <div className="sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#827667]">
              Total assets
            </p>
            <p className="mt-2 break-words text-3xl font-semibold tabular-nums text-[#315b3b]">
              {formatter.format(Number(profile.total_assets))}
            </p>
          </div>
          <div className="sm:pl-7">
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#827667]">
              Total liabilities
            </p>
            <p className="mt-2 break-words text-3xl font-semibold tabular-nums text-[#753e35]">
              {formatter.format(Number(profile.total_liabilities))}
            </p>
          </div>
        </section>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-14">
          <AllocationList
            title="Asset allocation"
            countLabel={`${profile.asset_count} ${profile.asset_count === 1 ? "asset" : "assets"}`}
            items={profile.asset_allocation}
            currency={profile.base_currency}
          />
          <AllocationList
            title="Liability breakdown"
            countLabel={`${profile.liability_count} ${profile.liability_count === 1 ? "liability" : "liabilities"}`}
            items={profile.liability_breakdown}
            currency={profile.base_currency}
          />
        </div>

        <footer className="mt-12 flex flex-col gap-3 border-t border-[#cfc3b1] pt-6 text-xs leading-5 text-[#756c61] sm:flex-row sm:items-center sm:justify-between">
          <p>
            Updated {formatDateTime(profile.as_of)} · Values shown in {profile.base_currency}
          </p>
          <p className="max-w-xl sm:text-right">
            This view contains aggregate values only. Account names,
            transactions, holdings, notes, and goals remain private.
          </p>
        </footer>
      </article>
    </main>
  );
}
