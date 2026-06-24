"use client";

import { useState } from "react";
import type { CommentRead, UserRead } from "@/lib/api/generated";
import { createComment } from "@/lib/api/community";
import { ContentBlockEditor } from "@/components/community/ContentBlockEditor";
import type { ContentBlock } from "@/lib/validations/community";

interface CommentComposerProps {
  postId: string;
  viewer: UserRead | null;
  onAuthRequired?: (action: string) => void;
  onCreated: (comment: CommentRead) => void;
}

export function CommentComposer({
  postId,
  viewer,
  onAuthRequired,
  onCreated,
}: CommentComposerProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [expanded, setExpanded] = useState(false);

  const textBlock = blocks.find((b) => b.type === "text");
  const textLength = textBlock?.type === "text" ? textBlock.value.length : 0;
  const canSubmit = blocks.length > 0 && textLength <= 280 && status !== "submitting";

  async function handleSubmit() {
    if (!viewer) {
      onAuthRequired?.("comment");
      return;
    }

    if (!canSubmit) return;
    setStatus("submitting");
    try {
      const res = await createComment(postId, { content_blocks: blocks });
      if (res.data) {
        onCreated(res.data);
        setBlocks([]);
        setExpanded(false);
      }
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  function handleCancel() {
    setBlocks([]);
    setExpanded(false);
    setStatus("idle");
  }

  // ── Collapsed state — single-line prompt ───────────────────────────────────

  if (!expanded) {
    return (
      <button
        onClick={() => {
          if (!viewer) {
            onAuthRequired?.("comment");
            return;
          }
          setExpanded(true);
        }}
        className="w-full rounded-xl border border-[#d7c6a3]/50 bg-white/70 px-4 py-2.5 text-left text-sm text-[#a99b82] transition-colors hover:border-[#d8bd75]/40 hover:bg-white"
      >
        {viewer ? "Write a comment..." : "Sign in to comment"}
      </button>
    );
  }

  // ── Expanded state — full editor ───────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#d7c6a3]/50 bg-white px-4 py-3">
      <ContentBlockEditor
        blocks={blocks}
        onChange={setBlocks}
        placeholder="Write a comment…"
        autoFocus
      />

      {status === "error" && (
        <p className="text-xs text-rose-400">
          Failed to post comment. Try again.
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-[#d7c6a3]/30 pt-2">
        <button
          onClick={handleCancel}
          className="rounded-lg px-3 py-1.5 text-xs text-[#a99b82] transition-colors hover:bg-[#ede5d4] hover:text-[#1c2018]"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={[
            "rounded-lg px-4 py-1.5 text-xs font-medium transition-colors",
            canSubmit
              ? "bg-emerald-500 text-white hover:bg-emerald-400"
              : "cursor-not-allowed bg-[#e8dfc8] text-[#a99b82]",
          ].join(" ")}
        >
          {status === "submitting" ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}
