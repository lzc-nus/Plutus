<<<<<<< HEAD
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { FollowRead, UserPublicRead } from "@/lib/api/generated";
import { getFollowers } from "@/lib/api/community";
import { getUserById } from "@/lib/api/users";
import { FollowButton } from "@/components/dashboard/community/FollowButton";
import Link from "next/link";

export default function FollowersPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const [follows, setFollows] = useState<FollowRead[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    getFollowers(userId)
      .then((res) => {
        setFollows(res.data ?? []);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [userId]);

  return (
    <div className="mx-auto min-h-screen max-w-xl border-x border-zinc-800 bg-zinc-950">

      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <BackIcon />
        </button>
        <h1 className="text-base font-semibold text-white">Followers</h1>
      </div>

      {/* List */}
      {status === "loading" && (
        <div className="flex flex-col">
          {Array.from({ length: 5 }).map((_, i) => (
            <UserRowSkeleton key={i} />
          ))}
        </div>
      )}

      {status === "error" && (
        <p className="px-4 py-10 text-center text-sm text-zinc-500">
          {"Couldn't load followers."}
        </p>
      )}

      {status === "ready" && follows.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-zinc-500">
          No followers yet.
        </p>
      )}

      {status === "ready" && follows.length > 0 && (
        <div className="flex flex-col">
          {follows.map((follow) => (
            <UserRow
              key={follow.follower_id}
              userId={follow.follower_id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── UserRow ───────────────────────────────────────────────────────────────────

function UserRow({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserPublicRead | null>(null);

  useEffect(() => {
    getUserById(userId)
      .then((res) => setUser(res.data ?? null))
      .catch(() => {});
  }, [userId]);

  if (!user) return <UserRowSkeleton />;

  return (
    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
      <Link
        href={`/profile/${userId}`}
        className="group flex min-w-0 items-center gap-3"
      >
        {/* Avatar */}
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-700">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt={user.display_name ?? user.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase text-zinc-400">
              {getInitials(user.display_name ?? user.username)}
            </span>
          )}
        </div>

        {/* Name */}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-200 group-hover:underline">
            {user.display_name ?? user.username}
          </p>
          {user.display_name && (
            <p className="truncate text-xs text-zinc-500">@{user.username}</p>
          )}
          {user.bio && (
            <p className="mt-0.5 truncate text-xs text-zinc-500">{user.bio}</p>
          )}
        </div>
      </Link>

      <div className="ml-3 shrink-0">
        <FollowButton userId={userId} />
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function UserRowSkeleton() {
  return (
    <div className="flex animate-pulse items-center justify-between border-b border-zinc-800 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800" />
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-28 rounded bg-zinc-800" />
          <div className="h-2.5 w-20 rounded bg-zinc-800" />
        </div>
      </div>
      <div className="h-8 w-20 rounded-full bg-zinc-800" />
    </div>
  );
}

// ── Icon ──────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
=======
import { ProfileUserListPage } from "@/components/profile/ProfileUserListPage";

export default function FollowersPage() {
  return <ProfileUserListPage mode="followers" />;
}
>>>>>>> 960af32b2963319ba21f279510541e91d5049988
