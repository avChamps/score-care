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
        <IconButton label="Support" onClick={() => setDrawer("support")}>
          <Headphones className="size-5" />
        </IconButton>
        <IconButton label="Notifications" onClick={() => setDrawer("notifications")}>
          <Bell className="size-5" />
        </IconButton>
      </div>

      {drawer && typeof document !== "undefined"
        ? createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-950/35 backdrop-blur-sm animate-[creditPanelIn_0.2s_ease-out]" onClick={() => setDrawer(null)}>
          <aside
            className="ml-auto flex h-dvh w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
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

function IconButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700 hover:shadow-md sm:size-10"
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function DrawerHeader({ eyebrow, icon, onClose, title }: { eyebrow: string; icon: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 py-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700">{icon}</span>
        <div>
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-cyan-600">{eyebrow}</p>
          <h2 className="mt-0.5 text-sm font-bold text-slate-950">{title}</h2>
        </div>
      </div>
      <button aria-label="Close drawer" className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900" type="button" onClick={onClose}>
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
              <h3 className="text-xs font-bold text-slate-950">{group.title}</h3>
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
    amber: { rail: "border-l-amber-400", icon: "bg-amber-50 text-amber-600" },
    cyan: { rail: "border-l-cyan-500", icon: "bg-cyan-50 text-cyan-700" },
    rose: { rail: "border-l-rose-400", icon: "bg-rose-50 text-rose-600" },
    slate: { rail: "border-l-slate-200", icon: "bg-slate-50 text-slate-500" },
  }[item.tone];

  return (
    <article className={cn("relative rounded-2xl border border-l-4 border-slate-200 bg-white p-4 shadow-sm", tone.rail)}>
      {item.unread ? <span className="absolute right-4 top-4 size-2 rounded-full bg-rose-500" /> : null}
      <div className="flex gap-3 pr-4">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", tone.icon)}>
          <item.Icon className="size-4" strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <h4 className="text-[0.72rem] font-bold text-slate-950">{item.title}</h4>
          <p className="mt-1 text-[0.68rem] leading-4 text-slate-600">{item.body}</p>
          <p className="mt-2 text-[0.62rem] font-medium text-slate-400">{item.time}</p>
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
            <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-cyan-50 text-cyan-700">
              <Bot className="size-5" />
            </span>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_42px_rgba(15,23,42,0.07)]">
              <p className="text-[0.72rem] leading-5 text-slate-700">
                Hello! I&apos;m your CIBIL assistant. Ask me about checking your score, downloading reports, or resolving issues.
              </p>
              <p className="mt-3 text-[0.62rem] font-medium text-slate-400">09:24</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {quickActions.map(({ Icon, label }) => (
              <button key={label} className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-[0.68rem] font-bold text-slate-600 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700" type="button">
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input className="h-10 min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 text-[0.72rem] font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" placeholder="Type a message..." />
            <button aria-label="Send message" className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cyan-600 text-white shadow-[0_12px_30px_rgba(6,182,212,0.22)] transition hover:bg-cyan-700" type="button">
              <Send className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
