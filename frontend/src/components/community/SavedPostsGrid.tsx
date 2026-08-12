"use client";

import { useCallback, useEffect, useState } from "react";
import type { PostRead, UserRead } from "@/lib/api/generated";
import { getSavedPosts, unsavePost } from "@/lib/api/community";
import { PostCard } from "@/components/community/PostCard";

interface SavedPostsGridProps {
  viewer: UserRead | null;
}

export function SavedPostsGrid({ viewer }: SavedPostsGridProps) {
  const [posts, setPosts] = useState<PostRead[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const loadSavedPosts = useCallback(async () => { 
    setStatus("loading"); 
    
    try { 
      const res = await getSavedPosts();
      setPosts(res.data ?? []); 
      setStatus("ready"); 
    } catch { 
      setStatus("error"); 
    } 
  }, []); 
  
  useEffect(() => { 
    void loadSavedPosts(); 
  }, [loadSavedPosts]);

  function handleUnsave(postId: string) {
    // Remove it from the list right away so the UI feels responsive.
    setPosts(prev => prev.filter(post => post.id !== postId));

    unsavePost(postId).catch(() => {
      // If the request fails, reload the list so it matches the server.
      void loadSavedPosts();
    });
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col">
        {Array.from({ length: 3 }).map((_, index) => (
          <SavedPostSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-[#a99b82]">
          {"Saved posts couldn't be loaded."}
        </p>

        <button
          type="button"
          onClick={() => void loadSavedPosts()}
          className="text-sm text-[#d8bd75] hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <p className="text-sm font-medium text-[#1c2018]">
          No saved posts yet.
        </p>

        <p className="text-xs text-[#a99b82]">
          Tap the bookmark on any post to save it here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {posts.map(post => (
        <SavedPostRow
          key={post.id}
          post={post}
          viewer={viewer}
          onUnsave={() => handleUnsave(post.id)}
        />
      ))}
    </div>
  );
}

function SavedPostRow({
  post,
  onUnsave,
}: {
  post: PostRead;
  viewer: UserRead | null;
  onUnsave: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="group relative">
      <PostCard post={post} />
      
      {/* Show the remove button when the post is hovered. */}
      <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full px-2 py-1 text-xs text-[#a99b82] hover:bg-[#ede5d4]"
            >
              Keep
            </button>

            <button
              type="button"
              onClick={onUnsave}
              className="rounded-full px-2 py-1 text-xs text-rose-500 hover:bg-rose-50"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            aria-label="Remove from saved"
            title="Remove from saved"
            className="rounded-full p-1.5 text-[#a99b82] transition-colors hover:bg-[#ede5d4] hover:text-[#6b6252]"
          >
            <UnsaveIcon />
          </button>
        )}
      </div>
    </div>
  );
}

function SavedPostSkeleton() {
  return (
    <div className="animate-pulse border-b border-[#d7c6a3]/30 px-4 py-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-[#e8dfc8]" />
        <div className="h-3 w-28 rounded bg-[#e8dfc8]" />
      </div>

      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-[#e8dfc8]" />
        <div className="h-3 w-4/5 rounded bg-[#e8dfc8]" />
      </div>
    </div>
  );
}

function UnsaveIcon() {
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
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      <line x1="9" y1="10" x2="15" y2="10" />
    </svg>
  );
}
