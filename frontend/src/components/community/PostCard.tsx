"use client";

import { useState } from "react";
import Link from "next/link";
import type { PostRead, CommentRead } from "@/lib/api/generated";
import { ContentBlockRenderer } from "@/components/community/ContentBlockRenderer";
import { PostActionBar } from "@/components/community/PostActionBar";
import { UserAvatar } from "@/components/community/UserAvatar";
import { CommentThread } from "@/components/community/CommentThread";
import { CommentComposer } from "@/components/community/CommentComposer";
import { listComments } from "@/lib/api/community";
import type { ContentBlock } from "@/lib/validations/community";

interface PostCardProps {
  post: PostRead;
  disableNavigation?: boolean;
  /** When true, clicking the comment button expands inline comments instead of navigating */
  inlineComments?: boolean;
}

export function PostCard({
  post: initialPost,
  disableNavigation = false,
  inlineComments = false,
}: PostCardProps) {
  const [post, setPost] = useState<PostRead>(initialPost);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<CommentRead[]>([]);
  const [commentsStatus, setCommentsStatus] = useState<"loading" | "ready" | "error">("loading");

  const postUrl = `/community/posts/${post.id}`;

  function handleCommentClick() {
    if (!inlineComments) return;
    if (commentsOpen) {
      setCommentsOpen(false);
      return;
    }
    setCommentsOpen(true);
    setCommentsStatus("loading");
    listComments(post.id)
      .then((res) => {
        setComments(res.data ?? []);
        setCommentsStatus("ready");
      })
      .catch(() => setCommentsStatus("error"));
  }

  function handleCommentCreated(comment: CommentRead) {
    setComments((prev) => [...prev, comment]);
    setPost((prev) => ({ ...prev, comment_count: prev.comment_count + 1 }));
  }

  function handleCommentDeleted(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setPost((prev) => ({
      ...prev,
      comment_count: Math.max(0, prev.comment_count - 1),
    }));
  }

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

      {/* Content */}
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
      <PostActionBar
        post={post}
        onUpdate={setPost}
        onCommentClick={inlineComments ? handleCommentClick : undefined}
      />

      {/* Inline comment section */}
      {inlineComments && commentsOpen && (
        <div className="mt-3 border-t border-[#d7c6a3]/30 pt-3">
          <CommentComposer
            postId={post.id}
            viewer={null}
            onAuthRequired={() => {}}
            onCreated={handleCommentCreated}
          />
          <div className="mt-3">
            <CommentThread
              postId={post.id}
              comments={comments}
              status={commentsStatus}
              viewer={null}
              onAuthRequired={() => {}}
              onDeleted={handleCommentDeleted}
            />
          </div>
        </div>
      )}
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