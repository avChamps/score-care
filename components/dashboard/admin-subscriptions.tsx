"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { AppCard } from "@/components/dashboard/portal-ui";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";

type AdminUser = {
  id?: string;
  publicId?: string;
  fullName?: string | null;
  mobileNumber?: string | null;
  panNumber?: string | null;
  accessType?: string | null;
  subscriptionDueAt?: string | null;
  subscriptionStatus?: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Plan = {
  label: string;
  amount: string;
  months: number;
};

const plans: Plan[] = [
  { label: "1 Month", amount: "Rs. 89", months: 1 },
  { label: "3 Months", amount: "Rs. 199", months: 3 },
  { label: "6 Months", amount: "Rs. 399", months: 6 },
  { label: "1 Year", amount: "Rs. 699", months: 12 },
];

export function AdminSubscriptions() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ limit: 20, page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan>(plans[0]);
  const [updating, setUpdating] = useState(false);

  const loadUsers = useCallback(async () => {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      const params = new URLSearchParams({
        limit: "20",
        page: String(page),
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const response = await apiRequest(`/admin/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setUsers([]);
        setNotice("Could not load subscriptions.");
        return;
      }

      const result = await response.json();
      const data = readRecord(result?.data);

      setUsers(Array.isArray(data.users) ? data.users.filter(isRecord) as AdminUser[] : []);
      setPagination(normalizePagination(data.pagination));
    } catch {
      setUsers([]);
      setNotice("Could not load subscriptions.");
    } finally {
      setLoading(false);
    }
  }, [page, router, search]);

  useEffect(() => {
    void Promise.resolve().then(loadUsers);
  }, [loadUsers]);

  const planPreview = useMemo(() => buildSubscriptionDates(selectedPlan.months), [selectedPlan]);

  async function updateSubscription() {
    if (!selectedUser?.publicId || updating) {
      return;
    }

    if (!window.confirm(`Update ${selectedUser.fullName || "user"} to ${selectedPlan.label} subscription?`)) {
      return;
    }

    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    setUpdating(true);
    setNotice("");

    try {
      const response = await apiRequest(`/admin/users/${selectedUser.publicId}/subscription`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          subscriptionStatus: "active",
          subscriptionStartedAt: planPreview.startedAt,
          subscriptionDueAt: planPreview.endsAt,
          subscriptionEndsAt: planPreview.endsAt,
        },
      });

      if (response.status === 401 || response.status === 403) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to update subscription");
      }

      setSelectedUser(null);
      setNotice("Subscription updated.");
      void loadUsers();
    } catch {
      setNotice("Could not update subscription.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="space-y-5 animate-[creditPanelIn_0.42s_ease-out]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-caption font-black uppercase tracking-[0.16em] text-[var(--portal-orange)]">Admin</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-[var(--portal-ink)]">Subscriptions</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--portal-muted)]">Update customer subscription plans.</p>
        </div>
        {notice ? <p className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">{notice}</p> : null}
      </div>

      <AppCard>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--portal-muted)]" />
          <input
            className="h-11 w-full rounded-xl border border-[var(--portal-border)] bg-white pl-10 pr-3 text-sm font-semibold text-[var(--portal-ink)] outline-none transition focus:border-[var(--portal-blue)]"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search"
            type="search"
            value={search}
          />
        </label>
      </AppCard>

      <AppCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-[var(--portal-surface-soft)] text-caption font-black uppercase tracking-[0.12em] text-[var(--portal-muted)]">
              <tr>
                {["Username", "Mobile", "PAN", "Subscription Type", "Due Date", "Action"].map((heading) => (
                  <th key={heading} className="whitespace-nowrap border-b border-[var(--portal-border)] px-4 py-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-bold text-[var(--portal-muted)]" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              ) : users.length ? (
                users.map((user) => (
                  <tr key={user.publicId ?? user.id} className="border-b border-[var(--portal-border)]">
                    <td className="whitespace-nowrap border-b border-[var(--portal-border)] px-4 py-3 font-semibold text-[var(--portal-ink)]">{user.fullName || "-"}</td>
                    <td className="whitespace-nowrap border-b border-[var(--portal-border)] px-4 py-3 font-semibold text-[var(--portal-ink)]">{user.mobileNumber || "-"}</td>
                    <td className="whitespace-nowrap border-b border-[var(--portal-border)] px-4 py-3 font-semibold text-[var(--portal-ink)]">{user.panNumber || "-"}</td>
                    <td className="whitespace-nowrap border-b border-[var(--portal-border)] px-4 py-3">
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                        {user.subscriptionStatus || user.accessType || "-"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap border-b border-[var(--portal-border)] px-4 py-3 font-semibold text-[var(--portal-ink)]">{formatOptionalDate(user.subscriptionDueAt)}</td>
                    <td className="whitespace-nowrap border-b border-[var(--portal-border)] px-4 py-3">
                      <button
                        className="rounded-xl bg-[var(--portal-blue)] px-4 py-2 text-xs font-black text-white transition hover:bg-[#045ec0]"
                        onClick={() => {
                          setSelectedPlan(plans[0]);
                          setSelectedUser(user);
                        }}
                        type="button"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-bold text-[var(--portal-muted)]" colSpan={6}>
                    No subscriptions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--portal-border)] px-4 py-3">
          <p className="text-xs font-bold text-[var(--portal-muted)]">
            Page <AnimatedNumber value={pagination.page} /> of <AnimatedNumber value={pagination.totalPages} /> • <AnimatedNumber value={pagination.total} /> total
          </p>
          <div className="flex gap-2">
            <button className="rounded-xl border border-[var(--portal-border)] bg-white px-3 py-2 text-xs font-black text-[var(--portal-ink)] disabled:opacity-50" disabled={loading || pagination.page <= 1} onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))} type="button">
              Prev
            </button>
            <button className="rounded-xl border border-[var(--portal-border)] bg-white px-3 py-2 text-xs font-black text-[var(--portal-ink)] disabled:opacity-50" disabled={loading || pagination.page >= pagination.totalPages} onClick={() => setPage((currentPage) => Math.min(pagination.totalPages, currentPage + 1))} type="button">
              Next
            </button>
          </div>
        </div>
      </AppCard>

      {selectedUser ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--portal-orange)]">Update Details</p>
                <h3 className="mt-1 text-lg font-black text-[var(--portal-ink)]">{selectedUser.fullName || "User"}</h3>
              </div>
              <button className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500" onClick={() => setSelectedUser(null)} type="button">
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5">
              <p className="text-xs font-bold text-[var(--portal-muted)]">Subscription Type</p>
              <div className="mt-2 grid gap-2">
                {plans.map((plan) => {
                  const selected = selectedPlan.label === plan.label;

                  return (
                    <button
                      key={plan.label}
                      className={`flex h-11 items-center justify-between rounded-xl border px-3 text-sm font-bold transition ${
                        selected
                          ? "border-[var(--portal-blue)] bg-[var(--portal-blue-soft)] text-[var(--portal-blue)]"
                          : "border-[var(--portal-border)] bg-white text-[var(--portal-ink)] hover:border-[var(--portal-blue)]"
                      }`}
                      onClick={() => setSelectedPlan(plan)}
                      type="button"
                    >
                      <span><AnimatedNumber value={plan.label} /></span>
                      <span><AnimatedNumber value={plan.amount} /></span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-600">
              <p>Start: {formatDate(planPreview.startedAt)}</p>
              <p>End: {formatDate(planPreview.endsAt)}</p>
            </div>

            <button className="mt-5 h-11 w-full rounded-xl bg-[var(--portal-orange)] text-sm font-black text-white transition hover:bg-[var(--portal-orange-deep)] disabled:opacity-60" disabled={updating} onClick={() => void updateSubscription()} type="button">
              {updating ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildSubscriptionDates(months: number) {
  const startedAt = new Date();
  const endsAt = new Date(startedAt);

  endsAt.setMonth(endsAt.getMonth() + months);

  return {
    endsAt: endsAt.toISOString(),
    startedAt: startedAt.toISOString(),
  };
}

function normalizePagination(value: unknown): Pagination {
  const pagination = readRecord(value);

  return {
    limit: readNumber(pagination.limit) || 20,
    page: readNumber(pagination.page) || 1,
    total: readNumber(pagination.total),
    totalPages: readNumber(pagination.totalPages) || 1,
  };
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isRecord(value: unknown): value is AdminUser {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readNumber(value: unknown) {
  const numberValue = typeof value === "string" ? Number(value) : value;
  return typeof numberValue === "number" && Number.isFinite(numberValue) ? numberValue : 0;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatOptionalDate(value?: string | null) {
  return value ? formatDate(value) : "-";
}
