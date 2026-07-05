"use client";

import { useEffect, useRef, useState } from "react";
import type { PostRead } from "@/lib/api/generated";
import { repostPost } from "@/lib/api/community";
import { ContentBlockEditor } from "@/components/dashboard/community/ContentBlockEditor";
import { ContentBlockRenderer } from "@/components/dashboard/community/ContentBlockRenderer";
import { UserAvatar } from "@/components/dashboard/community/UserAvatar";
import type { ContentBlock } from "@/lib/validations/community";

interface RepostComposerProps {
  post: PostRead;
  onClose: () => void;
  onReposted: () => void;
}

type Mode = "simple" | "quote";

export function RepostComposer({ post, onClose, onReposted }: RepostComposerProps) {
  const [mode, setMode] = useState<Mode>("simple");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Trap focus inside modal
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    overlayRef.current?.focus();
    return () => prev?.focus();
  }, []);

  async function handleSubmit() {
    if (mode === "quote" && blocks.length === 0) return;
    setStatus("submitting");
    try {
      await repostPost(post.id, {
        content_blocks: mode === "simple" ? [] : blocks,
      });
      onReposted();
    } catch {
      setStatus("error");
    }
  }

  const textBlock = blocks.find((b) => b.type === "text");
  const textLength = textBlock?.type === "text" ? textBlock.value.length : 0;
  const isQuoteReady = mode === "quote" && blocks.length > 0 && textLength <= 5000;
  const canSubmit = mode === "simple" || isQuoteReady;

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      tabIndex={-1}
      role="dialog"
      aria-modal
      aria-label={mode === "simple" ? "Repost" : "Quote repost"}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-full max-w-lg flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 sm:rounded-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <span className="text-sm font-medium text-white">
            {mode === "simple" ? "Repost" : "Quote repost"}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 border-b border-zinc-800 px-4 py-3">
          <ModeButton
            active={mode === "simple"}
            onClick={() => setMode("simple")}
          >
            Repost
          </ModeButton>
          <ModeButton
            active={mode === "quote"}
            onClick={() => setMode("quote")}
          >
            Quote repost
          </ModeButton>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 px-4 py-4">

          {/* Quote composer — only visible in quote mode */}
          {mode === "quote" && (
            <div className="flex flex-col gap-3">
              <ContentBlockEditor
                blocks={blocks}
                onChange={setBlocks}
                placeholder="Add your thoughts…"
                autoFocus
              />
            </div>
          )}

          {/* Original post preview */}
          <div className="rounded-xl border border-zinc-700 px-3 py-3">
            <div className="mb-2 flex items-center gap-2">
              <UserAvatar userId={post.author_id} size="sm" />
              <time
                dateTime={post.created_at}
                className="text-xs text-zinc-500"
              >
                {formatRelativeTime(post.created_at)}
              </time>
            </div>
            <div className="line-clamp-4 text-sm text-zinc-300">
              <ContentBlockRenderer blocks={post.content_blocks as ContentBlock[]} compact />
            </div>
          </div>

          {/* Error */}
          {status === "error" && (
            <p className="text-xs text-rose-400">
              Something went wrong. Please try again.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || status === "submitting"}
            className={[
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              canSubmit && status !== "submitting"
                ? "bg-emerald-500 text-white hover:bg-emerald-400"
                : "cursor-not-allowed bg-zinc-800 text-zinc-500",
            ].join(" ")}
          >
            {status === "submitting"
              ? "Reposting…"
              : mode === "simple"
              ? "Repost"
              : "Quote repost"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ModeButton ────────────────────────────────────────────────────────────────

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-emerald-500/15 text-emerald-400"
          : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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