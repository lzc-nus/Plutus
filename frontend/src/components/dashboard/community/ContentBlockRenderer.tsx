"use client";

import type { ContentBlock } from "@/lib/validations/community";

interface ContentBlockRendererProps {
  blocks: ContentBlock[];
  // when true, truncate text into 3 lines and collapse media into small thumbnail
  compact?: boolean;
}

export function ContentBlockRenderer({
  blocks,
  compact = false,
}: ContentBlockRendererProps) {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col ${compact ? "gap-1.5" : "gap-3"}`}>
      {blocks.map((block, index) => (
        <BlockRenderer 
          key={index} 
          block={block} 
          compact={compact} 
        />
      ))}
    </div>
  );
}

function BlockRenderer({
  block,
  compact,
}: {
  block: ContentBlock;
  compact: boolean;
}) {
  switch (block.type) {
    case "text":
      return <TextBlock value={block.value} compact={compact} />;

    case "image":
      return <ImageBlock url={block.url} compact={compact} />;

    case "gif":
      return <GifBlock url={block.url} compact={compact} />;

    case "sticker":
      return <StickerBlock url={block.url} compact={compact} />;

    case "video":
      return <VideoBlock url={block.url} compact={compact} />;

    case "audio":
      return <AudioBlock url={block.url} compact={compact} />;

    case "link":
      return (
        <LinkBlock
          url={block.url}
          title={block.title}
          description={block.description}
          compact={compact}
        />
      );

    default:
      return null;
  }
}

function TextBlock({ value, compact }: { value: string; compact: boolean }) {
  return (
    <p
      className={[
        "whitespace-pre-wrap break-words text-sm leading-relaxed text-[#2c2c24]",
        compact ? "line-clamp-3" : "",
      ].join(" ")}
    >
      {value}
    </p>
  );
}

function ImageBlock({ url, compact }: { url: string; compact: boolean }) {
  if (compact) {
    return (
      <div className="h-12 w-12 overflow-hidden rounded-md bg-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={url} 
          alt="" 
          className="h-full w-full object-cover" 
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-zinc-800">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="max-h-[480px] w-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

function GifBlock({ url, compact }: { url: string; compact: boolean }) {
  if (compact) {
    return (
      <div className="h-12 w-12 overflow-hidden rounded-md bg-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={url} 
          alt="" 
          className="h-full w-full object-cover" 
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-zinc-800">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="max-h-[360px] w-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

function StickerBlock({ url, compact }: { url: string; compact: boolean }) {
  const size = compact ? "h-10 w-10" : "h-24 w-24";

  return (
    <div className={`${size} shrink-0`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={url} 
        alt="" 
        className="h-full w-full object-contain" 
        loading="lazy" 
      />
    </div>
  );
}

function VideoBlock({ url, compact }: { url: string; compact: boolean }) {
  if (compact) {
    return (
      <div className="flex h-12 w-20 items-center justify-center overflow-hidden rounded-md bg-zinc-800">
        <VideoIcon />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-zinc-900">
      <video
        src={url}
        controls
        preload="metadata"
        className="max-h-[480px] w-full"
      />
    </div>
  );
}

function AudioBlock({ url, compact }: { url: string; compact: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-zinc-500">
        <AudioIcon />

        <span className="text-xs">
          Audio
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-zinc-300">
        <AudioIcon />
      </div>

      <audio
        src={url}
        controls
        preload="metadata"
        className="h-8 min-w-0 flex-1"
      />
    </div>
  );
}

function LinkBlock({
  url,
  title,
  description,
  compact,
}: {
  url: string;
  title?: string;
  description?: string;
  compact: boolean;
}) {
  const displayTitle = title ?? url;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-zinc-400">
        <LinkIcon />

        <span className="truncate text-xs text-emerald-400">
          {displayTitle}
        </span>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-1 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
    >
      <div className="flex items-center gap-1.5">
        <LinkIcon />

        <span className="truncate text-xs text-zinc-500">
          {getDomain(url)}
        </span>
      </div>

      {title && (
        <p className="text-sm font-medium text-zinc-200 group-hover:text-white">
          {title}
        </p>
      )}
      
      {description && !compact && (
        <p className="line-clamp-2 text-xs text-zinc-400">
          {description}
        </p>
      )}
    </a>
  );
}

// ICONS

function VideoIcon() {
  return (
    <svg 
      className="h-4 w-4 text-zinc-500" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.75" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      aria-hidden
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function AudioIcon() {
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
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg 
      className="h-3.5 w-3.5 shrink-0" 
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

// HELPERS

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}