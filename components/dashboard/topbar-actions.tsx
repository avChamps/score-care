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
import type { ComponentType } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { dashboardActionsDisabled } from "@/lib/dashboard-lock";
import { cn } from "@/lib/utils";

type Drawer = "notifications" | "support" | null;
type NotificationTone = "amber" | "cyan" | "rose" | "slate";
type NotificationItem = {
  title: string;
  body: string;
  time: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: NotificationTone;
  unread?: boolean;
};

const notificationGroups: Array<{ title: string; items: NotificationItem[] }> = [
  {
    title: "Now",
    items: [
      {
        title: "CIBIL Score updated",
        body: "Your CIBIL score has been refreshed. Check your latest score now.",
        time: "2 hours ago",
        Icon: CreditCard,
        tone: "cyan",
        unread: true,
      },
      {
        title: "EMI Due Reminder",
        body: "Your EMI of Rs.15,000 for HDFC personal loan is due in 3 days.",
        time: "2 hours ago",
        Icon: CalendarClock,
        tone: "amber",
        unread: true,
      },
      {
        title: "High credit utilization",
        body: "Your credit utilization is above 70%. Consider paying down balances.",
        time: "2 hours ago",
        Icon: AlertTriangle,
        tone: "rose",
        unread: true,
      },
    ],
  },
  {
    title: "Earlier",
    items: [
      {
        title: "Loan Application Approved",
        body: "Congratulations! Your loan application has been approved.",
        time: "1 day ago",
        Icon: CheckCircle2,
        tone: "slate",
      },
      {
        title: "Subscription Expiring Soon",
        body: "Your premium plan expires in 7 days. Renew to continue access.",
        time: "2 days ago",
        Icon: CalendarClock,
        tone: "slate",
      },
      {
        title: "Score Improvement Tip",
        body: "Pay your credit card bill before the due date to support your profile.",
        time: "4 days ago",
        Icon: TrendingUp,
        tone: "slate",
      },
    ],
  },
];

const quickActions = [
  { label: "Check score", Icon: CreditCard },
  { label: "Download Report", Icon: FileText },
  { label: "Raise issue", Icon: ShieldCheck },
];

export function TopBarActions() {
  const [drawer, setDrawer] = useState<Drawer>(null);

  return (
    <>
      <div className="flex gap-2">
        <IconButton disabled={dashboardActionsDisabled} label="Support" onClick={() => setDrawer("support")}>
          <Headphones className="size-5" />
        </IconButton>
        <IconButton disabled={dashboardActionsDisabled} label="Notifications" onClick={() => setDrawer("notifications")}>
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
            {drawer === "notifications" ? <NotificationsDrawer onClose={() => setDrawer(null)} /> : null}
            {drawer === "support" ? <SupportDrawer onClose={() => setDrawer(null)} /> : null}
          </aside>
        </div>,
        document.body,
      )
        : null}
    </>
  );
}

function IconButton({ children, disabled = false, label, onClick }: { children: React.ReactNode; disabled?: boolean; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      aria-disabled={disabled}
      className={cn(
        "grid size-9 place-items-center rounded-full border border-[var(--portal-border)] bg-white text-[var(--portal-muted)] shadow-sm transition hover:border-[var(--portal-blue)] hover:bg-[var(--portal-blue-soft)] hover:text-[var(--portal-blue)] sm:size-10",
        disabled && "cursor-not-allowed opacity-45 hover:border-[var(--portal-border)] hover:bg-white hover:text-[var(--portal-muted)]",
      )}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function DrawerHeader({ eyebrow, icon, onClose, title }: { eyebrow: string; icon: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--portal-border)] bg-white/80 px-4 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-[var(--portal-blue-soft)] text-[var(--portal-blue)]">{icon}</span>
        <div>
          <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-[var(--portal-orange)]">{eyebrow}</p>
          <h2 className="mt-0.5 text-sm font-black text-[var(--portal-ink)]">{title}</h2>
        </div>
      </div>
      <button aria-label="Close drawer" className="grid size-8 place-items-center rounded-full border border-[var(--portal-border)] bg-white text-[var(--portal-muted)] transition hover:bg-[var(--portal-orange-soft)] hover:text-[var(--portal-orange)]" type="button" onClick={onClose}>
        <X className="size-4" />
      </button>
    </div>
  );
}

function NotificationsDrawer({ onClose }: { onClose: () => void }) {
  return (
    <>
      <DrawerHeader eyebrow="Alerts center" icon={<Bell className="size-5" />} onClose={onClose} title="Notifications" />
      <div className="drawer-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-6">
          {notificationGroups.map((group) => (
            <section key={group.title}>
              <h3 className="text-xs font-black text-[var(--portal-ink)]">{group.title}</h3>
              <div className="mt-3 grid gap-3">
                {group.items.map((item) => (
                  <NotificationCard key={item.title} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

function NotificationCard({ item }: { item: (typeof notificationGroups)[number]["items"][number] }) {
  const tone = {
    amber: { rail: "border-l-[var(--portal-orange)]", icon: "bg-[var(--portal-orange-soft)] text-[var(--portal-orange)]" },
    cyan: { rail: "border-l-[var(--portal-blue)]", icon: "bg-[var(--portal-blue-soft)] text-[var(--portal-blue)]" },
    rose: { rail: "border-l-[#fb7185]", icon: "bg-rose-50 text-rose-600" },
    slate: { rail: "border-l-slate-200", icon: "bg-[var(--portal-surface-soft)] text-[var(--portal-muted)]" },
  }[item.tone];

  return (
    <article className={cn("relative rounded-[var(--portal-radius)] border border-l-4 border-[var(--portal-border)] bg-white p-4 shadow-sm", tone.rail)}>
      {item.unread ? <span className="absolute right-4 top-4 size-2 rounded-full bg-rose-500" /> : null}
      <div className="flex gap-3 pr-4">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", tone.icon)}>
          <item.Icon className="size-4" strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <h4 className="text-[0.72rem] font-black text-[var(--portal-ink)]">{item.title}</h4>
          <p className="mt-1 text-[0.68rem] leading-4 text-[var(--portal-muted)]">{item.body}</p>
          <p className="mt-2 text-[0.62rem] font-medium text-[var(--portal-muted)]/70">{item.time}</p>
        </div>
      </div>
    </article>
  );
}

function SupportDrawer({ onClose }: { onClose: () => void }) {
  return (
    <>
      <DrawerHeader eyebrow="Assistant" icon={<Bot className="size-5" />} onClose={onClose} title="Credit Mitra" />
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="drawer-scroll flex-1 overflow-y-auto px-4 py-5">
          <div className="flex items-start gap-3">
            <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-[var(--portal-blue-soft)] text-[var(--portal-blue)]">
              <Bot className="size-5" />
            </span>
            <div className="rounded-2xl border border-[var(--portal-border)] bg-white p-4">
              <p className="text-[0.72rem] leading-5 text-[var(--portal-muted)]">
                Hello! I&apos;m your CIBIL assistant. Ask me about checking your score, downloading reports, or resolving issues.
              </p>
              <p className="mt-3 text-[0.62rem] font-medium text-[var(--portal-muted)]/70">09:24</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--portal-border)] bg-white/85 px-4 py-4 backdrop-blur">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {quickActions.map(({ Icon, label }) => (
              <button key={label} className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-[var(--portal-border)] bg-white px-3 text-[0.68rem] font-black text-[var(--portal-muted)] shadow-sm transition hover:border-[var(--portal-blue)] hover:text-[var(--portal-blue)]" type="button">
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input className="h-10 min-w-0 flex-1 rounded-full border border-[var(--portal-border)] bg-white px-4 text-[0.72rem] font-medium text-[var(--portal-ink)] shadow-sm outline-none transition placeholder:text-[var(--portal-muted)]/60 focus:border-[var(--portal-blue)] focus:ring-4 focus:ring-[rgba(5,132,254,0.14)]" placeholder="Type a message..." />
            <button aria-label="Send message" className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--portal-blue)] text-white shadow-[0_12px_30px_rgba(5,132,254,0.22)] transition hover:bg-[var(--portal-blue-deep)]" type="button">
              <Send className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
