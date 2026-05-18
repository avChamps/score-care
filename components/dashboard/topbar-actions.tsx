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
        <div className="fixed inset-0 z-[100] bg-[#2d2119]/35 backdrop-blur-sm animate-[creditPanelIn_0.2s_ease-out]" onClick={() => setDrawer(null)}>
          <aside
            className="ml-auto flex h-dvh w-full max-w-md flex-col border-l border-[#6f5948]/12 bg-[#fff7e8] shadow-[0_24px_70px_rgba(92,62,37,0.22)]"
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
      className="grid size-9 place-items-center rounded-full border border-[#6f5948]/15 bg-[#fffdf7] text-[#6f5948] shadow-sm transition hover:-translate-y-0.5 hover:border-[#1f8a5b]/35 hover:text-[#1f8a5b] hover:shadow-md sm:size-10"
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function DrawerHeader({ eyebrow, icon, onClose, title }: { eyebrow: string; icon: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#6f5948]/12 px-4 py-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-[#8bd8b6]/22 text-[#1f8a5b]">{icon}</span>
        <div>
          <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-[#1f8a5b]">{eyebrow}</p>
          <h2 className="mt-0.5 text-sm font-black text-[#2d2119]">{title}</h2>
        </div>
      </div>
      <button aria-label="Close drawer" className="grid size-8 place-items-center rounded-full bg-[#f7e7c6] text-[#6f5948] transition hover:bg-[#ffb38a]/40 hover:text-[#2d2119]" type="button" onClick={onClose}>
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
              <h3 className="text-xs font-black text-[#2d2119]">{group.title}</h3>
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
    amber: { rail: "border-l-[#f8d96b]", icon: "bg-[#f8d96b]/25 text-[#8a6510]" },
    cyan: { rail: "border-l-[#8bd8b6]", icon: "bg-[#8bd8b6]/24 text-[#1f8a5b]" },
    rose: { rail: "border-l-[#ff8a7a]", icon: "bg-[#ffb38a]/22 text-[#a33a2d]" },
    slate: { rail: "border-l-[#6f5948]/20", icon: "bg-[#fff7e8] text-[#6f5948]" },
  }[item.tone];

  return (
    <article className={cn("relative rounded-[1.35rem] border border-l-4 border-[#6f5948]/12 bg-[#fffdf7] p-4 shadow-sm", tone.rail)}>
      {item.unread ? <span className="absolute right-4 top-4 size-2 rounded-full bg-rose-500" /> : null}
      <div className="flex gap-3 pr-4">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", tone.icon)}>
          <item.Icon className="size-4" strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <h4 className="text-[0.72rem] font-black text-[#2d2119]">{item.title}</h4>
          <p className="mt-1 text-[0.68rem] leading-4 text-[#6f5948]">{item.body}</p>
          <p className="mt-2 text-[0.62rem] font-medium text-[#6f5948]/60">{item.time}</p>
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
            <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-[#8bd8b6]/22 text-[#1f8a5b]">
              <Bot className="size-5" />
            </span>
            <div className="rounded-2xl border border-[#6f5948]/12 bg-[#fffdf7] p-4 shadow-[0_14px_42px_rgba(92,62,37,0.08)]">
              <p className="text-[0.72rem] leading-5 text-[#6f5948]">
                Hello! I&apos;m your CIBIL assistant. Ask me about checking your score, downloading reports, or resolving issues.
              </p>
              <p className="mt-3 text-[0.62rem] font-medium text-[#6f5948]/60">09:24</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#6f5948]/12 bg-[#fff7e8] px-4 py-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {quickActions.map(({ Icon, label }) => (
              <button key={label} className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-[#6f5948]/12 bg-[#fffdf7] px-3 text-[0.68rem] font-black text-[#6f5948] shadow-sm transition hover:border-[#1f8a5b]/35 hover:text-[#1f8a5b]" type="button">
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input className="h-10 min-w-0 flex-1 rounded-full border border-[#6f5948]/12 bg-[#fffdf7] px-4 text-[0.72rem] font-medium text-[#2d2119] shadow-sm outline-none transition placeholder:text-[#6f5948]/50 focus:border-[#1f8a5b]/35 focus:ring-4 focus:ring-[#8bd8b6]/20" placeholder="Type a message..." />
            <button aria-label="Send message" className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#2d2119] text-[#fff7e8] shadow-[0_12px_30px_rgba(92,62,37,0.16)] transition hover:bg-[#1f8a5b]" type="button">
              <Send className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
