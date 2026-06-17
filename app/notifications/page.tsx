"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { isTokenExpired } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

type NotificationItem = {
  createdAt?: string | null;
  id: string | number;
  isRead?: boolean | null;
  message?: string | null;
  readAt?: string | null;
  title?: string | null;
};

const notificationsPageSize = 10;

export default function NotificationsPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function loadNotifications() {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      window.location.replace("/login");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await apiRequest(`/notifications?limit=${notificationsPageSize}&unreadOnly=false`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Unable to load notifications.");

      const result = (await response.json()) as {
        data?: {
          notifications?: NotificationItem[] | null;
          unreadCount?: number | null;
        };
        status?: string;
      };

      setNotifications(result.status === "success" ? result.data?.notifications ?? [] : []);
      setUnreadCount(result.status === "success" ? result.data?.unreadCount ?? 0 : 0);
    } catch {
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      window.location.replace("/login");
      return;
    }

    setError("");
    setMarkingAll(true);

    try {
      const response = await apiRequest("/notifications/read-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Unable to mark all notifications read.");

      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true, readAt })));
      setUnreadCount(0);
      window.dispatchEvent(new Event("scorecare:notifications-updated"));
    } catch {
      setError("Unable to mark all notifications read.");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="min-h-dvh bg-white text-[#1F2937] [font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',system-ui,sans-serif]">
      <header className="sticky top-0 z-10 flex h-[calc(var(--native-status-offset,0px)+72px)] items-center gap-2 border-b border-black/10 bg-white px-5 pt-[var(--native-status-offset,0px)] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <Link className="grid size-6 place-items-center text-[#1F2937]" href="/dashboard" aria-label="Back">
          <ArrowLeft className="size-6" strokeWidth={2.2} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-medium text-[#1F2937]">Notifications</h1>
          <p className="mt-0.5 text-caption font-medium text-[#6F7B8E]">{unreadCount} unread</p>
        </div>
        <button
          className="rounded-full border border-black/10 px-3 py-1.5 text-caption font-semibold text-[#1F2937] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!unreadCount || markingAll}
          onClick={markAllRead}
        >
          {markingAll ? "Updating..." : "Read all"}
        </button>
      </header>

      <main>
        {loading ? (
          <NotificationSkeleton />
        ) : error ? (
          <p className="px-5 py-5 text-caption font-normal text-[#FF3B30]">{error}</p>
        ) : notifications.length ? (
          notifications.map((notification) => (
            <article key={notification.id} className={cn("border-b border-black/20 px-5 py-5", !notification.isRead && "bg-[#F2FFFA]")}>
              <h2 className="text-base font-medium leading-5 text-black">{notification.title || "Notification"}</h2>
              <p className="mt-2 text-base font-normal leading-4 text-black">{notification.message || "--"}</p>
              {notification.createdAt ? <p className="mt-5 text-right text-caption font-normal text-black">{formatNotificationRelativeTime(notification.createdAt)}</p> : null}
            </article>
          ))
        ) : (
          <p className="px-5 py-5 text-caption font-normal text-[#111827]">No notifications yet.</p>
        )}
      </main>
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, index) => (
        <article key={index} className="border-b border-black/10 px-5 py-5">
          <div className="h-3 w-2/5 animate-pulse rounded-full bg-black/10" />
          <div className="mt-3 space-y-2">
            <div className="h-2.5 w-full animate-pulse rounded-full bg-black/10" />
            <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-black/10" />
          </div>
          <div className="ml-auto mt-5 h-2.5 w-20 animate-pulse rounded-full bg-black/10" />
        </article>
      ))}
    </div>
  );
}

function formatNotificationRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}
