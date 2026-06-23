"use client";

import { useEffect, useRef, useState } from "react";
import type { PostRead } from "@/lib/api/generated";
import { createPost } from "@/lib/api/community";
import { ContentBlockEditor } from "@/components/dashboard/community/ContentBlockEditor";
import type { ContentBlock } from "@/lib/validations/community";

interface PostComposerProps {
  onClose: () => void;
  onCreated: (post: PostRead) => void;
}

export function PostComposer({ onClose, onCreated }: PostComposerProps) {
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

  // Restore focus on unmount
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    return () => prev?.focus();
  }, []);

  const textBlock = blocks.find((b) => b.type === "text");
  const textLength = textBlock?.type === "text" ? textBlock.value.length : 0;
  const canSubmit = blocks.length > 0 && textLength <= 280 && status !== "submitting";

  async function handleSubmit() {
    if (!canSubmit) return;
    setStatus("submitting");
    try {
      const res = await createPost({ content_blocks: blocks });
      if (res.data) {
        onCreated(res.data);
        onClose();
      }
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal
      aria-label="Create post"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-full max-w-lg flex-col rounded-t-2xl border border-[#d7c6a3]/40 bg-white sm:rounded-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d7c6a3]/30 px-4 py-3">
          <span className="text-sm font-medium text-[#1c2018]">New post</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-[#a99b82] transition-colors hover:bg-[#ede5d4] hover:text-[#1c2018]"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Editor */}
        <div className="px-4 py-4">
          <ContentBlockEditor
            blocks={blocks}
            onChange={setBlocks}
            placeholder="What's on your mind?"
            autoFocus
          />
        </div>

        {/* Error */}
        {status === "error" && (
          <p className="px-4 pb-2 text-xs text-rose-400">
            Failed to post. Try again.
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#d7c6a3]/30 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-[#a99b82] transition-colors hover:bg-[#ede5d4] hover:text-[#1c2018]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={[
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              canSubmit
                ? "bg-emerald-500 text-white hover:bg-emerald-400"
                : "cursor-not-allowed bg-[#e8dfc8] text-[#a99b82]",
            ].join(" ")}
          >
            {status === "submitting" ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Icon ──────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}