"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UserPublicRead, UserRead } from "@/lib/api/generated";
import { getFollowers, getFollowing, getUserPosts, getUserPostsCount } from "@/lib/api/community";
import { getUserById, updateMe } from "@/lib/api/users";
import { AuthRequiredDialog } from "@/components/community/AuthRequiredDialog";
import { FollowButton } from "@/components/community/FollowButton";
import { PostFeed } from "@/components/community/PostFeed";
import { useOptionalViewer } from "@/lib/hooks/useOptionalViewer";
import { profileFormSchema, type ProfileFormInput } from "@/lib/validations/profile";
import { PostCard } from "@/components/community/PostCard";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { viewer: currentUser, loading: viewerLoading } = useOptionalViewer();
  const [profile, setProfile] = useState<UserPublicRead | null>(null);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [editOpen, setEditOpen] = useState(false);
  const [authAction, setAuthAction] = useState<string | null>(null);
  const [postCount, setPostCount] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allPosts, setAllPosts] = useState<import("@/lib/api/generated").PostRead[]>([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (viewerLoading) return;

    let cancelled = false;

    async function loadProfile() {
      setStatus("loading");
      try {
        const [profileResponse, followersResponse, followingResponse, postCountResponse] = await Promise.all([
          getUserById(userId),
          getFollowers(userId),
          getFollowing(userId),
          getUserPostsCount(userId),
        ]);

        if (cancelled) return;

        const nextProfile = profileResponse.data ?? null;
        const followers = followersResponse.data ?? [];
        const following = followingResponse.data ?? [];

        if (!nextProfile) {
          setStatus("error");
          return;
        }

        setProfile(nextProfile);
        setFollowerCount(followers.length);
        setFollowingCount(following.length);
        setPostCount(postCountResponse.data ?? null);
        setIsFollowing(followers.some((follow) => follow.follower_id === currentUser?.id));
        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, userId, viewerLoading]);

  const fetcher = useCallback(
    (before?: string) => getUserPosts(userId, 20, before),
    [userId],
  );

  useEffect(() => {
    if (!userId || status !== "ready") return;
    getUserPosts(userId, 100).then((res) => {
      setAllPosts(res.data ?? []);
      setPostsLoaded(true);
    });
  }, [userId, status]);

  const displayName = useMemo(
    () => profile?.display_name || profile?.username || "Profile",
    [profile],
  );

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return allPosts;
    const q = searchQuery.toLowerCase();
    return allPosts.filter((post) =>
      (post.content_blocks as Record<string, unknown>[]).some(
        (block) =>
          block.type === "text" &&
          typeof block.value === "string" &&
          block.value.toLowerCase().includes(q),
      ),
    );
  }, [allPosts, searchQuery]);

  if (status === "loading") {
    return <ProfileSkeleton />;
  }

  if (status === "error" || !profile) {
    return (
      <main className="min-h-screen bg-[#f4efe6] px-4 py-12 sm:px-6 lg:px-10">
        <section className="mx-auto max-w-xl rounded-lg border border-[#d7c6a3]/45 bg-[#fbf7ef] px-6 py-12 text-center shadow-[0_18px_48px_rgba(43,34,24,0.08)]">
          <p className="text-base font-bold text-[#1c2018]">Profile could not be loaded.</p>
          <Link
            href="/community"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[#1c2018] px-4 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343a2e]"
          >
            Community
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4efe6] px-4 pt-4 pb-8 sm:px-6 lg:px-10">
      <div className={`mx-auto grid max-w-[1180px] items-start gap-6 transition-all duration-300 ${sidebarCollapsed ? "lg:grid-cols-[0px_minmax(0,1fr)]" : "lg:grid-cols-[340px_minmax(0,1fr)]"}`}>
        <aside className={`min-w-0 transition-all duration-300 ${sidebarCollapsed ? "hidden lg:block lg:w-0 lg:overflow-hidden" : ""}`}>
          <section className="overflow-hidden rounded-lg border border-[#d7c6a3]/45 bg-[#fbf7ef] shadow-[0_18px_48px_rgba(43,34,24,0.08)] lg:sticky lg:top-28">
            <div className="h-24 border-b border-[#d7c6a3]/25 bg-[#171b17]" />

            <div className="px-5 pb-5">
              <div className="-mt-12 flex items-end justify-between gap-4">
                <ProfileAvatar profile={profile} size="lg" />

                {isOwnProfile ? (
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="mb-1 inline-flex h-9 items-center justify-center rounded-md bg-[#1c2018] px-4 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343a2e]"
                  >
                    Edit profile
                  </button>
                ) : (
                  <div className="mb-1">
                    <FollowButton
                      userId={userId}
                      viewer={currentUser}
                      onAuthRequired={setAuthAction}
                      initialFollowing={isFollowing}
                      onToggle={(following) => {
                        setIsFollowing(following);
                        setFollowerCount((prev) =>
                          prev !== null ? prev + (following ? 1 : -1) : prev,
                        );
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-4 min-w-0">
                <h1 className="truncate text-2xl font-bold text-[#1c2018]">{displayName}</h1>
                <p className="mt-1 truncate text-sm font-semibold text-[#8a7c65]">
                  @{profile.username}
                </p>

                <p className="mt-4 text-sm leading-6 text-[#6b6252]">
                  {profile.bio || "No bio yet."}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <ProfileStat
                    href={`/profile/${userId}/followers`}
                    label={followerCount === 1 ? "Follower" : "Followers"}
                    value={followerCount}
                  />
                  <ProfileStat
                    href={`/profile/${userId}/following`}
                    label="Following"
                    value={followingCount}
                  />
                  <ProfileStat
                    href={`/profile/${userId}`}
                    label="Posts"
                    value={postCount}
                  />
                </div>

                <div className="mt-5 border-t border-[#d7c6a3]/35 pt-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#8a7c65]">
                    Member since
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#1c2018]">
                    {formatMonthYear(profile.created_at)}
                  </p>
                </div>

                {isOwnProfile ? (
                  <Link
                    href="/dashboard/community"
                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md border border-[#d7c6a3]/55 bg-white/70 text-sm font-semibold text-[#6b6252] transition hover:border-[#d8bd75]/55 hover:bg-white hover:text-[#1c2018]"
                  >
                    Dashboard community
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        </aside>

        <div className="flex flex-col gap-4 min-w-0 pt-0">
          <div className="flex items-center gap-3">
            <div className="flex w-full items-center gap-3 rounded-lg border border-[#d7c6a3]/45 bg-[#fbf7ef] px-3 py-2 shadow-[0_18px_48px_rgba(43,34,24,0.08)]">
              {/* Collapse/expand toggle */}
              <button
                onClick={() => setSidebarCollapsed((v) => !v)}
                aria-label={sidebarCollapsed ? "Show profile" : "Hide profile"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d7c6a3]/55 bg-[#fbf7ef] text-[#6b6252] transition hover:border-[#d8bd75]/55 hover:bg-white hover:text-[#1c2018]"
              >
                <PanelIcon collapsed={sidebarCollapsed} />
              </button>

              {/* Search bar */}
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#a99b82]">
                  <SearchIcon />
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts…"
                  className="w-full rounded-md border border-[#d7c6a3]/55 bg-[#fbf7ef] py-2 pl-9 pr-3 text-sm text-[#1c2018] placeholder:text-[#a99b82] focus:border-[#d8bd75]/70 focus:outline-none"
                />
              </div>

              {/* Notification bell */}
              <button
                aria-label="Notifications"
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d7c6a3]/55 bg-[#fbf7ef] text-[#6b6252] transition hover:border-[#d8bd75]/55 hover:bg-white hover:text-[#1c2018]"
              >
                <BellIcon />
                {/* Unread dot — remove if not needed yet */}
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#d8bd75]" />
              </button>
            </div>
          </div>

          <section className="min-w-0 overflow-hidden rounded-lg border border-[#d7c6a3]/45 bg-[#fbf7ef] shadow-[0_18px_48px_rgba(43,34,24,0.08)]">
            <header className="border-b border-[#d7c6a3]/35 bg-[#fbf7ef]/95 px-4 py-4 backdrop-blur sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#8a7c65]">
                    Activity
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-[#1c2018]">Posts</h2>
                </div>
                <Link
                  href="/community"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-[#d7c6a3]/55 bg-white/70 px-3 text-sm font-semibold text-[#6b6252] transition hover:border-[#d8bd75]/55 hover:bg-white hover:text-[#1c2018]"
                >
                  Community
                </Link>
              </div>
            </header>

            {postCount === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <p className="text-sm font-bold text-[#1c2018]">
                  {isOwnProfile ? "You haven't posted yet." : "No posts yet."}
                </p>
                {isOwnProfile && (
                  <Link
                    href="/dashboard/community"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-[#1c2018] px-4 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343a2e]"
                  >
                    Create your first post
                  </Link>
                )}
              </div>
            ) : searchQuery && postsLoaded ? (
              filteredPosts.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm font-semibold text-[#1c2018]">No posts match &quot;{searchQuery}&quot;.</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-2 text-sm text-[#d8bd75] hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#d7c6a3]/30">
                  {filteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} inlineComments />
                  ))}
                </div>
              )
            ) : (
              <PostFeed
                fetcher={fetcher}
                feedKey={`profile-${userId}-${currentUser?.id ?? "guest"}`}
                viewer={currentUser}
                onAuthRequired={setAuthAction}
                detailBasePath="/community/posts"
              />
            )}
          </section>
        </div>
      </div>

      {editOpen && currentUser && (
        <EditProfileModal
          user={currentUser}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            setProfile((prev) =>
              prev
                ? {
                    ...prev,
                    display_name: updated.display_name,
                    bio: updated.bio,
                    avatar_url: updated.avatar_url,
                  }
                : prev,
            );
            setEditOpen(false);
          }}
        />
      )}

      {authAction && (
        <AuthRequiredDialog
          action={authAction}
          onClose={() => setAuthAction(null)}
        />
      )}
    </main>
  );
}

function ProfileAvatar({
  profile,
  size = "md",
}: {
  profile: UserPublicRead;
  size?: "md" | "lg";
}) {
  const name = profile.display_name || profile.username;
  const sizeClass = size === "lg" ? "h-24 w-24 text-2xl" : "h-14 w-14 text-sm";

  return (
    <div className={`${sizeClass} overflow-hidden rounded-lg border-4 border-[#fbf7ef] bg-[#d8bd75]/24 font-black uppercase text-[#5f4a1b] shadow-[0_12px_32px_rgba(43,34,24,0.16)]`}>
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatar_url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

function ProfileStat({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: number | null;
}) {
  return (
    <Link
      href={href}
      className="rounded-md border border-[#d7c6a3]/45 bg-white/55 px-3 py-3 transition hover:border-[#d8bd75]/55 hover:bg-white"
    >
      <span className="block text-lg font-bold tabular-nums text-[#1c2018]">
        {value ?? "-"}
      </span>
      <span className="mt-1 block text-xs font-semibold text-[#8a7c65]">{label}</span>
    </Link>
  );
}

interface EditProfileModalProps {
  user: UserRead;
  onClose: () => void;
  onSaved: (updated: UserRead) => void;
}

function EditProfileModal({ user, onClose, onSaved }: EditProfileModalProps) {
  const [submitStatus, setSubmitStatus] = useState<"idle" | "saving" | "error">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      display_name: user.display_name ?? "",
      bio: user.bio ?? "",
      avatar_url: user.avatar_url ?? "",
    },
  });

  async function onSubmit(data: ProfileFormInput) {
    setSubmitStatus("saving");
    try {
      const res = await updateMe({
        display_name: data.display_name || null,
        bio: data.bio || null,
        avatar_url: data.avatar_url || null,
      });
      if (res.data) {
        onSaved(res.data);
      }
      setSubmitStatus("idle");
    } catch {
      setSubmitStatus("error");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="Edit profile"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#121417]/70 px-4 backdrop-blur-sm sm:items-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-xl flex-col rounded-t-lg border border-[#d7c6a3]/45 bg-[#fbf7ef] shadow-[0_24px_80px_rgba(28,32,24,0.24)] sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-[#d7c6a3]/35 px-5 py-4">
          <div>
            <p className="text-base font-bold text-[#1c2018]">Edit profile</p>
            <p className="mt-1 text-sm text-[#7c7468]">Update your public community identity.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-[#8a7c65] transition hover:bg-[#ede5d4] hover:text-[#1c2018]"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 px-5 py-5">
          <ProfileField label="Display name" error={errors.display_name?.message}>
            <input
              {...register("display_name")}
              type="text"
              placeholder={user.username}
              maxLength={100}
              className={fieldClassName}
            />
          </ProfileField>

          <ProfileField label="Bio" error={errors.bio?.message}>
            <textarea
              {...register("bio")}
              placeholder="Tell others about yourself..."
              maxLength={300}
              rows={4}
              className={`${fieldClassName} resize-none`}
            />
          </ProfileField>

          <ProfileField label="Avatar URL" error={errors.avatar_url?.message}>
            <input
              {...register("avatar_url")}
              type="url"
              placeholder="https://..."
              className={fieldClassName}
            />
          </ProfileField>

          {submitStatus === "error" && (
            <p className="text-sm font-semibold text-rose-600">Failed to save. Try again.</p>
          )}

          <div className="flex justify-end gap-2 border-t border-[#d7c6a3]/35 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-md px-4 text-sm font-semibold text-[#6b6252] transition hover:bg-[#ede5d4] hover:text-[#1c2018]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitStatus === "saving"}
              className="h-10 rounded-md bg-[#1c2018] px-4 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343a2e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitStatus === "saving" ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const fieldClassName =
  "w-full rounded-md border border-[#d7c6a3]/55 bg-white px-3 py-2 text-sm text-[#1c2018] placeholder:text-[#a99b82] focus:border-[#d8bd75]/70 focus:outline-none";

function ProfileField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a7c65]">
        {label}
      </span>
      {children}
      {error ? <span className="text-xs font-semibold text-rose-600">{error}</span> : null}
    </label>
  );
}

function ProfileSkeleton() {
  return (
    <main className="min-h-screen bg-[#f4efe6] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className="animate-pulse overflow-hidden rounded-lg border border-[#d7c6a3]/45 bg-[#fbf7ef]">
          <div className="h-24 bg-[#171b17]" />
          <div className="px-5 pb-5">
            <div className="-mt-12 h-24 w-24 rounded-lg border-4 border-[#fbf7ef] bg-[#e8dfc8]" />
            <div className="mt-5 h-6 w-44 rounded bg-[#e8dfc8]" />
            <div className="mt-3 h-3 w-28 rounded bg-[#e8dfc8]" />
            <div className="mt-5 grid gap-2">
              <div className="h-16 rounded-md bg-[#e8dfc8]" />
              <div className="h-16 rounded-md bg-[#e8dfc8]" />
            </div>
          </div>
        </section>

        <section className="animate-pulse rounded-lg border border-[#d7c6a3]/45 bg-[#fbf7ef]">
          <div className="border-b border-[#d7c6a3]/35 px-5 py-4">
            <div className="h-4 w-24 rounded bg-[#e8dfc8]" />
            <div className="mt-2 h-6 w-32 rounded bg-[#e8dfc8]" />
          </div>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="border-b border-[#d7c6a3]/30 px-4 py-4">
              <div className="mb-3 h-9 w-40 rounded bg-[#e8dfc8]" />
              <div className="h-3 w-full rounded bg-[#e8dfc8]" />
              <div className="mt-2 h-3 w-2/3 rounded bg-[#e8dfc8]" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function PanelIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {collapsed ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="m14 9 3 3-3 3" />
        </>
      ) : (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="m16 15-3-3 3-3" />
        </>
      )}
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function formatMonthYear(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts.map((part) => part[0]?.toUpperCase()).join("");
}
