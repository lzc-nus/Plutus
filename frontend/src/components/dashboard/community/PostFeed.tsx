"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PostRead } from "@/lib/api/generated";
import { PostCard } from "@/components/dashboard/community/PostCard";

interface PostFeedProps {
  /**
   * Fetcher function injected by the parent — accepts an optional `before`
   * cursor and returns a page of posts. Swapping this prop switches the feed
   * between Following, Global, or a user profile without remounting the feed.
   */
  fetcher: (before?: string) => Promise<{ data?: PostRead[] | null }>;

  /** Stable key — changing it resets the feed (e.g. when switching tabs). */
  feedKey: string;
}

const PAGE_SIZE = 20;

export function PostFeed({ fetcher, feedKey }: PostFeedProps) {
  const [posts, setPosts] = useState<PostRead[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const cursorRef = useRef<string | undefined>(undefined);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset whenever the feed source changes (tab switch or profile navigation)
  useEffect(() => {
    setPosts([]);
    cursorRef.current = undefined;
    setStatus("idle");
  }, [feedKey]);

  const loadMore = useCallback(async () => {
    if (status === "loading" || status === "done") return;
    setStatus("loading");
    try {
      const result = await fetcher(cursorRef.current);
      const page = result.data ?? [];

      setPosts((prev) => {
        // Deduplicate by id in case of concurrent triggers
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...page.filter((p) => !ids.has(p.id))];
      });

      if (page.length < PAGE_SIZE) {
        setStatus("done");
      } else {
        cursorRef.current = page[page.length - 1].created_at;
        setStatus("idle");
      }
    } catch {
      setStatus("error");
    }
  }, [fetcher, status]);

  // Trigger initial load
  useEffect(() => {
    if (status === "idle" && posts.length === 0) {
      loadMore();
    }
  }, [status, posts.length, loadMore]);

  // IntersectionObserver drives pagination — fires when the sentinel div
  // scrolls into view at the bottom of the list
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (status === "loading" && posts.length === 0) {
    return (
      <div className="flex flex-col gap-3 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === "error" && posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-zinc-400">Failed to load posts.</p>
        <button
          onClick={() => { setStatus("idle"); }}
          className="text-sm text-emerald-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (status === "done" && posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <p className="text-sm font-medium text-zinc-300">Nothing here yet.</p>
        <p className="text-xs text-zinc-500">
          Follow people or be the first to post.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Pagination sentinel */}
      <div ref={sentinelRef} className="py-4">
        {status === "loading" && (
          <div className="flex justify-center">
            <Spinner />
          </div>
        )}
        {status === "error" && (
          <div className="flex justify-center">
            <button
              onClick={() => { setStatus("idle"); }}
              className="text-sm text-emerald-400 hover:underline"
            >
              Failed to load more — retry
            </button>
          </div>
        )}
        {status === "done" && posts.length > 0 && (
          <p className="text-center text-xs text-zinc-600">
            You're all caught up.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PostCardSkeleton() {
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
      <div className="mt-4 flex gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-3 w-8 rounded bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-emerald-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}