"use client";

import { useState } from "react";
import { useOptionalViewer } from '@/lib/hooks/useOptionalViewer';
import type { PostRead, UserRead } from "@/lib/api/generated";
import {
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  sharePost,
  repostPost,
} from "@/lib/api/community";
import { RepostComposer } from "@/components/community/RepostComposer";
import { ShareModal } from "@/components/community/ShareModal";
import { AuthRequiredDialog } from "@/components/community/AuthRequiredDialog";
import { useRouter } from "next/navigation";

interface PostActionBarProps {
  post: PostRead;
  viewer?: UserRead | null;
  onAuthRequired?: (action: string) => void;
  onUpdate: (updated: PostRead) => void;
  /** When true, shows full count labels. Used in PostDetail. */
  expanded?: boolean;
  /**
   * Called when the comment button is clicked.
   * PostDetail passes a scroll-to-composer callback.
   * PostCard leaves this undefined — the card body Link handles navigation.
   */
  onCommentClick?: () => void;
}

export function PostActionBar({
  post,
  viewer,
  onAuthRequired,
  onUpdate,
  expanded = false,
  onCommentClick,
}: PostActionBarProps) {
  const [liked, setLiked] = useState(post.is_liked_by_me ?? false);
  const [saved, setSaved] = useState(post.is_saved_by_me ?? false);
  const [repostOpen, setRepostOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const { viewer: user } = useOptionalViewer();
  const [authAction, setAuthAction] = useState<string | null>(null);
  const router = useRouter();

  // ── Like ────────────────────────────────────────────────────────────────────

  async function handleLike() {
    if (!user) { 
      setAuthAction("like posts");
      return;
    }

    // Optimistic toggle
    const wasLiked = liked;
    setLiked(!wasLiked);
    onUpdate({
      ...post,
      is_liked_by_me: !wasLiked,
      like_count: wasLiked ? post.like_count - 1 : post.like_count + 1,
    });

    try {
      if (wasLiked) {
        await unlikePost(post.id);
      } else {
        const res = await likePost(post.id);
        if (res.data) onUpdate(res.data);
      }
    } catch {
      // Revert on failure
      setLiked(wasLiked);
      onUpdate(post);
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!user) {
      setAuthAction("save posts");
      return;
    }

    const wasSaved = saved;
    setSaved(!wasSaved);
    onUpdate({
      ...post,
      is_saved_by_me: !wasSaved,
      save_count: wasSaved ? post.save_count - 1 : post.save_count + 1,
    });

    try {
      if (wasSaved) {
        await unsavePost(post.id);
      } else {
        const res = await savePost(post.id);
        if (res.data) onUpdate(res.data);
      }
    } catch {
      setSaved(wasSaved);
      onUpdate(post);
    }
  }

  // ── Share ───────────────────────────────────────────────────────────────────

  async function handleShare() {
    if (!user) {
      setAuthAction("share posts");
      return;
    }

    try {
      const res = await sharePost(post.id);
      if (res.data) {
        setShareUrl(res.data.share_url);
        setShareOpen(true);
        onUpdate({ ...post, share_count: post.share_count + 1 });
      }
    } catch {
      // silently fail — share count not critical
    }
  }

  // ── Repost (simple, no composer) ────────────────────────────────────────────

  async function handleSimpleRepost() {
    if (!user) {
      setAuthAction("repost");
      return;
    }

    try {
      await repostPost(post.id, { content_blocks: [] });
      onUpdate({ ...post, repost_count: post.repost_count + 1 });
    } catch {
      // silently fail
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex items-center justify-between text-zinc-500">

        {/* Comment */}
        <ActionButton
          icon={<CommentIcon />}
          count={post.comment_count}
          label="comments"
          expanded={expanded}
          onClick={() => {
            if (!user) {
              setAuthAction("comment");
              return;
            }
            if (onCommentClick) {
              onCommentClick();
            } else {
              router.push(`/community/posts/${post.id}#comment-composer`);
            }
          }}
          activeColor="text-sky-400"
        />

        {/* Repost — left click = simple repost, right click / long press = quote */}
        <div className="relative">
          <ActionButton
            icon={<RepostIcon />}
            count={post.repost_count}
            label="reposts"
            expanded={expanded}
            onClick={handleSimpleRepost}
            onAltClick={() => {
              if (!viewer) {
                onAuthRequired?.("repost");
                return;
              }
              setRepostOpen(true);
            }}
            activeColor="text-emerald-400"
            title="Repost · Hold for quote repost"
          />
        </div>

        {/* Like */}
        <ActionButton
          icon={<LikeIcon filled={liked} />}
          count={post.like_count}
          label="likes"
          expanded={expanded}
          onClick={handleLike}
          active={liked}
          activeColor="text-rose-400"
        />

        {/* Share */}
        <ActionButton
          icon={<ShareIcon />}
          count={post.share_count}
          label="shares"
          expanded={expanded}
          onClick={handleShare}
          activeColor="text-violet-400"
        />

        {/* Save */}
        <ActionButton
          icon={<SaveIcon filled={saved} />}
          count={post.save_count}
          label="saves"
          expanded={expanded}
          onClick={handleSave}
          active={saved}
          activeColor="text-amber-400"
        />
      </div>

      {/* Modals */}
      {repostOpen && (
        <RepostComposer
          post={post}
          onClose={() => setRepostOpen(false)}
          onReposted={() => {
            onUpdate({ ...post, repost_count: post.repost_count + 1 });
            setRepostOpen(false);
          }}
        />
      )}

      {shareOpen && shareUrl && (
        <ShareModal
          url={shareUrl}
          onClose={() => setShareOpen(false)}
        />
      )}

      {authAction && (
        <AuthRequiredDialog
          action={authAction}
          onClose={() => setAuthAction(null)}
        />
      )}
    </>
  );
}

// ── ActionButton ──────────────────────────────────────────────────────────────

interface ActionButtonProps {
  icon: React.ReactNode;
  count: number;
  label: string;
  expanded: boolean;
  onClick: () => void;
  onAltClick?: () => void;
  active?: boolean;
  activeColor: string;
  title?: string;
}

function ActionButton({
  icon,
  count,
  label,
  expanded,
  onClick,
  onAltClick,
  active = false,
  activeColor,
  title,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      onContextMenu={
        onAltClick
          ? (e) => { e.preventDefault(); onAltClick(); }
          : undefined
      }
      title={title}
      className={[
        "flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs transition-colors",
        "hover:bg-[#ede5d4]",
        active ? activeColor : "text-[#a99b82] hover:text-[#6b6252]",
      ].join(" ")}
    >
      <span className="h-4 w-4">{icon}</span>
      <span className={expanded ? "text-xs" : "sr-only"}>
        {count > 0 ? formatCount(count) : ""}
        {expanded && count > 0 ? ` ${label}` : ""}
      </span>
      {!expanded && count > 0 && (
        <span aria-hidden className="text-xs">
          {formatCount(count)}
        </span>
      )}
    </button>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function RepostIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function LikeIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function SaveIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
