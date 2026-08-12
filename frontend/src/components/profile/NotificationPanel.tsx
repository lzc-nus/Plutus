"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  getNotifications, 
  markAllRead, 
  markOneRead 
} from "@/lib/api/notifications";
import { NotificationRead } from "@/lib/api/generated";
import { getUserById } from "@/lib/api/users";

interface NotificationPanelProps {
  onClose: () => void;
  onAllRead: () => void;
}

const NOTIFICATION_LABEL: Record<string, string> = {
  like_post: "liked your post",
  like_comment: "liked your comment",
  comment: "commented on your post",
  follow: "followed you",
  repost: "reposted your post",
};

type Notification = Omit<NotificationRead, "actor_id"> & { 
  actor_id: string | null;
}

export function NotificationPanel({ onClose, onAllRead }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    getNotifications(30)
      .then(response => {
        setNotifications((response.data ?? []) as Notification[]);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  async function handleMarkAllRead() {
    try { 
      await markAllRead(); 
      
      setNotifications(current => 
        current.map(notification => ({ 
          ...notification, 
          read: true, 
        })), 
      ); 
      
      onAllRead(); 
    } catch { 
      // leave the notifications unchanged if request fail 
    }
  }

  async function handleMarkOneRead(id: string) {
    try { 
      await markOneRead(id); 
      
      setNotifications(current => 
        current.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification, 
        ), 
      ); 
    } catch { 
      // notification can still open if marking it read fails 
    }
  }

  const unreadCount = notifications.filter(
    notification => !notification.read
  ).length;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[#d7c6a3]/40 bg-[#fbf7ef] shadow-[0_24px_64px_rgba(28,32,24,0.14)]">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#d7c6a3]/30 px-4 py-3">
        <span className="text-sm font-bold text-[#1c2018]">
          Notifications

          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-[#d8bd75] px-1.5 py-0.5 text-[10px] font-bold text-[#1c2018]">
              {unreadCount}
            </span>
          )}
        </span>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-[#a99b82] transition-colors hover:text-[#1c2018]"
            >
              Mark all read
            </button>
          )}

          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-[#a99b82] transition-colors hover:bg-[#ede5d4] hover:text-[#1c2018]"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[420px] overflow-y-auto">
        {status === "loading" && (
          <div className="flex flex-col divide-y divide-[#d7c6a3]/20">
            {Array.from({ length: 4 }).map((_, index) => (
              <NotificationSkeleton key={index} />
            ))}
          </div>
        )}

        {status === "error" && (
          <p className="px-4 py-8 text-center text-sm text-[#a99b82]">
            Failed to load notifications.
          </p>
        )}

        {status === "ready" && notifications.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-[#a99b82]">
            No notifications yet.
          </p>
        )}

        {status === "ready" && notifications.length > 0 && (
          <div className="flex flex-col divide-y divide-[#d7c6a3]/20">
            {notifications.map(notification => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onRead={() => handleMarkOneRead(notification.id)}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationRow({
  notification,
  onRead,
  onClose,
}: {
  notification: Omit<NotificationRead, "actor_id"> & { actor_id: string | null };
  onRead: () => void;
  onClose: () => void;
}) {
  const label = NOTIFICATION_LABEL[notification.type] ?? notification.type;
  const href = notification.post_id
    ? `/community/posts/${notification.post_id}`
    : `/profile/${notification.actor_id}`;

  function handleClick() {
    if (!notification.read) {
      onRead();
    }

    onClose();
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={[
        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#f0e8d8]",
        notification.read ? "opacity-60" : "",
      ].join(" ")}
    >

      {/* Unread dot */}
      <span className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center">
        {!notification.read && (
          <span className="h-2 w-2 rounded-full bg-[#d8bd75]" />
        )}
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-[#1c2018]">
          <span className="font-semibold">
            {notification.actor_id 
              ? <ActorName actorId={notification.actor_id} /> 
              : "Deleted Account"}
          </span>{" "}

          <span className="text-[#6b6252]">
            {label}
          </span>
        </p>

        <p className="mt-0.5 text-xs text-[#a99b82]">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>
    </Link>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex animate-pulse items-start gap-3 px-4 py-3">
      <div className="mt-1.5 h-2 w-2 rounded-full bg-[#e8dfc8]" />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-3 w-48 rounded bg-[#e8dfc8]" />
        <div className="h-2.5 w-16 rounded bg-[#e8dfc8]" />
      </div>
    </div>
  );
}

// ICON

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// HELPERS

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();

  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d`;
  }
  
  return new Date(iso).toLocaleDateString(undefined, { 
    month: "short", 
    day: "numeric" 
  });
}

function ActorName({ actorId }: { actorId: string }) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    getUserById(actorId)
      .then(response => {
        const user = response.data;
        
        if (!user) {
          return;
        }
        
        setName(user.display_name ?? user.username);
      })
      .catch(() => {});
  }, [actorId]);

  if (!name) {
    return <span className="inline-block h-3 w-20 animate-pulse rounded bg-[#e8dfc8]" />;
  }

  return <>{name}</>;
}