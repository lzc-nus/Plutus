"use client";

import { useEffect, useState } from "react";
import { getUserById } from "@/lib/api/users";
import Link from "next/link";

interface UserAvatarProps {
  userId: string;
  /** "sm" = 28px, default = 36px */
  size?: "sm" | "md";
  /** When true, renders a plain div instead of a Link. */
  disableLink?: boolean;
}

interface UserStub {
  display_name: string | null;
  avatar_url: string | null;
}

// Module-level cache so repeated mounts don't re-fetch the same user.
const cache = new Map<string, UserStub>();

export function UserAvatar({ userId, size = "md", disableLink = false }: UserAvatarProps) {
  const [user, setUser] = useState<UserStub | null>(cache.get(userId) ?? null);

  useEffect(() => {
    if (cache.has(userId)) return;
    getUserById(userId)
      .then((res) => {
        if (res.data) {
          const stub: UserStub = {
            display_name: res.data.display_name ?? res.data.username,
            avatar_url: res.data.avatar_url ?? null,
          };
          cache.set(userId, stub);
          setUser(stub);
        }
      })
      .catch(() => {});
  }, [userId]);

  const sizeClasses = size === "sm"
    ? "h-7 w-7 text-[10px]"
    : "h-9 w-9 text-xs";

  const nameClasses = size === "sm"
    ? "text-xs font-medium text-zinc-300"
    : "text-sm font-medium text-zinc-200";

  const avatar = (
    <div className={`${sizeClasses} shrink-0 overflow-hidden rounded-full bg-zinc-700`}>
      {user?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar_url}
          alt={user.display_name ?? ""}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-semibold uppercase text-zinc-400">
          {getInitials(user?.display_name ?? userId)}
        </span>
      )}
    </div>
  );

  const name = (
    <span className={nameClasses}>
      {user === null
        ? <span className="inline-block h-3 w-20 animate-pulse rounded bg-zinc-700" />
        : (user.display_name ?? "")}
    </span>
  );

  const profileUrl = `/profile/${userId}`;

  if (disableLink) {
    return (
      <div className="flex items-center gap-2">
        {avatar}
        {name}
      </div>
    );
  }

  return (
    <Link
      href={profileUrl}
      className="group flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="transition-opacity group-hover:opacity-80">{avatar}</div>
      <span className={`${nameClasses} group-hover:underline`}>
        {user?.display_name ?? (
          <span className="inline-block h-3 w-20 animate-pulse rounded bg-zinc-700" />
        )}
      </span>
    </Link>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}