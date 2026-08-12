"use client";

import { useState } from "react";
import { followUser, unfollowUser } from "@/lib/api/community";

interface FollowButtonProps {
  userId: string;
  // initial follow state
  // true if current user already follows this user
  initialFollowing?: boolean;
  onToggle?: (following: boolean) => void;
}

export function FollowButton({
  userId,
  initialFollowing = false,
  onToggle,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [hovered, setHovered] = useState(false);

  async function handleToggle() {
    if (status === "loading") {
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
      // revert when failure
      setFollowing(wasFollowing);
    } finally {
      setStatus("idle");
    }
  }

  let label: string;
  
  if (following) {
    label = hovered ? "Unfollow" : "Following";
  } else {
    label = "Follow";
  }

  return (
    <button
      onClick={handleToggle}
      disabled={status === "loading"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        "min-w-[96px] rounded-full px-4 py-1.5 text-sm font-medium transition-all",
        following
          ? hovered
            ? "border border-rose-500/50 bg-rose-500/10 text-rose-400"
            : "border border-zinc-600 bg-transparent text-zinc-300"
          : "bg-emerald-500 text-white hover:bg-emerald-400",
        status === "loading" ? "opacity-60" : "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}