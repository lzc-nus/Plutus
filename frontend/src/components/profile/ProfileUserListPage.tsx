"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { FollowRead, UserPublicRead } from "@/lib/api/generated";
import { getFollowers, getFollowing } from "@/lib/api/community";
import { getUserById } from "@/lib/api/users";
import { FollowButton } from "@/components/community/FollowButton";
import { AuthRequiredDialog } from "@/components/community/AuthRequiredDialog";
import { useOptionalViewer } from "@/lib/hooks/useOptionalViewer";

type ProfileListMode = "followers" | "following";

interface ProfileUserListPageProps {
  mode: ProfileListMode;
}

export function ProfileUserListPage({ mode }: ProfileUserListPageProps) {
  const { userId } = useParams<{ userId: string }>();
  const { viewer, loading: viewerLoading } = useOptionalViewer();

  const [owner, setOwner] = useState<UserPublicRead | null>(null);
  const [follows, setFollows] = useState<FollowRead[]>([]);
  const [users, setUsers] = useState<Record<string, UserPublicRead>>({});
  const [following, setFollowing] = useState<Set<string>>(() => new Set());

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState(false);
  const [authAction, setAuthAction] = useState<string | null>(null);

  const viewerId = viewer?.id;

  const userIds = useMemo(() => {
    return follows.map(follow =>
      mode === "followers" 
        ? follow.follower_id 
        : follow.followee_id,
    );
}, [follows, mode]);

  useEffect(() => {
    if (viewerLoading) {
      return;
    }

    let cancelled = false;

    async function loadList() {
      setStatus("loading");
      setError(false);

      try {
        const listRequest = 
          mode === "followers" 
            ? getFollowers(userId) 
            : getFollowing(userId);

        const followingRequest = 
          viewerId 
            ? getFollowing(viewerId) 
            : Promise.resolve({ data: [] });

        const [ownerResponse, listResponse, followingResponse] = 
          await Promise.all([
            getUserById(userId),
            listRequest,
            followingRequest,
          ]);

        const followList = listResponse.data ?? [];

        const ids = followList.map(follow =>
          mode === "followers" 
            ? follow.follower_id 
            : follow.followee_id,
        );

        const userResponses = await Promise.all(
          Array
            .from(new Set(ids))
            .map(async (id) => {
              const response = await getUserById(id);
              return [id, response.data ?? null] as const;
          }),
        );

        if (cancelled) {
          return;
        }

        const loadedUsers: Record<string, UserPublicRead> = {};

        for (const [id, user] of userResponses) {
          if (user) {
            loadedUsers[id] = user;
          }
        }

        setOwner(ownerResponse.data ?? null);
        setFollows(followList);
        setUsers(loadedUsers);

        const following = new Set( 
          (followingResponse.data ?? []).map( 
            follow => follow.followee_id, 
          ), 
        );

        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void loadList();

    return () => {
      cancelled = true;
    };
  }, [mode, userId, viewerId, viewerLoading]);

  const title = mode === "followers" ? "Followers" : "Following";
  const emptyMessage =
    mode === "followers"
      ? "No followers yet."
      : "This profile is not following anyone yet.";
  const ownerName = owner?.display_name || owner?.username || "Profile";

  const isFollowersPage = mode === "followers";

  return (
    <main className="min-h-screen bg-[#f4efe6] px-4 py-8 sm:px-6 lg:px-10">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-[#d7c6a3]/45 bg-[#fbf7ef] shadow-[0_18px_48px_rgba(43,34,24,0.08)]">
        <header className="border-b border-[#d7c6a3]/35 bg-[#fbf7ef]/95 px-4 py-4 backdrop-blur sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Link
                href={`/profile/${userId}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b6252] transition hover:text-[#1c2018]"
              >
                <ArrowLeftIcon />
                Profile
              </Link>

              <h1 className="mt-2 truncate text-2xl font-bold text-[#1c2018]">
                {title}
              </h1>

              <p className="mt-1 truncate text-sm text-[#7c7468]">
                {ownerName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1 rounded-md border border-[#d7c6a3]/45 bg-[#f4efe6] p-1">
              <Link
                href={`/profile/${userId}/followers`}
                aria-current={isFollowersPage ? "page" : undefined}
                className={[
                  "h-9 rounded px-4 text-center text-sm font-semibold leading-9 transition",
                  mode === "followers"
                    ? "bg-[#fbf7ef] text-[#1c2018] shadow-[0_6px_18px_rgba(43,34,24,0.08)]"
                    : "text-[#7c7468] hover:bg-[#fbf7ef]/60 hover:text-[#1c2018]",
                ].join(" ")}
              >
                Followers
              </Link>
              
              <Link
                href={`/profile/${userId}/following`}
                aria-current={isFollowersPage ? "page" : undefined}
                className={[
                  "h-9 rounded px-4 text-center text-sm font-semibold leading-9 transition",
                  mode === "following"
                    ? "bg-[#fbf7ef] text-[#1c2018] shadow-[0_6px_18px_rgba(43,34,24,0.08)]"
                    : "text-[#7c7468] hover:bg-[#fbf7ef]/60 hover:text-[#1c2018]",
                ].join(" ")}
              >
                Following
              </Link>
            </div>
          </div>
        </header>

        {status === "loading" && (
          <div className="grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <UserRowSkeleton key={index} />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="px-4 py-16 text-center">
            <p className="text-sm font-semibold text-[#1c2018]">
              {`Couldn't load ${mode}.`}
            </p>

            <p className="mt-1 text-sm text-[#7c7468]">
              Try again in a moment.
            </p>
          </div>
        )}

        {status === "ready" && userIds.length === 0 && (
          <div className="px-4 py-16 text-center">
            <p className="text-sm font-semibold text-[#1c2018]">
              {emptyMessage}
            </p>
          </div>
        )}

        {status === "ready" && userIds.length > 0 && (
          <div className="grid">
            {userIds.map(id => (
              <UserRow
                key={id}
                user={users[id]}
                userId={id}
                viewer={viewer}
                initialFollowing={following.has(id)}
                onAuthRequired={setAuthAction}
                onToggle={following => {
                  setFollowing(current => {
                    const next = new Set(current);

                    if (following) {
                      next.add(id);
                    } else {
                      next.delete(id);
                    }

                    return next;
                  });
                }}
              />
            ))}
          </div>
        )}
      </section>

      {authAction && (
        <AuthRequiredDialog
          action={authAction}
          onClose={() => setAuthAction(null)}
        />
      )}
    </main>
  );
}

function UserRow({
  user,
  userId,
  viewer,
  initialFollowing,
  onAuthRequired,
  onToggle,
}: {
  user: UserPublicRead | undefined;
  userId: string;
  viewer: ReturnType<typeof useOptionalViewer>["viewer"];
  initialFollowing: boolean;
  onAuthRequired: (action: string) => void;
  onToggle: (following: boolean) => void;
}) {
  if (!user) {
    return <UserRowSkeleton />;
  }

  return (
    <article className="flex items-center justify-between gap-4 border-b border-[#d7c6a3]/30 px-4 py-4 last:border-b-0 sm:px-5">
      <Link
        href={`/profile/${userId}`}
        className="group flex min-w-0 flex-1 items-center gap-3"
      >
        <UserAvatar user={user} />

        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-[#1c2018] group-hover:underline">
            {user.display_name || user.username}
          </span>

          <span className="block truncate text-xs font-medium text-[#8a7c65]">
            @{user.username}
          </span>

          {user.bio ? (
            <span className="mt-1 block truncate text-xs text-[#7c7468]">
              {user.bio}
            </span>
          ) : null}
        </span>
      </Link>

      <div className="shrink-0">
        <FollowButton
          userId={userId}
          viewer={viewer}
          initialFollowing={initialFollowing}
          onAuthRequired={onAuthRequired}
          onToggle={onToggle}
        />
      </div>
    </article>
  );
}

function UserAvatar({ user }: { user: UserPublicRead }) {
  const name = user.display_name || user.username;

  return (
    <span className="flex h-11 w-11 shrink-0 overflow-hidden rounded-md bg-[#d8bd75]/24 text-xs font-black uppercase text-[#5f4a1b]">
      {user.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img 
          src={user.avatar_url} 
          alt={name} 
          className="h-full w-full object-cover" 
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {getInitials(name)}
        </span>
      )}
    </span>
  );
}

function UserRowSkeleton() {
  return (
    <div className="flex animate-pulse items-center justify-between gap-4 border-b border-[#d7c6a3]/30 px-4 py-4 last:border-b-0 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-11 w-11 shrink-0 rounded-md bg-[#e8dfc8]" />

        <div className="grid gap-2">
          <div className="h-3 w-32 rounded bg-[#e8dfc8]" />
          <div className="h-2.5 w-20 rounded bg-[#e8dfc8]" />
        </div>
      </div>

      <div className="h-9 w-24 rounded-md bg-[#e8dfc8]" />
    </div>
  );
}

// ICON

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

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .map(part => part[0]?.toUpperCase())
    .join("");
}
