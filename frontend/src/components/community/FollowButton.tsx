"use client";

import { useState } from "react";
import type { UserRead } from "@/lib/api/generated";
import { followUser, unfollowUser } from "@/lib/api/community";

interface FollowButtonProps {
  userId: string;
  viewer?: UserRead | null;
  onAuthRequired?: (action: string) => void;
  /** Initial follow state — pass true if the current user already follows this user. */
  initialFollowing?: boolean;
  onToggle?: (following: boolean) => void;
}

export function FollowButton({
  userId,
  viewer,
  onAuthRequired,
  initialFollowing = false,
  onToggle,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [hovered, setHovered] = useState(false);

  async function handleToggle() {
    if (status === "loading") return;
    if (!viewer) {
      onAuthRequired?.("follow people");
      return;
    }

    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setStatus("loading");
    try {
      if (wasFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
      onToggle?.(!wasFollowing);
    } catch {
      // Revert on failure
      setFollowing(wasFollowing);
    } finally {
      setStatus("idle");
    }
  }

  // ── Labels ──────────────────────────────────────────────────────────────────

  let label: string;
  if (following) {
    label = hovered ? "Unfollow" : "Following";
  } else {
    label = "Follow";
  }

  if (viewer?.id === userId) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={status === "loading"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        "h-9 min-w-[96px] rounded-md px-4 text-sm font-semibold transition",
        following
          ? hovered
            ? "border border-rose-300 bg-rose-50 text-rose-600"
            : "border border-[#d7c6a3]/70 bg-white/70 text-[#6b6252] hover:bg-white"
          : "bg-[#1c2018] text-[#fbf7ef] hover:bg-[#343a2e]",
        status === "loading" ? "opacity-60" : "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
