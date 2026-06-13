"use client";

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
import { profileFormSchema, type ProfileFormInput } from "@/lib/validations/profile";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();

  const [currentUser, setCurrentUser] = useState<UserRead | null>(null);
  const [profile, setProfile] = useState<UserPublicRead | null>(null);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [editOpen, setEditOpen] = useState(false);

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
    </div>
  );
}

// ── EditProfileModal ──────────────────────────────────────────────────────────

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
          >
            <CloseIcon />
          </button>
        </div>

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
            <input
              {...register("display_name")}
              type="text"
              placeholder={user.username}
              maxLength={100}
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
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitStatus === "saving"}
              className={[
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                submitStatus !== "saving"
                  ? "bg-emerald-500 text-white hover:bg-emerald-400"
                  : "cursor-not-allowed bg-zinc-800 text-zinc-500",
              ].join(" ")}
            >
              {submitStatus === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}