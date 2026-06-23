"use client";

import { useState } from "react";
import type { PostRead } from "@/lib/api/generated";
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

  function handlePostCreated(_post: PostRead) {
    if (activeTab === "following") {
      setFeedVersion((v) => v + 1);
    } else {
      setActiveTab("following");
      setFeedVersion((v) => v + 1);
    }
    setComposerOpen(false);
  }

  return (
    <div className="flex min-h-screen w-full bg-[#fbf7ef]">

      {/* ── Centre feed column ───────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col border-r border-[#d7c6a3]/30">

        {/* Sticky header */}
        <div className="sticky top-0 z-10 border-b border-[#d7c6a3]/30 bg-[#fbf7ef]/95 backdrop-blur">
          <div className="px-6 pt-0 pb-0">
            <FeedTabs active={activeTab} onChange={setActiveTab} />
          </div>
        </div>

        {/* Inline composer slot */}
        <div className="border-b border-[#d7c6a3]/30 bg-[#fbf7ef] px-6 py-4">
          <button
            onClick={() => setComposerOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-[#d7c6a3]/50 bg-white/70 px-4 py-3 text-left text-sm text-[#a99b82] transition-colors hover:border-[#d8bd75]/40 hover:bg-white"
          >
            <PencilIcon />
            {"What's on your mind?"}
          </button>
        </div>

        {/* Feed */}
        <div className="bg-[#fbf7ef]">
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

function PencilIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-[#a99b82]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}