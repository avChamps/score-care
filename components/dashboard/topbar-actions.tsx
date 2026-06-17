"use client";

import {
  AlertTriangle,
  Bell,
  Bot,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  Headphones,
  Send,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiFetch, apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { getCachedCibilDisplayData, getStoredLatestCibilScoreCheckData } from "@/lib/cibil-display-cache";
import { useSubscriptionAccess } from "@/lib/subscription-access";
import { cn } from "@/lib/utils";

type Drawer = "notifications" | "support" | null;
type NotificationTone = "amber" | "cyan" | "rose" | "slate";
type NotificationApiItem = {
  createdAt?: string | null;
  data?: Record<string, unknown> | null;
  id: string | number;
  isRead?: boolean | null;
  message?: string | null;
  readAt?: string | null;
  title?: string | null;
  type?: string | null;
};
type AssistantMessage = {
  id: string;
  body: string;
  role: "assistant" | "user";
};
type AssistantDisplayData = {
  cibilScore?: string | number | null;
  credit_score?: string | number | null;
  score?: string | number | null;
  data?: {
    cibilScore?: string | number | null;
    credit_report?: {
      SCORE?: {
        FCIREXScore?: string | number | null;
      } | null;
    } | null;
    credit_score?: string | number | null;
    display?: {
      profile?: {
        name?: string | null;
      };
      score?: {
        factors?: string[] | null;
        range?: string | null;
        value?: string | number | null;
      };
      accounts?: Array<{
        account_closed?: string | null;
        amount_overdue?: string | number | null;
        current_balance?: string | number | null;
        high_credit_amount?: string | number | null;
        type?: string | null;
      }> | null;
      enquiries?: unknown[] | null;
    };
    report?: {
      cibilScore?: string | number | null;
      credit_score?: string | number | null;
      score?: string | number | null;
    } | null;
    score?: string | number | null;
  };
};

const quickActions = [
  { label: "Check score", Icon: CreditCard },
  { label: "Download Report", Icon: FileText },
  { label: "Raise issue", Icon: ShieldCheck },
];
const assistantContextCacheKey = "scorecare_assistant_context";
const assistantMessagesCacheKey = "scorecare_assistant_messages";
const notificationsPageSize = 10;
const defaultAssistantMessages: AssistantMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    body: "Hello! I am your CIBIL assistant. Ask me about checking your score, downloading reports, or resolving issues.",
  },
];

export function TopBarActions() {
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  const loadNotificationCount = useCallback(async () => {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      return;
    }

    try {
      const response = await apiRequest(`/notifications?limit=${notificationsPageSize}&unreadOnly=false`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const result = (await response.json()) as {
        data?: {
          unreadCount?: number | null;
        };
        status?: string;
      };

      if (result.status === "success") {
        setNotificationCount(result.data?.unreadCount ?? 0);
      }
    } catch {
      setNotificationCount(0);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadNotificationCount();
    }, 0);
    const handleNotificationsUpdated = () => {
      void loadNotificationCount();
    };

    window.addEventListener("scorecare:notifications-updated", handleNotificationsUpdated);
    return () => {
      window.clearTimeout(loadTimer);
      window.removeEventListener("scorecare:notifications-updated", handleNotificationsUpdated);
    };
  }, [loadNotificationCount]);

  return (
    <>
      <div className="flex gap-2">
        <IconButton data-dashboard-support="true" label="Support" onClick={() => setDrawer("support")}>
          <Headphones className="size-5" />
        </IconButton>
        <IconButton badgeCount={notificationCount} data-dashboard-notifications="true" label="Notifications" onClick={() => setDrawer("notifications")}>
          <Bell className="size-5" />
        </IconButton>
      </div>

      {drawer && typeof document !== "undefined"
        ? createPortal(
        <div className="portal-theme fixed inset-0 z-[100] bg-[rgba(23,32,51,0.42)] backdrop-blur-sm animate-[creditPanelIn_0.2s_ease-out]" onClick={() => setDrawer(null)}>
          <aside
            className="ml-auto flex h-dvh w-full max-w-md flex-col border-l border-[var(--portal-border)] bg-[var(--portal-bg)] shadow-[0_8px_24px_rgba(23,32,51,0.16)]"
            onClick={(event) => event.stopPropagation()}
          >
            {drawer === "notifications" ? <NotificationsDrawer onClose={() => setDrawer(null)} onUnreadCountChange={setNotificationCount} /> : null}
            {drawer === "support" ? <SupportDrawer onClose={() => setDrawer(null)} /> : null}
          </aside>
        </div>,
        document.body,
      )
        : null}
    </>
  );
}

function IconButton({
  badgeCount = 0,
  children,
  disabled = false,
  label,
  onClick,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & { badgeCount?: number; children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      {...props}
      aria-label={label}
      aria-disabled={disabled}
      className={cn(
        "relative grid size-9 place-items-center rounded-full border border-[var(--portal-border)] bg-white text-[var(--portal-muted)] shadow-sm transition hover:border-[var(--portal-blue)] hover:bg-[var(--portal-blue-soft)] hover:text-[var(--portal-blue)] sm:size-10",
        disabled && "cursor-not-allowed opacity-45 hover:border-[var(--portal-border)] hover:bg-white hover:text-[var(--portal-muted)]",
      )}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
      {badgeCount > 0 ? (
        <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-caption font-black leading-4 text-white ring-2 ring-white">
          {badgeCount > 99 ? "99+" : badgeCount}
        </span>
      ) : null}
    </button>
  );
}

function DrawerHeader({ eyebrow, icon, iconTone = "blue", onClose, title }: { eyebrow: string; icon: React.ReactNode; iconTone?: "blue" | "orange"; onClose: () => void; title: string }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--portal-border)] bg-white/80 px-4 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className={cn("grid size-10 place-items-center rounded-2xl", iconTone === "orange" ? "bg-[var(--portal-orange-soft)] text-[var(--portal-orange)]" : "bg-[var(--portal-blue-soft)] text-[var(--portal-blue)]")}>{icon}</span>
        <div>
          <p className="text-caption font-bold uppercase tracking-[0.12em] text-[var(--portal-orange)]">{eyebrow}</p>
          <h2 className="mt-0.5 text-base font-extrabold text-[var(--portal-ink)]">{title}</h2>
        </div>
      </div>
      <button aria-label="Close drawer" className="grid size-8 place-items-center rounded-full border border-[var(--portal-border)] bg-white text-[var(--portal-muted)] transition hover:bg-[var(--portal-orange-soft)] hover:text-[var(--portal-orange)]" type="button" onClick={onClose}>
        <X className="size-4" />
      </button>
    </div>
  );
}

function NotificationsDrawer({ onClose, onUnreadCountChange }: { onClose: () => void; onUnreadCountChange: (count: number) => void }) {
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingIds, setMarkingIds] = useState<Array<string | number>>([]);
  const [notifications, setNotifications] = useState<NotificationApiItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async ({ append = false, offset = 0 } = {}) => {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      setError("Please login again to view notifications.");
      setLoading(false);
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await apiRequest(`/notifications?limit=${notificationsPageSize}&offset=${offset}&unreadOnly=false`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = (await response.json()) as {
        data?: {
          notifications?: NotificationApiItem[] | null;
          unreadCount?: number | null;
        };
        message?: string;
        status?: string;
      };

      if (response.status === 401 || response.status === 403) {
        clearScorecareSession();
        setError("Please login again to view notifications.");
        return;
      }

      if (!response.ok || result.status === "error") {
        throw new Error(result.message || "Unable to load notifications.");
      }

      const nextNotifications = result.data?.notifications ?? [];
      setNotifications((current) => (append ? [...current, ...nextNotifications] : nextNotifications));
      setHasMore(nextNotifications.length === notificationsPageSize);
      setUnreadCount(result.data?.unreadCount ?? 0);
      onUnreadCountChange(result.data?.unreadCount ?? 0);
    } catch (loadError) {
      if (!append) {
        setNotifications([]);
        setUnreadCount(0);
        onUnreadCountChange(0);
      }
      setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [onUnreadCountChange]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [loadNotifications]);

  function handleNotificationsScroll(event: React.UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 96;

    if (!nearBottom || loading || loadingMore || !hasMore || !notifications.length) {
      return;
    }

    void loadNotifications({
      append: true,
      offset: notifications.length,
    });
  }

  async function markNotificationRead(notification: NotificationApiItem) {
    if (notification.isRead) return;

    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      setError("Please login again to update notifications.");
      return;
    }

    setMarkingIds((current) => [...current, notification.id]);
    setError("");

    try {
      const response = await apiRequest(`/notifications/${notification.id}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to mark notification read.");
      }

      const nextUnreadCount = Math.max(0, unreadCount - 1);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : item,
        ),
      );
      setUnreadCount(nextUnreadCount);
      onUnreadCountChange(nextUnreadCount);
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Unable to mark notification read.");
    } finally {
      setMarkingIds((current) => current.filter((id) => id !== notification.id));
    }
  }

  async function markAllNotificationsRead() {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      setError("Please login again to update notifications.");
      return;
    }

    setMarkingAll(true);
    setError("");

    try {
      const response = await apiRequest("/notifications/read-all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Unable to mark all notifications read.");
      }

      const readAt = new Date().toISOString();

      setNotifications((current) => current.map((item) => ({ ...item, isRead: true, readAt })));
      setUnreadCount(0);
      onUnreadCountChange(0);
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "Unable to mark all notifications read.");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <>
      <DrawerHeader eyebrow="Alerts center" icon={<Bell className="size-5" />} onClose={onClose} title="Notifications" />
      <div className="drawer-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5" onScroll={handleNotificationsScroll}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-[var(--portal-muted)]">{unreadCount} unread</p>
          <button
            className="rounded-full border border-[var(--portal-border)] bg-white px-3 py-1.5 text-caption font-black text-[var(--portal-muted)] shadow-sm transition hover:border-[var(--portal-blue)] hover:text-[var(--portal-blue)] disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={!unreadCount || markingAll}
            onClick={() => void markAllNotificationsRead()}
          >
            {markingAll ? "Updating..." : "Mark all read"}
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 p-3">
            <p className="text-xs font-bold leading-5 text-rose-700">{error}</p>
            <button className="mt-2 rounded-full bg-white px-3 py-1.5 text-caption font-black text-rose-700" type="button" onClick={() => void loadNotifications()}>
              Retry
            </button>
          </div>
        ) : null}

        <div className="grid gap-3">
          {loading ? (
            <NotificationLoadingCards />
          ) : notifications.length ? (
            notifications.map((item) => (
              <NotificationCard
                key={String(item.id)}
                item={item}
                marking={markingIds.includes(item.id)}
                onMarkRead={() => void markNotificationRead(item)}
              />
            ))
          ) : (
            <div className="rounded-[var(--portal-radius)] border border-[var(--portal-border)] bg-white p-5 text-center shadow-sm">
              <p className="text-sm font-black text-[var(--portal-ink)]">No notifications yet</p>
              <p className="mt-1 text-xs font-medium text-[var(--portal-muted)]">Loan and CIBIL updates will appear here.</p>
            </div>
          )}
          {loadingMore ? <NotificationLoadingCards count={1} /> : null}
          {!loading && notifications.length && !hasMore ? (
            <p className="py-2 text-center text-caption font-bold text-[var(--portal-muted)]/70">You are all caught up</p>
          ) : null}
        </div>
      </div>
    </>
  );
}

function NotificationCard({ item, marking, onMarkRead }: { item: NotificationApiItem; marking: boolean; onMarkRead: () => void }) {
  const { Icon, tone: presentationTone } = getNotificationPresentation(item.type);
  const tone = {
    amber: { rail: "border-l-[var(--portal-orange)]", icon: "bg-[var(--portal-orange-soft)] text-[var(--portal-orange)]" },
    cyan: { rail: "border-l-[var(--portal-blue)]", icon: "bg-[var(--portal-blue-soft)] text-[var(--portal-blue)]" },
    rose: { rail: "border-l-[#fb7185]", icon: "bg-rose-50 text-rose-600" },
    slate: { rail: "border-l-slate-200", icon: "bg-[var(--portal-surface-soft)] text-[var(--portal-muted)]" },
  }[presentationTone];

  return (
    <article className={cn("relative rounded-[var(--portal-radius)] border border-l-4 border-[var(--portal-border)] bg-white p-4 shadow-sm", tone.rail)}>
      {!item.isRead ? <span className="absolute right-4 top-4 size-2 rounded-full bg-rose-500" /> : null}
      <div className="flex gap-3 pr-4">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", tone.icon)}>
          <Icon className="size-4" strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <h4 className="text-caption font-black text-[var(--portal-ink)]">{item.title || "Notification"}</h4>
          <p className="mt-1 text-caption leading-4 text-[var(--portal-muted)]">{item.message || "You have a new update."}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-caption font-medium text-[var(--portal-muted)]/70">{formatNotificationTime(item.createdAt)}</p>
            {!item.isRead ? (
              <button
                className="rounded-full bg-[var(--portal-blue-soft)] px-2.5 py-1 text-caption font-black text-[var(--portal-blue)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                disabled={marking}
                onClick={onMarkRead}
              >
                {marking ? "Updating..." : "Mark read"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function NotificationLoadingCards({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, item) => (
        <div key={item} className="rounded-[var(--portal-radius)] border border-[var(--portal-border)] bg-white p-4 shadow-sm">
          <div className="flex gap-3">
            <span className="size-9 shrink-0 rounded-xl bg-slate-100 animate-pulse" />
            <div className="min-w-0 flex-1 space-y-2">
              <span className="block h-3 w-32 rounded-full bg-slate-100 animate-pulse" />
              <span className="block h-3 w-full rounded-full bg-slate-100 animate-pulse" />
              <span className="block h-3 w-20 rounded-full bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function getNotificationPresentation(type?: string | null): { Icon: typeof Bell; tone: NotificationTone } {
  if (type === "loan_applied") {
    return { Icon: CheckCircle2, tone: "cyan" };
  }

  if (type === "cibil_report_updated") {
    return { Icon: CreditCard, tone: "cyan" };
  }

  if (type?.includes("due") || type?.includes("reminder")) {
    return { Icon: CalendarClock, tone: "amber" };
  }

  if (type?.includes("alert") || type?.includes("overdue")) {
    return { Icon: AlertTriangle, tone: "rose" };
  }

  if (type?.includes("tip") || type?.includes("score")) {
    return { Icon: TrendingUp, tone: "slate" };
  }

  return { Icon: Bell, tone: "slate" };
}


function formatNotificationTime(value?: string | null) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  const diffMs = Date.now() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (diffMs < minute) return "Just now";

  if (diffMs < hour) {
    const mins = Math.floor(diffMs / minute);
    return `${mins} min${mins > 1 ? "s" : ""} ago`;
  }

  if (diffMs < day) {
    const hrs = Math.floor(diffMs / hour);
    return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  }

  if (diffMs < month) {
    const days = Math.floor(diffMs / day);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  if (diffMs < year) {
    const months = Math.floor(diffMs / month);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }

  const years = Math.floor(diffMs / year);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}


export function SupportDrawer({ onClose }: { onClose: () => void }) {
  const { isFreeTier } = useSubscriptionAccess();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>(() => readCachedAssistantMessages());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(assistantMessagesCacheKey, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (!isFreeTier) {
      return;
    }

    void Promise.resolve().then(() => {
      localStorage.removeItem(assistantContextCacheKey);
    });
  }, [isFreeTier]);

  async function sendAssistantMessage(message: string) {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    const userMessage: AssistantMessage = {
      id: crypto.randomUUID(),
      role: "user",
      body: trimmedMessage,
    };
    const assistantMessageId = crypto.randomUUID();

    setInput("");
    setLoading(true);
    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        body: "",
      },
    ]);

    try {
      const context = await loadAssistantContext(isFreeTier);
      const token = localStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) {
        clearScorecareSession();
        window.location.href = "/login";
        return;
      }

      localStorage.setItem(assistantContextCacheKey, context);

      const response = await apiFetch("/ai/gemini", {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: buildAssistantPrompt(trimmedMessage, context),
        }),
      });

      if (!response.ok) {
        throw new Error((await readAssistantError(response)) || "Unable to load assistant reply");
      }

      let reply = "";

      await readAssistantSse(response, (delta) => {
        reply += delta;
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  body: reply,
                }
              : message,
          ),
        );
      });

      if (!reply.trim()) {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  body: "I could not find a clear answer, but I can still help you review your credit profile step by step.",
                }
              : message,
          ),
        );
      }
    } catch {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                body: "I could not reach the AI assistant right now. Please try again in a moment.",
              }
            : message,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendAssistantMessage(input);
  }

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.08] bg-[#070B12] px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#5EF2C2]/15 text-[#5EF2C2]">
            <Bot className="size-5" />
          </span>
          <h2 className="text-base font-black tracking-[2px] bg-[linear-gradient(90deg,#5EF2C2,#2DB094)] bg-clip-text text-transparent">Score Care</h2>
        </div>
        <button aria-label="Close drawer" className="grid size-8 place-items-center rounded-full border border-white/[0.08] bg-[#111821] text-[#AAB6C8] transition hover:border-[#5EF2C2]/50 hover:text-[#5EF2C2]" type="button" onClick={onClose}>
          <X className="size-4" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col bg-[#050912]">
        <div className="drawer-scroll flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-4">
            {messages.map((message) => (
              <AssistantBubble key={message.id} message={message} />
            ))}
          </div>
        </div>

        <div className="border-t border-white/[0.08] bg-[#070B12] px-4 py-4 shadow-[0_-12px_28px_rgba(0,0,0,0.22)]">
          <div className="drawer-scroll mb-3 flex gap-2 overflow-x-auto pb-1">
            {quickActions.map(({ Icon, label }) => (
              <button
                key={label}
                className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-[#5EF2C2]/20 bg-[#5EF2C2]/10 px-3 text-caption font-semibold text-[#5EF2C2] shadow-sm transition hover:border-[#5EF2C2]/60 hover:bg-[#5EF2C2]/15 disabled:cursor-not-allowed disabled:opacity-55"
                type="button"
                disabled={loading}
                onClick={() => void sendAssistantMessage(label)}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
          <form className="flex items-center gap-3" onSubmit={handleSubmit}>
            <input
              className="h-11 min-w-0 flex-1 rounded-full border border-white/[0.08] bg-[#111821] px-4 text-body-sm font-medium text-white shadow-sm outline-none transition placeholder:text-[#AAB6C8]/60 focus:border-[#5EF2C2]/60 focus:ring-4 focus:ring-[#5EF2C2]/10 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Type a message..."
              value={input}
              disabled={loading}
              onChange={(event) => setInput(event.target.value)}
            />
            <button aria-label="Send message" className="grid size-11 shrink-0 place-items-center rounded-full bg-[#2DB094] text-white shadow-[0_12px_26px_rgba(45,176,148,0.24)] transition hover:bg-[#249a81] disabled:cursor-not-allowed disabled:opacity-55" type="submit" disabled={loading || !input.trim()}>
              <Send className="size-5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

function AssistantBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";
  const waitingForStream = !isUser && !message.body;

  return (
    <div className={cn("flex items-start gap-3", isUser && "justify-end")}>
      {!isUser ? (
        <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-[#5EF2C2]/15 text-[#5EF2C2]">
          <Bot className="size-5" />
        </span>
      ) : null}
      <div className={cn("max-w-[82%] rounded-[1.35rem] border px-4 py-3.5 shadow-sm", isUser ? "border-[#5EF2C2]/50 bg-[#2DB094] text-white" : "border-white/[0.08] bg-[#111821] text-[#AAB6C8]")}>
        {waitingForStream ? <AssistantTypingContent /> : <AssistantReplyContent body={message.body} isUser={isUser} />}
      </div>
    </div>
  );
}

function AssistantTypingContent() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-[#5EF2C2] animate-bounce" />
        <span className="size-2 rounded-full bg-[#5EF2C2] animate-bounce [animation-delay:120ms]" />
        <span className="size-2 rounded-full bg-[#5EF2C2] animate-bounce [animation-delay:240ms]" />
      </div>
      <p className="mt-3 text-caption font-medium text-[#AAB6C8]">Reading your credit context...</p>
    </div>
  );
}

function AssistantReplyContent({ body, isUser }: { body: string; isUser: boolean }) {
  const lines = formatAssistantReply(body);

  return (
    <div className="space-y-2">
      {lines.map((line, index) => (
        <p key={`${line}-${index}`} className={cn("text-caption font-medium leading-5", isUser ? "text-white" : "text-[#AAB6C8]")}>
          {line}
        </p>
      ))}
    </div>
  );
}

function buildAssistantPrompt(userMessage: string, context: string) {
  return [
    "You are Scorecare, the SCORECARE dashboard assistant.",
    "Answer the user's question using the available user credit context. Keep the answer short, clear, and practical.",
    "Do not use markdown symbols, tables, or long paragraphs.",
    "",
    `User question: ${userMessage}`,
    "",
    "Available context:",
    context,
  ].join("\n");
}

function readCachedAssistantMessages() {
  if (typeof localStorage === "undefined") {
    return defaultAssistantMessages;
  }

  try {
    const cachedMessages = JSON.parse(localStorage.getItem(assistantMessagesCacheKey) || "[]") as unknown;

    if (!Array.isArray(cachedMessages)) {
      return defaultAssistantMessages;
    }

    const messages = cachedMessages.filter((message): message is AssistantMessage => {
      if (!message || typeof message !== "object") {
        return false;
      }

      const candidate = message as Partial<AssistantMessage>;

      return typeof candidate.id === "string" && typeof candidate.body === "string" && (candidate.role === "assistant" || candidate.role === "user");
    });

    return messages.length ? messages : defaultAssistantMessages;
  } catch {
    return defaultAssistantMessages;
  }
}

async function loadAssistantContext(isFreeTier: boolean) {
  const token = localStorage.getItem("scorecare_token");
  const sessionContext = [
    `Name: ${localStorage.getItem("scorecare_full_name") || "Not available"}`,
    `Mobile: ${localStorage.getItem("scorecare_mobile_number") || "Not available"}`,
    `PAN available: ${localStorage.getItem("scorecare_pan_number") ? "Yes" : "No"}`,
  ];

  if (!token) {
    return sessionContext.join("\n");
  }

  try {
    const latestScoreCheck = getStoredLatestCibilScoreCheckData(token) as AssistantDisplayData | null;
    const result = latestScoreCheck ?? ((await getCachedCibilDisplayData(token)) as AssistantDisplayData);

    return [...sessionContext, buildAssistantCreditContext(result)].join("\n");
  } catch {
    if (!isFreeTier) {
      return sessionContext.join("\n");
    }

    const latestScoreCheck = getStoredLatestCibilScoreCheckData(token) as AssistantDisplayData | null;

    if (latestScoreCheck) {
      return [...sessionContext, buildAssistantCreditContext(latestScoreCheck)].join("\n");
    }

    return sessionContext.join("\n");
  }
}

function buildAssistantCreditContext(result: AssistantDisplayData) {
  const display = result.data?.display;
  const accounts = display?.accounts ?? [];
  const enquiries = display?.enquiries ?? [];
  const score = readAssistantScore(result);
  const activeAccounts = accounts.filter((account) => !account.account_closed).length;
  const overdueAccounts = accounts.filter((account) => readAssistantNumber(account.amount_overdue) > 0).length;
  const totalBalance = accounts.reduce((total, account) => total + readAssistantNumber(account.current_balance), 0);
  const totalLimit = accounts.reduce((total, account) => total + readAssistantNumber(account.high_credit_amount), 0);
  const utilization = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : null;

  return [
    `Credit score: ${score ?? "Not available"}`,
    `Score range: ${display?.score?.range || "300 to 900"}`,
    `Score factors: ${display?.score?.factors?.length ? display.score.factors.join(", ") : "Not available"}`,
    `Active accounts: ${activeAccounts}`,
    `Accounts with overdue amount: ${overdueAccounts}`,
    `Total balance: Rs. ${totalBalance}`,
    `Estimated utilization: ${utilization === null ? "Not available" : `${utilization}%`}`,
    `Recent enquiries: ${enquiries.length}`,
  ].join("\n");
}

function readAssistantScore(result: AssistantDisplayData) {
  for (const value of [
    result.data?.display?.score?.value,
    result.data?.report?.cibilScore,
    result.data?.report?.score,
    result.data?.credit_score,
    result.data?.report?.credit_score,
    result.data?.credit_report?.SCORE?.FCIREXScore,
    result.data?.cibilScore,
    result.data?.score,
    result.cibilScore,
    result.score,
    result.credit_score,
  ]) {
    const score = readAssistantNumber(value);

    if (score > 0) {
      return score;
    }
  }

  return null;
}

function readAssistantReply(result: unknown): string {
  if (typeof result === "string") {
    return result.trim();
  }

  if (!result || typeof result !== "object") {
    return "";
  }

  const data = result as {
    answer?: unknown;
    content?: unknown;
    data?: unknown;
    message?: unknown;
    reply?: unknown;
    response?: unknown;
    text?: unknown;
  };

  for (const value of [data.answer, data.reply, data.response, data.message, data.text, data.content]) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return readAssistantReply(data.data);
}

async function readAssistantError(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return readAssistantReply(await response.json());
  }

  return response.text();
}

async function readAssistantSse(response: Response, onDelta: (delta: string) => void) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    onDelta(readAssistantReply(await response.json()));
    return;
  }

  if (!contentType.includes("text/event-stream") && !response.body) {
    onDelta(await response.text());
    return;
  }

  if (!response.body) {
    onDelta(await response.text());
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const events = buffer.split(/\r?\n\r?\n/);

    buffer = events.pop() ?? "";

    for (const event of events) {
      const delta = readAssistantSseDelta(event);

      if (delta) {
        onDelta(delta);
      }
    }

    if (done) {
      break;
    }
  }

  const delta = readAssistantSseDelta(buffer);

  if (delta) {
    onDelta(delta);
  }
}

function readAssistantSseDelta(event: string) {
  const data = event
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.replace(/^data:\s?/, ""))
    .join("\n")
    .trim();

  if (!data || data === "[DONE]") {
    return "";
  }

  try {
    const parsed = JSON.parse(data) as unknown;

    return readAssistantDelta(parsed) || readAssistantReply(parsed);
  } catch {
    return data;
  }
}

function readAssistantDelta(result: unknown): string {
  if (!result || typeof result !== "object") {
    return "";
  }

  const data = result as {
    choices?: Array<{
      delta?: {
        content?: unknown;
      };
    }>;
    data?: unknown;
    delta?: unknown;
    token?: unknown;
  };
  const delta = data.choices?.[0]?.delta?.content ?? data.delta ?? data.token;

  if (typeof delta === "string" && delta) {
    return delta;
  }

  return readAssistantDelta(data.data);
}

function formatAssistantReply(value: string) {
  return value
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^#{1,6}\s*/, "")
        .replace(/^[-*]\s+/, "")
        .replace(/^\d+[.)]\s*/, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .trim(),
    )
    .filter(Boolean);
}

function readAssistantNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);

  return Number.isFinite(number) ? number : 0;
}
