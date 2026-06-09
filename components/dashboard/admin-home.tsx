"use client";

import {
  BadgeIndianRupee,
  CalendarClock,
  CheckCircle2,
  Clock,
  IndianRupee,
  MessageSquareText,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ElementType } from "react";
import { useEffect, useMemo, useState } from "react";
import { AppCard } from "@/components/dashboard/portal-ui";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";

type AdminAnalytics = {
  totalUsers?: number;
  newUsers?: number;
  subscriptions?: number;
  amount?: number;
  upcomingOverdues?: number;
  totalMessages?: number;
  loans?: {
    applied?: number;
    approved?: number;
    rejected?: number;
    pending?: number;
  };
};

type UserProfile = {
  isAdmin?: boolean;
};

export function AdminHome() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadAdminHome() {
      const token = sessionStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      try {
        const profileResponse = await apiRequest("/users/me/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (profileResponse.status === 401 || profileResponse.status === 403) {
          clearScorecareSession();
          router.replace("/login");
          return;
        }

        const profileResult = await profileResponse.json();
        const user = (profileResult?.data?.user ?? null) as UserProfile | null;

        if (!user?.isAdmin) {
          sessionStorage.removeItem("scorecare_admin_view");
          router.replace("/dashboard");
          return;
        }

        const analyticsResponse = await apiRequest("/admin/analytics", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!analyticsResponse.ok) {
          setNotice("Live analytics are not connected yet.");
          setAnalytics({});
          return;
        }

        const analyticsResult = await analyticsResponse.json();
        setAnalytics(normalizeAnalytics(analyticsResult?.data ?? analyticsResult));
      } catch {
        setNotice("Live analytics are not connected yet.");
        setAnalytics({});
      } finally {
        setLoading(false);
      }
    }

    loadAdminHome();
  }, [router]);

  const metrics = useMemo(() => {
    const data = analytics ?? {};
    const loans = data.loans ?? {};

    return [
      { label: "Total users", value: formatCount(data.totalUsers), Icon: Users, tone: "blue" },
      { label: "New users", value: formatCount(data.newUsers), Icon: UserPlus, tone: "green" },
      { label: "Subscriptions", value: formatCount(data.subscriptions), Icon: BadgeIndianRupee, tone: "orange" },
      { label: "Amount", value: formatMoney(data.amount), Icon: IndianRupee, tone: "blue" },
      { label: "Upcoming overdues", value: formatCount(data.upcomingOverdues), Icon: CalendarClock, tone: "rose" },
      { label: "Total messages", value: formatCount(data.totalMessages), Icon: MessageSquareText, tone: "green" },
      { label: "Loans applied", value: formatCount(loans.applied), Icon: Clock, tone: "orange" },
      { label: "Loans approved", value: formatCount(loans.approved), Icon: CheckCircle2, tone: "green" },
      { label: "Loans rejected", value: formatCount(loans.rejected), Icon: XCircle, tone: "rose" },
    ];
  }, [analytics]);

  return (
    <div className="space-y-5 animate-[creditPanelIn_0.42s_ease-out]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[var(--portal-orange)]">Admin home</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--portal-ink)]">Analytics overview</h2>
        </div>
        {notice ? <p className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">{notice}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric, index) => (
          <AdminMetricCard key={metric.label} loading={loading} index={index} {...metric} />
        ))}
      </div>

      <AppCard className="animate-[creditPanelIn_0.45s_ease-out_120ms_both]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-[var(--portal-ink)]">Loan pipeline</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--portal-muted)]">Applied, approved, rejected, and pending applications.</p>
          </div>
          <span className="rounded-full bg-[var(--portal-blue-soft)] px-3 py-1 text-xs font-black text-[var(--portal-blue)]">
            {loading ? "Loading" : `${formatCount(analytics?.loans?.pending)} pending`}
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            ["Applied", analytics?.loans?.applied],
            ["Approved", analytics?.loans?.approved],
            ["Rejected", analytics?.loans?.rejected],
            ["Pending", analytics?.loans?.pending],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-4">
              <p className="text-xs font-bold text-[var(--portal-muted)]">{label}</p>
              <p className="mt-2 text-2xl font-black text-[var(--portal-ink)]">{loading ? "..." : formatCount(value as number | undefined)}</p>
            </div>
          ))}
        </div>
      </AppCard>
    </div>
  );
}

function AdminMetricCard({
  Icon,
  index,
  label,
  loading,
  tone,
  value,
}: {
  Icon: ElementType;
  index: number;
  label: string;
  loading: boolean;
  tone: string;
  value: string;
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : tone === "orange"
        ? "bg-[var(--portal-orange-soft)] text-[var(--portal-orange)] border-orange-100"
        : tone === "rose"
          ? "bg-rose-50 text-rose-600 border-rose-100"
          : "bg-[var(--portal-blue-soft)] text-[var(--portal-blue)] border-blue-100";

  return (
    <AppCard className="animate-[creditPanelIn_0.45s_ease-out_both]" style={{ animationDelay: `${index * 45}ms` }}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[var(--portal-muted)]">{label}</p>
          <p className="mt-3 truncate text-2xl font-black text-[var(--portal-ink)]">{loading ? "..." : value}</p>
        </div>
        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl border ${toneClass}`}>
          <Icon className="size-5" />
        </span>
      </div>
    </AppCard>
  );
}

function normalizeAnalytics(value: Record<string, unknown>): AdminAnalytics {
  const loans = readRecord(value.loans);

  return {
    totalUsers: readNumber(value.totalUsers ?? value.usersTotal ?? value.users),
    newUsers: readNumber(value.newUsers ?? value.newUsersToday ?? value.todayUsers),
    subscriptions: readNumber(value.subscriptions ?? value.totalSubscriptions),
    amount: readNumber(value.amount ?? value.totalAmount ?? value.revenue),
    upcomingOverdues: readNumber(value.upcomingOverdues ?? value.overdues),
    totalMessages: readNumber(value.totalMessages ?? value.messages),
    loans: {
      applied: readNumber(loans.applied ?? loans.total ?? value.loansApplied),
      approved: readNumber(loans.approved ?? value.loansApproved),
      rejected: readNumber(loans.rejected ?? value.loansRejected),
      pending: readNumber(loans.pending ?? value.loansPending),
    },
  };
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function readNumber(value: unknown) {
  const numberValue = typeof value === "string" ? Number(value) : value;
  return typeof numberValue === "number" && Number.isFinite(numberValue) ? numberValue : undefined;
}

function formatCount(value?: number) {
  return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

function formatMoney(value?: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value ?? 0);
}
