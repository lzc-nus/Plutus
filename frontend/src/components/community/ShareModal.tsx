"use client";

import { useEffect, useRef, useState } from "react";

interface ShareModalProps {
  url: string;
  onClose: () => void;
}

export function ShareModal({ url, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // close on Esc
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const previousElement = document.activeElement as HTMLElement | null;

    inputRef.current?.select();

    return () => previousElement?.focus();
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch {
      // If clipboard access fails, select the URL so it can be copied manually.
      inputRef.current?.select();
    }
  }

  return (
    /* Overlay */
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Share post"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={event => { 
        if (event.target === event.currentTarget) {
          onClose();
        } 
      }}
    >
      <div className="flex w-full max-w-md flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 sm:rounded-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <span className="text-sm font-medium text-white">
            Share post
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        {/* URL row */}
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2">
            <LinkIcon />

            <input
              ref={inputRef}
              readOnly
              value={url}
              aria-label="Share URL"
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-300 outline-none selection:bg-emerald-500/30"
              onFocus={event => event.currentTarget.select()}
            />
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className={[
              "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              copied
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-emerald-500 text-white hover:bg-emerald-400",
            ].join(" ")}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Hint */}
        <p className="px-4 pb-4 text-xs text-zinc-500">
          Anyone with this link can view the post.
        </p>
      </div>
    </div>
  );
}

// ICONS

function CloseIcon() {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg 
      className="shrink-0 text-zinc-500" 
      width="14" 
      height="14" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}