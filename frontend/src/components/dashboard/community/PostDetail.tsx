"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PostRead, CommentRead } from "@/lib/api/generated";
import { getPost } from "@/lib/api/community";
import { listComments } from "@/lib/api/community";
import { ContentBlockRenderer } from "@/components/dashboard/community/ContentBlockRenderer";
import { PostActionBar } from "@/components/dashboard/community/PostActionBar";
import { CommentThread } from "@/components/dashboard/community/CommentThread";
import { CommentComposer } from "@/components/dashboard/community/CommentComposer";
import { UserAvatar } from "@/components/dashboard/community/UserAvatar";
import { ContentBlock } from "@/lib/validations/community";
import { RightPanel } from "./RightPanel";

interface PostDetailProps {
  postId: string;
}

export function PostDetail({ postId }: PostDetailProps) {
  const router = useRouter();
  const composerRef = useRef<HTMLDivElement>(null);

  const [post, setPost] = useState<PostRead | null>(null);
  const [comments, setComments] = useState<CommentRead[]>([]);
  const [postStatus, setPostStatus] = useState<"loading" | "ready" | "error">("loading");
  const [commentsStatus, setCommentsStatus] = useState<"loading" | "ready" | "error">("loading");

  // ── Fetch post ──────────────────────────────────────────────────────────────
  useEffect(() => {
    getPost(postId)
      .then((res) => {
        if (res.data) {
          setPost(res.data);
          setPostStatus("ready");
        } else {
          setPostStatus("error");
        }
      })
      .catch(() => setPostStatus("error"));
  }, [postId]);

  // ── Fetch comments ──────────────────────────────────────────────────────────
  useEffect(() => {
    listComments(postId)
      .then((res) => {
        setComments(res.data ?? []);
        setCommentsStatus("ready");
      })
      .catch(() => setCommentsStatus("error"));
  }, [postId]);

  // ── Optimistic update callbacks passed down to child components ─────────────

  function handlePostUpdate(updated: PostRead) {
    setPost(updated);
  }

  function handleCommentCreated(comment: CommentRead) {
    setComments((prev) => [...prev, comment]);
    // Reflect the incremented comment_count on the post
    setPost((prev) =>
      prev ? { ...prev, comment_count: prev.comment_count + 1 } : prev,
    );
  }

  function handleCommentDeleted(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setPost((prev) =>
      prev
        ? { ...prev, comment_count: Math.max(0, prev.comment_count - 1) }
        : prev,
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (postStatus === "loading") {
    return <PostDetailSkeleton />;
  }

  if (postStatus === "error" || !post) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm text-zinc-400">{"This post couldn't be loaded."}</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-emerald-400 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen w-full bg-[#fbf7ef]">
      <div className="flex min-w-0 flex-1 flex-col border-r border-[#d7c6a3]/30">
        <article className="flex flex-col">
          {/* Back navigation */}
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#d7c6a3]/30 bg-[#fbf7ef]/95 px-4 py-3 backdrop-blur">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="rounded-full p-1 text-[#a99b82] transition-colors hover:bg-[#ede5d4] hover:text-[#1c2018]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-[#1c2018]">Post</span>
          </div>

          {/* Post body */}
          <div className="border-b border-[#d7c6a3]/30 px-4 pb-4 pt-5">
            {/* Author */}
            <div className="mb-4 flex items-center gap-3">
              <UserAvatar userId={post.author_id} />
            </div>

            {/* Content */}
            <div className="mb-5">
              <ContentBlockRenderer blocks={post.content_blocks as ContentBlock[]} />
            </div>

            {/* Timestamp */}
            <time
              dateTime={post.created_at}
              className="mb-4 block text-xs text-[#a99b82]"
            >
              {formatTimestamp(post.created_at)}
            </time>

            {/* Count summary row */}
            <div className="flex gap-5 border-y border-[#d7c6a3]/30 py-3 text-sm text-[#a99b82]">
              <span>
                <strong className="font-semibold text-[#1c2018]">{post.comment_count}</strong>{" "}
                {post.comment_count === 1 ? "comment" : "comments"}
              </span>
              <span>
                <strong className="font-semibold text-[#1c2018]">{post.repost_count}</strong>{" "}
                {post.repost_count === 1 ? "repost" : "reposts"}
              </span>
              <span>
                <strong className="font-semibold text-[#1c2018]">{post.like_count}</strong>{" "}
                {post.like_count === 1 ? "like" : "likes"}
              </span>
              <span>
                <strong className="font-semibold text-[#1c2018]">{post.save_count}</strong>{" "}
                {post.save_count === 1 ? "save" : "saves"}
              </span>
            </div>

            {/* Action bar */}
            <div className="pt-1">
              <PostActionBar
                post={post}
                onUpdate={handlePostUpdate}
                expanded
                onCommentClick={() => {
                  composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  (composerRef.current?.querySelector("button, textarea") as HTMLElement | null)?.focus();
                }}
              />
            </div>
          </div>

          {/* Comment composer */}
          <div ref={composerRef} className="border-b border-[#d7c6a3]/30 px-4 py-3">
            <CommentComposer postId={post.id} onCreated={handleCommentCreated} />
          </div>

          {/* Comment thread */}
          <CommentThread
            postId={post.id}
            comments={comments}
            status={commentsStatus}
            onDeleted={handleCommentDeleted}
          />
        </article>
      </div>
      <RightPanel />
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PostDetailSkeleton() {
  return (
    <div className="animate-pulse px-4 py-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-zinc-800" />
        <div className="h-3 w-32 rounded bg-zinc-800" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-zinc-800" />
        <div className="h-3 w-5/6 rounded bg-zinc-800" />
        <div className="h-3 w-3/4 rounded bg-zinc-800" />
      </div>
      <div className="mt-5 h-3 w-24 rounded bg-zinc-800" />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}