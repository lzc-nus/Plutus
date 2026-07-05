"use client";

import { useState } from "react";
import type { CommentRead } from "@/lib/api/generated";
import {
  deleteComment,
  likeComment,
  unlikeComment,
  shareComment,
  updateComment,
} from "@/lib/api/community";
import { ContentBlockRenderer } from "@/components/dashboard/community/ContentBlockRenderer";
import { ContentBlockEditor } from "@/components/dashboard/community/ContentBlockEditor";
import { ShareModal } from "@/components/dashboard/community/ShareModal";
import { UserAvatar } from "@/components/dashboard/community/UserAvatar";
import type { ContentBlock } from "@/lib/validations/community";

// ── CommentThread ─────────────────────────────────────────────────────────────

interface CommentThreadProps {
  postId: string;
  comments: CommentRead[];
  status: "loading" | "ready" | "error";
  onDeleted: (commentId: string) => void;
}

export function CommentThread({
  postId,
  comments,
  status,
  onDeleted,
}: CommentThreadProps) {
  const [localComments, setLocalComments] = useState<CommentRead[]>(comments);

  // Sync when parent pushes new comments (e.g. after CommentComposer creates one)
  if (comments !== localComments && comments.length !== localComments.length) {
    setLocalComments(comments);
  }

  function handleCommentUpdate(updated: CommentRead) {
    setLocalComments((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );
  }

  function handleCommentDelete(commentId: string) {
    setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
    onDeleted(commentId);
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (status === "loading") {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 3 }).map((_, i) => (
          <CommentSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <p className="px-4 py-6 text-center text-sm text-[#a99b82]">
        {"Comments couldn't be loaded."}
      </p>
    );
  }

  if (localComments.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-[#a99b82]">
        No comments yet. Be the first.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {localComments.map((comment) => (
        <CommentCard
          key={comment.id}
          postId={postId}
          comment={comment}
          onUpdate={handleCommentUpdate}
          onDelete={handleCommentDelete}
        />
      ))}
    </div>
  );
}

// ── CommentCard ───────────────────────────────────────────────────────────────

interface CommentCardProps {
  postId: string;
  comment: CommentRead;
  onUpdate: (updated: CommentRead) => void;
  onDelete: (commentId: string) => void;
}

function CommentCard({ postId, comment, onUpdate, onDelete }: CommentCardProps) {
  const [editing, setEditing] = useState(false);
  const [editBlocks, setEditBlocks] = useState<ContentBlock[]>(
    comment.content_blocks as ContentBlock[],
  );
  const [editStatus, setEditStatus] = useState<"idle" | "saving" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "confirming" | "deleting">("idle");

  // ── Edit ────────────────────────────────────────────────────────────────────

  async function handleSaveEdit() {
    if (editBlocks.length === 0) return;
    setEditStatus("saving");
    try {
      const res = await updateComment(postId, comment.id, {
        content_blocks: editBlocks,
      });
      if (res.data) {
        onUpdate(res.data);
        setEditing(false);
      }
      setEditStatus("idle");
    } catch {
      setEditStatus("error");
    }
  }

  function handleCancelEdit() {
    setEditBlocks(comment.content_blocks as ContentBlock[]);
    setEditing(false);
    setEditStatus("idle");
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (deleteStatus === "confirming") {
      setDeleteStatus("deleting");
      try {
        await deleteComment(postId, comment.id);
        onDelete(comment.id);
      } catch {
        setDeleteStatus("idle");
      }
    } else {
      setDeleteStatus("confirming");
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="group border-b border-[#d7c6a3]/30 px-4 py-3">
      {/* Author row */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <UserAvatar userId={comment.author_id} size="sm" />
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {/* Edit button */}
          {!editing && (
            <IconButton
              label="Edit comment"
              onClick={() => setEditing(true)}
            >
              <EditIcon />
            </IconButton>
          )}
          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleteStatus === "deleting"}
            aria-label={deleteStatus === "confirming" ? "Confirm delete" : "Delete comment"}
            className={[
              "rounded-full p-1 text-xs transition-colors",
              deleteStatus === "confirming"
                ? "text-rose-400 hover:bg-rose-400/10"
                : "text-[#a99b82] hover:bg-[#ede5d4] hover:text-[#6b6252]",
            ].join(" ")}
          >
            {deleteStatus === "confirming" ? (
              <span className="px-1 text-xs">Confirm?</span>
            ) : deleteStatus === "deleting" ? (
              <span className="px-1 text-xs text-zinc-600">Deleting…</span>
            ) : (
              <TrashIcon />
            )}
          </button>
        </div>
      </div>

      {/* Content — edit mode or read mode */}
      {editing ? (
        <div className="flex flex-col gap-2 pl-9">
          <ContentBlockEditor
            blocks={editBlocks}
            onChange={setEditBlocks}
            autoFocus
          />
          {editStatus === "error" && (
            <p className="text-xs text-rose-400">Failed to save. Try again.</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancelEdit}
              className="rounded-lg px-3 py-1.5 text-xs text-[#a99b82] hover:bg-[#ede5d4] hover:text-[#1c2018]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={editBlocks.length === 0 || editStatus === "saving"}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                editBlocks.length > 0 && editStatus !== "saving"
                  ? "bg-emerald-500 text-white hover:bg-emerald-400"
                  : "cursor-not-allowed bg-[#e8dfc8] text-[#a99b82]",
              ].join(" ")}
            >
              {editStatus === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="pl-9">
          <ContentBlockRenderer blocks={comment.content_blocks as ContentBlock[]} />
          {comment.updated_at !== comment.created_at && (
            <span className="mt-1 block text-xs text-[#a99b82]">edited</span>
          )}
        </div>
      )}

      {/* Action bar */}
      {!editing && (
        <div className="mt-2 pl-9">
          <CommentActionBar
            postId={postId}
            comment={comment}
            onUpdate={onUpdate}
          />
        </div>
      )}
    </div>
  );
}

// ── CommentActionBar ──────────────────────────────────────────────────────────

interface CommentActionBarProps {
  postId: string;
  comment: CommentRead;
  onUpdate: (updated: CommentRead) => void;
}

function CommentActionBar({ postId, comment, onUpdate }: CommentActionBarProps) {
  const [liked, setLiked] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  async function handleLike() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    onUpdate({
      ...comment,
      like_count: wasLiked ? comment.like_count - 1 : comment.like_count + 1,
    });
    try {
      if (wasLiked) {
        await unlikeComment(postId, comment.id);
      } else {
        const res = await likeComment(postId, comment.id);
        if (res.data) onUpdate(res.data);
      }
    } catch {
      setLiked(wasLiked);
      onUpdate(comment);
    }
  }

  async function handleShare() {
    try {
      const res = await shareComment(postId, comment.id);
      if (res.data) {
        setShareUrl(res.data.share_url);
        setShareOpen(true);
        onUpdate({ ...comment, share_count: comment.share_count + 1 });
      }
    } catch {
      // silently fail
    }
  }

  return (
    <>
      <div className="flex items-center gap-1 text-zinc-500">
        {/* Like */}
        <ActionButton
          onClick={handleLike}
          active={liked}
          activeColor="text-rose-400"
          label={liked ? "Unlike" : "Like"}
        >
          <LikeIcon filled={liked} />
          {comment.like_count > 0 && (
            <span className="text-xs">{formatCount(comment.like_count)}</span>
          )}
        </ActionButton>

        {/* Share */}
        <ActionButton
          onClick={handleShare}
          active={false}
          activeColor="text-violet-400"
          label="Share comment"
        >
          <ShareIcon />
          {comment.share_count > 0 && (
            <span className="text-xs">{formatCount(comment.share_count)}</span>
          )}
        </ActionButton>

        {/* Timestamp */}
        <time
          dateTime={comment.created_at}
          className="ml-auto text-xs text-[#a99b82]"
          title={formatFullTimestamp(comment.created_at)}
        >
          {formatRelativeTime(comment.created_at)}
        </time>
      </div>

      {shareOpen && shareUrl && (
        <ShareModal url={shareUrl} onClose={() => setShareOpen(false)} />
      )}
    </>
  );
}

// ── ActionButton ──────────────────────────────────────────────────────────────

function ActionButton({
  onClick,
  active,
  activeColor,
  label,
  children,
}: {
  onClick: () => void;
  active: boolean;
  activeColor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={[
        "flex items-center gap-1 rounded-full px-2 py-1 transition-colors hover:bg-[#ede5d4]",
        active ? activeColor : "text-[#a99b82] hover:text-[#6b6252]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ── IconButton ────────────────────────────────────────────────────────────────

function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="rounded-full p-1 text-[#a99b82] transition-colors hover:bg-[#ede5d4] hover:text-[#6b6252]"
    >
      {children}
    </button>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CommentSkeleton() {
  return (
    <div className="animate-pulse border-b border-zinc-800/60 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-[#e8dfc8]" />
        <div className="h-2.5 w-24 rounded bg-[#e8dfc8]" />
      </div>
      <div className="space-y-1.5 pl-9">
        <div className="h-2.5 w-full rounded bg-[#e8dfc8]" />
        <div className="h-2.5 w-3/4 rounded bg-[#e8dfc8]" />
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function LikeIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
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
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
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

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}