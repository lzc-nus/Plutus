"use client";

<<<<<<< HEAD
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { UserPublicRead, UserRead } from "@/lib/api/generated";
import { getMe, getUserById, updateMe } from "@/lib/api/users";
import { getGlobalFeed } from "@/lib/api/community";
import { PostFeed } from "@/components/dashboard/community/PostFeed";
import { FollowButton } from "@/components/dashboard/community/FollowButton";
import { getFollowers, getFollowing } from "@/lib/api/community";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
=======
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UserPublicRead, UserRead } from "@/lib/api/generated";
import { getFollowers, getFollowing, getUserPosts } from "@/lib/api/community";
import { getUserById, updateMe } from "@/lib/api/users";
import { AuthRequiredDialog } from "@/components/community/AuthRequiredDialog";
import { FollowButton } from "@/components/community/FollowButton";
import { PostFeed } from "@/components/community/PostFeed";
import { useOptionalViewer } from "@/lib/hooks/useOptionalViewer";
>>>>>>> 960af32b2963319ba21f279510541e91d5049988
import { profileFormSchema, type ProfileFormInput } from "@/lib/validations/profile";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
<<<<<<< HEAD

  const [currentUser, setCurrentUser] = useState<UserRead | null>(null);
=======
  const { viewer: currentUser, loading: viewerLoading } = useOptionalViewer();
>>>>>>> 960af32b2963319ba21f279510541e91d5049988
  const [profile, setProfile] = useState<UserPublicRead | null>(null);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [editOpen, setEditOpen] = useState(false);
<<<<<<< HEAD

  const isOwnProfile = currentUser?.id === userId;

  // ── Fetch profile data ──────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      getMe(),
      getUserById(userId),
      getFollowers(userId),
      getFollowing(userId),
    ])
      .then(([meRes, profileRes, followersRes, followingRes]) => {
        const me = meRes.data ?? null;
        const prof = profileRes.data ?? null;
        const followers = followersRes.data ?? [];
        const following = followingRes.data ?? [];

        setCurrentUser(me);
        setProfile(prof);
        setFollowerCount(followers.length);
        setFollowingCount(following.length);
        setIsFollowing(followers.some((f) => f.follower_id === me?.id));
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [userId]);

  // ── Post fetcher filtered to this user ──────────────────────────────────────
  // The global feed is used here with the userId context.
  // Replace with a dedicated user posts endpoint if you add one later.
  const fetcher = (before?: string) =>
    getGlobalFeed(20, before).then((res) => ({
      ...res,
      data: (res.data ?? []).filter((p) => p.author_id === userId),
    }));

  // ── Loading / error ─────────────────────────────────────────────────────────

  if (status === "loading") return <ProfileSkeleton />;

  if (status === "error" || !profile) {
    return (
      <div className="mx-auto min-h-screen max-w-xl border-x border-zinc-800 bg-zinc-950">
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="text-sm text-zinc-400">{"Profile couldn't be loaded."}</p>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto min-h-screen max-w-xl border-x border-zinc-800 bg-zinc-950">

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur">
        <h1 className="text-base font-semibold text-white">
          {profile.display_name ?? profile.username}
        </h1>
      </div>

      {/* Profile section */}
      <div className="border-b border-zinc-800 px-4 pb-5 pt-6">

        {/* Avatar + action button row */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-zinc-700 ring-2 ring-zinc-800">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name ?? profile.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-semibold uppercase text-zinc-400">
                {getInitials(profile.display_name ?? profile.username)}
              </span>
            )}
          </div>

          {isOwnProfile ? (
            <button
              onClick={() => setEditOpen(true)}
              className="rounded-full border border-zinc-600 px-4 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white"
            >
              Edit profile
            </button>
          ) : (
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

        {/* Display name + username */}
        <p className="text-base font-semibold text-white">
          {profile.display_name ?? profile.username}
        </p>
        {profile.display_name && (
          <p className="text-sm text-zinc-500">@{profile.username}</p>
        )}

        {/* Bio */}
        {profile.bio && (
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{profile.bio}</p>
        )}

        {/* Follower / following counts */}
        <div className="mt-3 flex gap-5 text-sm">
          <Link
            href={`/profile/${userId}/followers`}
            className="hover:underline"
          >
            <strong className="font-semibold text-white">
              {followerCount ?? "—"}
            </strong>{" "}
            <span className="text-zinc-500">
              {followerCount === 1 ? "follower" : "followers"}
            </span>
          </Link>
          <Link
            href={`/profile/${userId}/following`}
            className="hover:underline"
          >
            <strong className="font-semibold text-white">
              {followingCount ?? "—"}
            </strong>{" "}
            <span className="text-zinc-500">following</span>
          </Link>
        </div>
      </div>

      {/* Posts */}
      <PostFeed fetcher={fetcher} feedKey={`profile-${userId}`} />

      {/* Edit profile modal */}
=======
  const [authAction, setAuthAction] = useState<string | null>(null);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (viewerLoading) return;

    let cancelled = false;

    async function loadProfile() {
      setStatus("loading");
      try {
        const [profileResponse, followersResponse, followingResponse] = await Promise.all([
          getUserById(userId),
          getFollowers(userId),
          getFollowing(userId),
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

  const displayName = useMemo(
    () => profile?.display_name || profile?.username || "Profile",
    [profile],
  );

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
    <main className="min-h-screen bg-[#f4efe6] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1180px] gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="min-w-0">
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

                <div className="mt-5 grid grid-cols-2 gap-2">
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

          <PostFeed
            fetcher={fetcher}
            feedKey={`profile-${userId}-${currentUser?.id ?? "guest"}`}
            viewer={currentUser}
            onAuthRequired={setAuthAction}
            detailBasePath="/community/posts"
          />
        </section>
      </div>

>>>>>>> 960af32b2963319ba21f279510541e91d5049988
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
<<<<<<< HEAD
=======

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
>>>>>>> 960af32b2963319ba21f279510541e91d5049988
    </div>
  );
}

<<<<<<< HEAD
// ── EditProfileModal ──────────────────────────────────────────────────────────
=======
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
>>>>>>> 960af32b2963319ba21f279510541e91d5049988

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
<<<<<<< HEAD
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-full max-w-lg flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 sm:rounded-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <span className="text-sm font-medium text-white">Edit profile</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
=======
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
>>>>>>> 960af32b2963319ba21f279510541e91d5049988
          >
            <CloseIcon />
          </button>
        </div>

<<<<<<< HEAD
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 py-4">

          {/* Avatar URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">
              Avatar URL
            </label>
            <input
              {...register("avatar_url")}
              type="url"
              placeholder="https://..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
            {errors.avatar_url && (
              <p className="text-xs text-rose-400">{errors.avatar_url.message}</p>
            )}
          </div>

          {/* Display name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">
              Display name
            </label>
=======
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 px-5 py-5">
          <ProfileField label="Display name" error={errors.display_name?.message}>
>>>>>>> 960af32b2963319ba21f279510541e91d5049988
            <input
              {...register("display_name")}
              type="text"
              placeholder={user.username}
              maxLength={100}
<<<<<<< HEAD
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
            {errors.display_name && (
              <p className="text-xs text-rose-400">{errors.display_name.message}</p>
            )}
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Bio</label>
            <textarea
              {...register("bio")}
              placeholder="Tell others about yourself…"
              maxLength={300}
              rows={3}
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
            {errors.bio && (
              <p className="text-xs text-rose-400">{errors.bio.message}</p>
            )}
          </div>

          {/* Error */}
          {submitStatus === "error" && (
            <p className="text-xs text-rose-400">Failed to save. Try again.</p>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
=======
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
>>>>>>> 960af32b2963319ba21f279510541e91d5049988
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitStatus === "saving"}
<<<<<<< HEAD
              className={[
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                submitStatus !== "saving"
                  ? "bg-emerald-500 text-white hover:bg-emerald-400"
                  : "cursor-not-allowed bg-zinc-800 text-zinc-500",
              ].join(" ")}
            >
              {submitStatus === "saving" ? "Saving…" : "Save"}
=======
              className="h-10 rounded-md bg-[#1c2018] px-4 text-sm font-semibold text-[#fbf7ef] transition hover:bg-[#343a2e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitStatus === "saving" ? "Saving..." : "Save changes"}
>>>>>>> 960af32b2963319ba21f279510541e91d5049988
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

<<<<<<< HEAD
// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="mx-auto min-h-screen max-w-xl border-x border-zinc-800 bg-zinc-950">
      <div className="animate-pulse border-b border-zinc-800 px-4 pb-5 pt-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="h-16 w-16 rounded-full bg-zinc-800" />
          <div className="h-8 w-24 rounded-full bg-zinc-800" />
        </div>
        <div className="h-4 w-36 rounded bg-zinc-800" />
        <div className="mt-2 h-3 w-24 rounded bg-zinc-800" />
        <div className="mt-2 space-y-1.5">
          <div className="h-3 w-full rounded bg-zinc-800" />
          <div className="h-3 w-3/4 rounded bg-zinc-800" />
        </div>
        <div className="mt-3 flex gap-5">
          <div className="h-3 w-20 rounded bg-zinc-800" />
          <div className="h-3 w-20 rounded bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
=======
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
>>>>>>> 960af32b2963319ba21f279510541e91d5049988

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

<<<<<<< HEAD
// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
=======
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
>>>>>>> 960af32b2963319ba21f279510541e91d5049988
