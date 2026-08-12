"use client";

import { useEffect, useRef, useState } from "react";
import type { ContentBlock } from "@/lib/validations/community";

interface ContentBlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
  maxBlocks?: number; // default to 50 (backend limit)
}

type MediaType = "image" | "video" | "audio" | "gif" | "sticker";

function mimeToBlockType(mime: string): MediaType {
  if (mime === "image/gif") {
    return "gif";
  }

  if (mime.startsWith("image/")) {
    return "image";
  }

  if (mime.startsWith("video/")) {
    return "video";
  }

  if (mime.startsWith("audio/")) {
    return "audio";
  }

  return "image";
}

export function ContentBlockEditor({
  blocks,
  onChange,
  placeholder = "What's on your mind?",
  autoFocus = false,
  maxBlocks = 50,
}: ContentBlockEditorProps) {
  const [linkInput, setLinkInput] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [linkPanelOpen, setLinkPanelOpen] = useState(false);

  const [stickerInput, setStickerInput] = useState("");
  const [stickerPanelOpen, setStickerPanelOpen] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  const atLimit = blocks.length >= maxBlocks;

  // keep text as one block and update the last text block when typing
  const lastTextBlock = blocks.findLast((b) => b.type === "text");
  const lastTextIndex = blocks.findLastIndex((b) => b.type === "text");

  function handleTextChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;

    if (lastTextIndex === -1) {
      // no text block yet, append one
      onChange([...blocks, { type: "text", value }]);
    } else {
      const nextBlocks = [...blocks];
      nextBlocks[lastTextIndex] = { type: "text", value };
      onChange(nextBlocks);
    }
    
    // make the textarea grow as the user type
    event.target.style.height = "auto";
    event.target.style.height = `${event.target.scrollHeight}px`;
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    
    if (files.length === 0) {
      return;
    }

    const remaining = maxBlocks - blocks.length;
    const toAdd = files.slice(0, remaining);

    
    const newBlocks: ContentBlock[] = toAdd.map(file => ({
      type: mimeToBlockType(file.type),
      url: URL.createObjectURL(file),
    }));

    onChange([...blocks, ...newBlocks]);

    // allow the same file to be selected again
    event.target.value = "";
  }

  function handleAddLink() {
    const url = linkInput.trim();
    
    if (!url) {
      return;
    }
    
    onChange([
      ...blocks,
      {
        type: "link",
        url,
        ...(linkTitle.trim() 
          ? { title: linkTitle.trim() } 
          : {}),
        ...(linkDescription.trim() 
          ? { description: linkDescription.trim() } 
          : {}),
      },
    ]);

    setLinkInput("");
    setLinkTitle("");
    setLinkDescription("");
    setLinkPanelOpen(false);
  }

  function handleAddSticker() {
    const url = stickerInput.trim();
    if (!url) return;
    onChange([...blocks, { type: "sticker", url }]);
    setStickerInput("");
    setStickerPanelOpen(false);
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Text input */}
      <textarea
        ref={textareaRef}
        value={lastTextBlock?.value ?? ""}
        onChange={handleTextChange}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none overflow-hidden bg-transparent text-sm leading-relaxed text-[#2c2c24] placeholder:text-[#a99b82] focus:outline-none"
      />

      {/* Non-text block previews */}
      {blocks.filter(block => block.type !== "text").length > 0 && (
        <div className="flex flex-wrap gap-2">
          {blocks.map((block, index) => {
            if (block.type === "text") {
              return null;
            }

            return (
              <BlockChip
                key={index}
                block={block}
                onRemove={() => removeBlock(index)}
              />
            );
          })}
        </div>
      )}

      {/* Link panel */}
      {linkPanelOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-[#d7c6a3]/50 bg-[#f5efe3] p-3">
          <input
            type="url"
            value={linkInput}
            onChange={event => setLinkInput(event.target.value)}
            placeholder="https://example.com"
            autoFocus
            className="w-full rounded-lg border border-[#d7c6a3]/50 bg-white px-3 py-2 text-sm text-[#2c2c24] placeholder:text-[#a99b82] focus:border-[#d8bd75]/60 focus:outline-none"
          />

          <input
            type="text"
            value={linkTitle}
            onChange={event => setLinkTitle(event.target.value)}
            placeholder="Title (optional)"
            className="w-full rounded-lg border border-[#d7c6a3]/50 bg-white px-3 py-2 text-sm text-[#2c2c24] placeholder:text-[#a99b82] focus:border-[#d8bd75]/60 focus:outline-none"
          />
          
          <input
            type="text"
            value={linkDescription}
            onChange={event => setLinkDescription(event.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded-lg border border-[#d7c6a3]/50 bg-white px-3 py-2 text-sm text-[#2c2c24] placeholder:text-[#a99b82] focus:border-[#d8bd75]/60 focus:outline-none"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setLinkPanelOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </button>

            <button
              onClick={handleAddLink}
              disabled={!linkInput.trim()}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                linkInput.trim()
                  ? "bg-emerald-500 text-white hover:bg-emerald-400"
                  : "cursor-not-allowed bg-zinc-800 text-zinc-500",
              ].join(" ")}
            >
              Add link
            </button>
          </div>
        </div>
      )}

      {/* Sticker panel */}
      {stickerPanelOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-[#d7c6a3]/50 bg-[#f5efe3] p-3">
          <input
            type="url"
            value={stickerInput}
            onChange={event => setStickerInput(event.target.value)}
            placeholder="Sticker URL"
            autoFocus
            className="w-full rounded-lg border border-[#d7c6a3]/50 bg-white px-3 py-2 text-sm text-[#2c2c24] placeholder:text-[#a99b82] focus:border-[#d8bd75]/60 focus:outline-none"
          />
          
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setStickerPanelOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </button>

            <button
              onClick={handleAddSticker}
              disabled={!stickerInput.trim()}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                stickerInput.trim()
                  ? "bg-emerald-500 text-white hover:bg-emerald-400"
                  : "cursor-not-allowed bg-zinc-800 text-zinc-500",
              ].join(" ")}
            >
              Add sticker
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1 border-t border-[#d7c6a3]/30 pt-2">
        
        {/* Media upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          disabled={atLimit}
          label="Add image or video"
        >
          <MediaIcon />
        </ToolbarButton>

        {/* GIF */}
        <ToolbarButton
          onClick={() => {
            if (!fileInputRef.current) {
              return;
            }
            
            fileInputRef.current.accept = "image/gif";
            fileInputRef.current.click();

            fileInputRef.current.addEventListener(
              "change",
              () => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "image/*,video/*,audio/*";
                }
              },
              { once: true },
            );
          }}
          disabled={atLimit}
          label="Add GIF"
        >
          <GifIcon />
        </ToolbarButton>

        {/* Sticker */}
        <ToolbarButton
          onClick={() => {
            setLinkPanelOpen(false);
            setStickerPanelOpen(open => !open);
          }}
          disabled={atLimit}
          label="Add sticker"
          active={stickerPanelOpen}
        >
          <StickerIcon />
        </ToolbarButton>

        {/* Link */}
        <ToolbarButton
          onClick={() => {
            setStickerPanelOpen(false);
            setLinkPanelOpen(open => !open);
          }}
          disabled={atLimit}
          label="Add link"
          active={linkPanelOpen}
        >
          <LinkIcon />
        </ToolbarButton>

        {/* Character count for the active text block */}
        {lastTextBlock !== undefined && (
          <span
            className={[
              "ml-auto text-xs tabular-nums transition-colors",
              (lastTextBlock.value?.length ?? 0) >= 280
                ? "text-rose-400"
                : (lastTextBlock.value?.length ?? 0) >= 260
                ? "text-amber-400"
                : "text-zinc-600",
            ].join(" ")}
          >
            {lastTextBlock.value?.length ?? 0}/280
          </span>
        )}
      </div>
    </div>
  );
}

// removable preview for non-text blocks
function BlockChip({
  block,
  onRemove,
}: {
  block: ContentBlock;
  onRemove: () => void;
}) {
  const label = block.type === "link"
    ? (block.title ?? block.url)
    : block.type.charAt(0).toUpperCase() + block.type.slice(1);

  const isMedia =
    block.type === "image" ||
    block.type === "gif" ||
    block.type === "sticker";

  return (
    <div className="group relative flex items-center gap-1.5 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 pr-2">
      {isMedia && "url" in block ? (
        <div className="h-9 w-9 shrink-0 overflow-hidden bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={block.url} 
            alt="" 
            className="h-full w-full object-cover" 
          />
        </div>
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-zinc-800 text-zinc-500">
          <ChipIcon type={block.type} />
        </div>
      )}
      
      <span className="max-w-[120px] truncate text-xs text-zinc-400">
        {label}
      </span>
      
      <button
        onClick={onRemove}
        aria-label={`Remove ${block.type} block`}
        className="ml-1 rounded-full text-zinc-600 transition-colors hover:text-rose-400"
      >
        <RemoveIcon />
      </button>
    </div>
  );
}

function ToolbarButton({
  onClick,
  disabled,
  label,
  active,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={[
        "rounded-full p-1.5 transition-colors",
        disabled
          ? "cursor-not-allowed text-[#d7c6a3]"
          : active
          ? "bg-emerald-500/15 text-emerald-400"
          : "text-[#a99b82] hover:bg-[#ede5d4] hover:text-[#6b6252]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ICONS

function MediaIcon() {
  return (
    <svg 
      className="h-4 w-4" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.75" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function GifIcon() {
  return (
    <svg 
      className="h-4 w-4" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.75" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      aria-hidden
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M8 12h-2v0a2 2 0 1 0 0-0" />
      <line x1="12" y1="9" x2="12" y2="15" />
      <path d="M16 9h2v2h-2v1h2" />
    </svg>
  );
}

function StickerIcon() {
  return (
    <svg 
      className="h-4 w-4" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.75" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      aria-hidden
    >
      <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg 
      className="h-4 w-4" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.75" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg 
      className="h-3 w-3" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChipIcon({ type }: { type: ContentBlock["type"] }) {
  if (type === "video") {
    return (
      <svg 
        className="h-3.5 w-3.5" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.75" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        aria-hidden
      >
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" />
      </svg>
    );
  }

  if (type === "audio") {
    return (
      <svg 
        className="h-3.5 w-3.5" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.75" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        aria-hidden
      >
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    );
  }

  if (type === "link") {
    return <LinkIcon />;
  }

  return null;
}
