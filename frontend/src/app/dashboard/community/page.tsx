"use client";

import { useState } from "react";
import { getFeed, getGlobalFeed } from "@/lib/api/community";
import { FeedTabs } from "@/components/dashboard/community/FeedTabs";
import { PostFeed } from "@/components/dashboard/community/PostFeed";
import { PostComposer } from "@/components/dashboard/community/PostComposer";
import { RightPanel } from "@/components/dashboard/community/RightPanel";

type FeedTab = "following" | "global";

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>("following");
  const [composerOpen, setComposerOpen] = useState(false);
  const [feedVersion, setFeedVersion] = useState(0);

  const fetcher =
    activeTab === "following"
      ? (before?: string) => getFeed(20, before)
      : (before?: string) => getGlobalFeed(20, before);

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
    // Outer wrapper — fills the space to the right of the app's existing left sidebar
    <div className="flex min-h-screen w-full">

      {/* ── Centre feed column ───────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-zinc-200/60 dark:border-zinc-800">

        {/* Sticky header */}
        <div className="sticky top-0 z-10 border-b border-zinc-200/60 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="px-5 pt-4 pb-0">
            <h1 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-white">
              Community
            </h1>
            <FeedTabs active={activeTab} onChange={setActiveTab} />
          </div>
        </div>

        {/* Inline composer slot — Twitter style */}
        <div className="border-b border-zinc-200/60 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <button
            onClick={() => setComposerOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm text-zinc-400 transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            <PencilIcon />
            {"What's on your mind?"}
          </button>
        </div>

        {/* Feed */}
        <div className="bg-white dark:bg-zinc-950">
          <PostFeed fetcher={fetcher} feedKey={feedKey} />
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────── */}
      <RightPanel />

      {/* Post composer modal */}
      {composerOpen && (
        <PostComposer
          onClose={() => setComposerOpen(false)}
          onCreated={handlePostCreated}
        />
      )}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
