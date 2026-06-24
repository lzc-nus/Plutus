"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { UserRead } from "@/lib/api/generated";
import { getFeed, getGlobalFeed } from "@/lib/api/community";
import { FeedTabs } from "@/components/community/FeedTabs";
import { PostFeed } from "@/components/community/PostFeed";
import { PostComposer } from "@/components/community/PostComposer";
import { MarketSnapshot } from "@/components/community/MarketSnapshot";
import { AuthRequiredDialog } from "@/components/community/AuthRequiredDialog";
import { useAuth } from "@/lib/hooks/useAuth";

type FeedTab = "following" | "global";

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>("following");
  const [composerOpen, setComposerOpen] = useState(false);
  const [feedVersion, setFeedVersion] = useState(0);
  const [authAction, setAuthAction] = useState<string | null>(null);
  const { user } = useAuth();

  const fetcher = useCallback(
    (before?: string) =>
      activeTab === "following"
        ? getFeed(20, before)
        : getGlobalFeed(20, before),
    [activeTab],
  );

  const feedKey = `${activeTab}-${feedVersion}`;

  function handlePostCreated() {
    if (activeTab === "following") {
      setFeedVersion((v) => v + 1);
    } else {
      setActiveTab("following");
      setFeedVersion((v) => v + 1);
    }
    setComposerOpen(false);
  }

  return (
    <div className="grid min-h-full w-full gap-5 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="min-w-0 overflow-hidden rounded-lg border border-[#d7c6a3]/45 bg-[#fbf7ef] shadow-[0_18px_48px_rgba(43,34,24,0.08)]">
        <div className="sticky top-0 z-20 border-b border-[#d7c6a3]/35 bg-[#fbf7ef]/96 px-4 py-3 backdrop-blur sm:px-5">
          <div className="flex flex-col gap-3 min-[1180px]:flex-row min-[1180px]:items-center">
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-md border border-[#d7c6a3]/55 bg-white/78 px-3 py-2.5 text-left transition hover:border-[#d8bd75]/60 hover:bg-white"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#d8bd75]/24 text-xs font-black uppercase text-[#5f4a1b]">
                {getInitials(user?.username || user?.email || "U")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-[#1c2018]">
                  Share a note with the community
                </span>
                <span className="block truncate text-xs text-[#7c7468]">
                  Market context, questions, decisions, and useful signal.
                </span>
              </span>
            </button>

            <div className="flex flex-wrap items-center gap-2 min-[1180px]:justify-end">
              <FeedTabs active={activeTab} onChange={setActiveTab} />
              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#1c2018] px-4 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343a2e]"
              >
                <PencilIcon />
                Post
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d7c6a3]/25 bg-[#f8f2e7] px-4 py-2.5 sm:px-5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#8a7c65]">
            {activeTab === "following" ? "Following feed" : "Discover feed"}
          </p>

          <div className="flex items-center gap-2 xl:hidden">
            <Link
              href="/dashboard/community/saved"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#d7c6a3]/55 bg-white/70 px-2.5 text-xs font-semibold text-[#6b6252] transition hover:bg-white hover:text-[#1c2018]"
            >
              <BookmarkIcon />
              Saved
            </Link>
          </div>
        </div>

        <PostFeed
          fetcher={fetcher}
          feedKey={feedKey}
          viewer={user}
          onAuthRequired={setAuthAction}
          detailBasePath="/dashboard/community/posts"
        />
      </section>

      <CommunityRail user={user} />

      {composerOpen && (
        <PostComposer
          onClose={() => setComposerOpen(false)}
          onCreated={handlePostCreated}
        />
      )}

      {authAction && (
        <AuthRequiredDialog
          action={authAction}
          onClose={() => setAuthAction(null)}
        />
      )}
    </div>
  );
}

function CommunityRail({ user }: { user: UserRead | null }) {
  const displayName = user?.display_name || user?.username || user?.email || "User";

  return (
    <aside className="hidden min-w-0 xl:block">
      <div className="sticky top-0 grid gap-4">
        <section className="rounded-lg border border-[#d7c6a3]/45 bg-[#fbf7ef] p-4 shadow-[0_18px_48px_rgba(43,34,24,0.07)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#d8bd75]/24 text-xs font-black uppercase text-[#5f4a1b]">
              {getInitials(displayName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#1c2018]">{displayName}</p>
              <p className="truncate text-xs font-medium text-[#7c7468]">{user?.email}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <RailLink href={user ? `/profile/${user.id}` : "/dashboard/settings"} icon={<ProfileIcon />}>
              Profile
            </RailLink>
            <RailLink href="/dashboard/community/saved" icon={<BookmarkIcon />}>
              Saved posts
            </RailLink>
          </div>
        </section>

        <MarketSnapshot />

        <section className="rounded-lg border border-[#d7c6a3]/45 bg-[#fbf7ef] p-4 shadow-[0_18px_48px_rgba(43,34,24,0.06)]">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#8a7c65]">
            Community rhythm
          </p>
          <div className="mt-3 grid gap-3">
            <RailNote title="Follow signal" body="Build the feed around people whose decisions and analysis are worth revisiting." />
            <RailNote title="Save context" body="Keep posts that explain a market move, a thesis, or a decision checkpoint." />
          </div>
        </section>
      </div>
    </aside>
  );
}

function RailLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex h-10 items-center gap-3 rounded-md border border-[#d7c6a3]/35 bg-white/55 px-3 text-sm font-semibold text-[#6b6252] transition hover:border-[#d8bd75]/55 hover:bg-white hover:text-[#1c2018]"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

function RailNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-l-2 border-[#d8bd75]/55 pl-3">
      <p className="text-sm font-semibold text-[#1c2018]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[#7c7468]">{body}</p>
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.map((part) => part[0]?.toUpperCase()).join("");
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
