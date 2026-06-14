"use client";

import { useEffect, useState } from "react";
import type { PostRead } from "@/lib/api/generated";
import { getSavedPosts, unsavePost } from "@/lib/api/community";
import { PostCard } from "@/components/dashboard/community/PostCard";

export function SavedPostsGrid() {
  const [posts, setPosts] = useState<PostRead[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    getSavedPosts()
      .then((res) => {
        setPosts(res.data ?? []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  function handleUnsave(postId: string) {
    // Optimistically remove from the saved list
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    unsavePost(postId).catch(() => {
      // If it fails, refetch to restore correct state
      getSavedPosts().then((res) => setPosts(res.data ?? []));
    });
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (status === "loading") {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 3 }).map((_, i) => (
          <SavedPostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-zinc-400">{"Saved posts couldn't be loaded."}</p>
        <button
          onClick={() => {
            setStatus("loading");
            getSavedPosts()
              .then((res) => { setPosts(res.data ?? []); setStatus("ready"); })
              .catch(() => setStatus("error"));
          }}
          className="text-sm text-emerald-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <p className="text-sm font-medium text-zinc-300">No saved posts yet.</p>
        <p className="text-xs text-zinc-500">
          Tap the bookmark on any post to save it here.
        </p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col">
      {posts.map((post) => (
        <SavedPostRow
          key={post.id}
          post={post}
          onUnsave={() => handleUnsave(post.id)}
        />
      ))}
    </div>
  );
}

// ── SavedPostRow ──────────────────────────────────────────────────────────────

function SavedPostRow({
  post,
  onUnsave,
}: {
  post: PostRead;
  onUnsave: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="group relative">
      <PostCard post={post} />
      {/* Unsave button — appears on hover */}
      <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setConfirming(false)}
              className="rounded-full px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
            >
              Keep
            </button>
            <button
              onClick={onUnsave}
              className="rounded-full px-2 py-1 text-xs text-rose-400 hover:bg-rose-400/10"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            aria-label="Remove from saved"
            title="Remove from saved"
            className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <UnsaveIcon />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SavedPostSkeleton() {
  return (
    <div className="animate-pulse border-b border-zinc-800 px-4 py-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-zinc-800" />
        <div className="h-3 w-28 rounded bg-zinc-800" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-zinc-800" />
        <div className="h-3 w-4/5 rounded bg-zinc-800" />
      </div>
    </div>
  );
}

// ── Icon ──────────────────────────────────────────────────────────────────────

function UnsaveIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      <line x1="9" y1="10" x2="15" y2="10" />
    </svg>
  );
}