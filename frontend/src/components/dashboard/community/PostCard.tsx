"use client";

import { useState } from "react";
import Link from "next/link";
import type { PostRead } from "@/lib/api/generated";
import { ContentBlockRenderer } from "@/components/dashboard/community/ContentBlockRenderer";
import { PostActionBar } from "@/components/dashboard/community/PostActionBar";
import { UserAvatar } from "@/components/dashboard/community/UserAvatar";
import type { ContentBlock } from "@/lib/validations/community";

interface PostCardProps {
  post: PostRead;
  /** Hides the link-to-detail behaviour — used when already on PostDetail. */
  disableNavigation?: boolean;
}

export function PostCard({ post: initialPost, disableNavigation = false }: PostCardProps) {
  // PostCard owns its own post copy so PostActionBar optimistic updates
  // stay local without requiring a parent refetch.
  const [post, setPost] = useState<PostRead>(initialPost);

  const postUrl = `/dashboard/community/posts/${post.id}`;

  return (
    <article className="border-b border-[#d7c6a3]/30 px-4 py-4 transition-colors hover:bg-[#f0e8d8]/60">

      {/* Author row */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar userId={post.author_id} />
        </div>
        <time
          dateTime={post.created_at}
          className="shrink-0 text-xs text-[#a99b82]"
          title={formatFullTimestamp(post.created_at)}
        >
          {formatRelativeTime(post.created_at)}
        </time>
      </div>

      {/* Content — clicking the body navigates to PostDetail */}
      {disableNavigation ? (
        <div className="mb-3">
          <ContentBlockRenderer blocks={post.content_blocks as ContentBlock[]} />
        </div>
      ) : (
        <Link href={postUrl} className="mb-3 block">
          <ContentBlockRenderer blocks={post.content_blocks as ContentBlock[]} />
        </Link>
      )}

      {/* Action bar */}
      <PostActionBar post={post} onUpdate={setPost} />
    </article>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return formatFullTimestamp(iso);
}

function formatFullTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}