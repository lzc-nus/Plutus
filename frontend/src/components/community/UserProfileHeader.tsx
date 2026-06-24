"use client";

import { useEffect, useState } from "react";
import { getFollowers, getFollowing } from "@/lib/api/community";
import { FollowButton } from "@/components/community/FollowButton";

interface UserProfileHeaderProps {
  userId: string;
  /** The authenticated user's ID — used to hide FollowButton on own profile. */
  currentUserId: string;
}

interface ProfileData {
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

export function UserProfileHeader({ userId, currentUserId }: UserProfileHeaderProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const isOwnProfile = userId === currentUserId;

  useEffect(() => {
    Promise.all([
      // Replace with your actual user-fetch call once the users API exists
      fetch(`/api/users/${userId}`).then((r) => r.json()) as Promise<ProfileData>,
      getFollowers(userId),
      getFollowing(userId),
      // Check if current user follows this user
      getFollowers(userId),
    ])
      .then(([profileData, followersRes, followingRes]) => {
        setProfile(profileData);
        const followers = followersRes.data ?? [];
        const following = followingRes.data ?? [];
        setFollowerCount(followers.length);
        setFollowingCount(following.length);
        setIsFollowing(followers.some((f) => f.follower_id === currentUserId));
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [userId, currentUserId]);

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (status === "loading") {
    return <UserProfileHeaderSkeleton />;
  }

  if (status === "error" || !profile) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-zinc-500">{"Profile couldn't be loaded."}</p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="border-b border-zinc-800 px-4 pb-5 pt-6">

      {/* Avatar + follow button row */}
      <div className="mb-4 flex items-start justify-between gap-4">
        {/* Avatar */}
        <div className="h-16 w-16 overflow-hidden rounded-full bg-zinc-700 ring-2 ring-zinc-800">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xl font-semibold uppercase text-zinc-400">
              {getInitials(profile.display_name)}
            </span>
          )}
        </div>

        {/* Follow button — hidden on own profile */}
        {!isOwnProfile && (
          <FollowButton
            userId={userId}
            initialFollowing={isFollowing}
            onToggle={(following) => {
              setFollowerCount((prev) =>
                prev !== null ? prev + (following ? 1 : -1) : prev,
              );
            }}
          />
        )}
      </div>

      {/* Display name */}
      <p className="text-base font-semibold text-white">{profile.display_name}</p>

      {/* Bio */}
      {profile.bio && (
        <p className="mt-1 text-sm leading-relaxed text-zinc-400">{profile.bio}</p>
      )}

      {/* Follower / following counts */}
      <div className="mt-3 flex gap-5 text-sm">
        <span>
          <strong className="font-semibold text-white">
            {followerCount ?? "—"}
          </strong>{" "}
          <span className="text-zinc-500">
            {followerCount === 1 ? "follower" : "followers"}
          </span>
        </span>
        <span>
          <strong className="font-semibold text-white">
            {followingCount ?? "—"}
          </strong>{" "}
          <span className="text-zinc-500">following</span>
        </span>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function UserProfileHeaderSkeleton() {
  return (
    <div className="animate-pulse border-b border-zinc-800 px-4 pb-5 pt-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-16 w-16 rounded-full bg-zinc-800" />
        <div className="h-8 w-24 rounded-full bg-zinc-800" />
      </div>
      <div className="h-4 w-36 rounded bg-zinc-800" />
      <div className="mt-2 h-3 w-48 rounded bg-zinc-800" />
      <div className="mt-3 flex gap-5">
        <div className="h-3 w-20 rounded bg-zinc-800" />
        <div className="h-3 w-20 rounded bg-zinc-800" />
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}