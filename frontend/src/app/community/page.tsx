"use client";

import { useState } from "react";
import { getGlobalFeed } from "@/lib/api/community";
import { AuthRequiredDialog } from "@/components/community/AuthRequiredDialog";
import { PostComposer } from "@/components/community/PostComposer";
import { PostFeed } from "@/components/community/PostFeed";
import { RightPanel } from "@/components/community/RightPanel";
import { useOptionalViewer } from "@/lib/hooks/useOptionalViewer";

export default function PublicCommunityPage() {
  const { viewer } = useOptionalViewer();

  const [composerOpen, setComposerOpen] = useState(false);
  const [feedVersion, setFeedVersion] = useState(0);
  const [authAction, setAuthAction] = useState<string | null>(null);

  const feedKey = `global-${feedVersion}`;

  const fetcher = (before?: string) => getGlobalFeed(20, before);

  function handleCreateClick() {
    if (!viewer) {
      setAuthAction("post");
      return;
    }

    setComposerOpen(true);
  }

  function handlePostCreated() {
    setFeedVersion((value) => value + 1);
    setComposerOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#f4efe6]">
      <div className="mx-auto flex min-h-screen max-w-[1180px] bg-[#fbf7ef] shadow-[0_0_0_1px_rgba(215,198,163,0.3)]">
        <div className="flex min-w-0 flex-1 flex-col border-r border-[#d7c6a3]/30">
          <div className="border-b border-[#d7c6a3]/30 bg-[#fbf7ef] px-6 py-4">
            <button
            type='button'
              onClick={handleCreateClick}
              className="flex w-full items-center gap-3 rounded-xl border border-[#d7c6a3]/50 bg-white/70 px-4 py-3 text-left text-sm text-[#a99b82] transition-colors hover:border-[#d8bd75]/40 hover:bg-white"
            >
              <PencilIcon />
              <span>
                {viewer 
                  ? "What's on your mind?" 
                  : "Sign in to join the conversation"
                }
              </span>
            </button>
          </div>

          <PostFeed
            fetcher={fetcher}
            feedKey={feedKey}
            viewer={viewer}
            onAuthRequired={setAuthAction}
            detailBasePath="/community/posts"
          />
        </div>

        <RightPanel 
          viewer={viewer} 
          onAuthRequired={setAuthAction} 
        />
      </div>

      {composerOpen && (
        <PostComposer
          onClose={() => setComposerOpen(false)}
          onCreated={handlePostCreated}
        />
      )}

      {authAction && (
        <AuthRequiredDialog
          action={authAction}
          onClose={() => setAuthAction(null)}
        />
      )}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg 
      className="h-4 w-4 shrink-0 text-[#a99b82]" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      aria-hidden
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
