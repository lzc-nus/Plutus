"use client";

import Link from "next/link";
import { SavedPostsGrid } from "@/components/community/SavedPostsGrid";
import { RightPanel } from "@/components/community/RightPanel";
import { useAuth } from "@/lib/hooks/useAuth";

export default function SavedPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-[#fbf7ef]">
      <div className="flex min-w-0 flex-1 flex-col border-r border-[#d7c6a3]/30">
        <div className="sticky top-0 z-10 border-b border-[#d7c6a3]/30 bg-[#fbf7ef]/95 px-6 py-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-[#1c2018]">
                Saved posts
              </h1>

              <p className="mt-1 text-sm text-[#7c7468]">
                Posts you bookmarked for later review.
              </p>
            </div>

            <Link
              href="/dashboard/community"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#d7c6a3]/55 bg-white/70 px-3 text-sm font-semibold text-[#6b6252] transition hover:border-[#d8bd75]/55 hover:bg-white hover:text-[#1c2018]"
            >
              <ArrowLeftIcon />
              Community
            </Link>
          </div>
        </div>

        <SavedPostsGrid viewer={user} />
      </div>

      <RightPanel viewer={user} />
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg 
      className="h-4 w-4 shrink-0" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      aria-hidden
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}
