"use client";

import { AlertTriangle, Bell, CreditCard, Crown, LoaderCircle, Menu, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { CibilDisplayDataError, getCachedCibilDisplayData, getStoredLatestCibilScoreCheckData } from "@/lib/cibil-display-cache";
import { useSubscriptionAccess } from "@/lib/subscription-access";
import { cn } from "@/lib/utils";

type SimulatorTab = "simulator" | "plan" | "checklist";

type CreditAccount = {
  account_closed?: string | null;
  account_status?: string | number | null;
  amount_overdue?: string | number | null;
  current_balance?: string | number | null;
  high_credit_amount?: string | number | null;
  member_name?: string | null;
  payment_history?: string[] | null;
  payment_history_details?: PaymentHistoryItem[] | null;
  type?: string | number | null;
};

type PaymentHistoryItem = {
  Days_Past_Due?: string | number | null;
};

type DisplayDataResponse = {
  data?: {
    credit_score?: string | number | null;
    report?: {
      credit_score?: string | number | null;
    };
    display?: {
      score?: {
        value?: string | number | null;
      };
      accounts?: CreditAccount[] | null;
    };
  };
};

type CardAccount = {
  id: string;
  bankName: string;
  balance: number;
  creditLimit: number;
  utilization: number;
};

type SimulatorAction = {
  id: string;
  title: string;
  subtitle: string;
  impact: number;
};

const creditCardTypes = new Set(["10", "31", "35", "36"]);
const notificationsPageSize = 10;

export function ScoreFixExperience() {
  const router = useRouter();
  const [displayData, setDisplayData] = useState<DisplayDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<SimulatorTab>("simulator");
  const [utilizationValue, setUtilizationValue] = useState(0);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const { isFreeTier } = useSubscriptionAccess();

  const score = readScore(displayData);
  const accounts = useMemo(() => displayData?.data?.display?.accounts ?? [], [displayData]);
  const cardAccounts = useMemo(() => getCreditCardAccounts(accounts), [accounts]);
  const topCard = cardAccounts[0] ?? null;
  const actions = useMemo(() => buildSimulatorActions(accounts, cardAccounts), [accounts, cardAccounts]);
  const currentScore = score ?? 300;
  const sliderImpact = topCard ? getUtilizationImpact(utilizationValue) : 0;
  const actionImpact = actions
    .filter((action) => selectedActions.includes(action.id))
    .reduce((total, action) => total + action.impact, 0);
  const projectedScore = clampScore(currentScore + sliderImpact + actionImpact);
  const difference = projectedScore - currentScore;
  const scoreStatus = getScoreStatus(projectedScore);

  const loadDisplayData = useCallback(async () => {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = (await getCachedCibilDisplayData(token)) as DisplayDataResponse;

      setDisplayData(result);
    } catch (loadError) {
      if (loadError instanceof CibilDisplayDataError && (loadError.status === 401 || loadError.status === 403)) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      const cachedResult = getStoredLatestCibilScoreCheckData(token) as DisplayDataResponse | null;

      setDisplayData(cachedResult);
      setError(cachedResult ? "" : "Could not load your report data.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDisplayData();
  }, [loadDisplayData]);

  useEffect(() => {
    setUtilizationValue(Math.round(topCard?.utilization ?? 0));
  }, [topCard?.id, topCard?.utilization]);

  useEffect(() => {
    setSelectedActions((currentActions) => currentActions.filter((actionId) => actions.some((action) => action.id === actionId)));
  }, [actions]);

  useEffect(() => {
    async function refreshNotifications() {
      const token = localStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) return;

      try {
        const result = await loadNotifications(token);
        setNotificationUnreadCount(result.unreadCount);
      } catch {
        setNotificationUnreadCount(0);
      }
    }

    void refreshNotifications();
    window.addEventListener("scorecare:notifications-updated", refreshNotifications);

    return () => window.removeEventListener("scorecare:notifications-updated", refreshNotifications);
  }, []);

  function toggleAction(actionId: string) {
    setSelectedActions((currentActions) =>
      currentActions.includes(actionId) ? currentActions.filter((id) => id !== actionId) : [...currentActions, actionId],
    );
  }

  return (
    <PortalShell active="fix">
      <PortalTopBar title="Improve" />
      <div className="min-h-screen bg-[#050912] pb-28 text-white">
        <PageContent className="max-w-md space-y-5">
          <div className="flex items-center justify-between">
            <Link
              href="/profile"
              aria-label="Open profile menu"
              data-dashboard-profile="true"
              className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl"
            >
              <Menu className="size-5" strokeWidth={1.8} />
            </Link>
            <div className="flex items-center gap-3">
              {isFreeTier ? (
                <Link
                  href="/pricing"
                  aria-label="Premium benefits"
                  className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-[#FFD34D] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl"
                >
                  <Crown className="size-6 fill-[#FFD34D]/20" strokeWidth={1.8} />
                </Link>
              ) : null}
              <Link
                aria-label="Open notifications"
                className="relative grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-[#FFD34D] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl"
                href="/notifications"
              >
                <Bell className="size-6" strokeWidth={1.8} />
                {notificationUnreadCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 grid min-w-5 place-items-center rounded-full bg-[#FF3B30] px-1.5 text-[12px] font-bold leading-5 text-white shadow-[0_6px_12px_rgba(255,59,48,0.28)]">
                    {notificationUnreadCount > 99 ? "99+" : notificationUnreadCount}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>
          <div className="space-y-1 pt-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#22F2C2]">Score Simulator</p>
            <h1 className="text-2xl font-black tracking-normal text-white">Improve</h1>
          </div>

          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,#071522,#0A1725)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
            <div className="grid grid-cols-2 gap-3">
              <ScoreMetric label="Current Score" value={score ? String(score) : "--"} />
              <ScoreMetric label="Projected Score" value={String(projectedScore)} tone={scoreStatus.tone} />
            </div>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className={cn("text-3xl font-black", difference > 0 && "text-[#22F2C2]", difference < 0 && "text-rose-400", difference === 0 && "text-slate-300")}>
                  {formatSigned(difference)} pts
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">{scoreStatus.label}</p>
              </div>
              <div className={cn("grid size-12 place-items-center rounded-2xl border", difference >= 0 ? "border-[#22F2C2]/25 bg-[#22F2C2]/10 text-[#22F2C2]" : "border-rose-400/25 bg-rose-400/10 text-rose-300")}>
                {difference >= 0 ? <TrendingUp className="size-6" /> : <TrendingDown className="size-6" />}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-3 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            <TabButton active={activeTab === "simulator"} onClick={() => setActiveTab("simulator")}>Simulator</TabButton>
            <TabButton active={activeTab === "plan"} onClick={() => setActiveTab("plan")}>30-Day Plan</TabButton>
            <TabButton active={activeTab === "checklist"} onClick={() => setActiveTab("checklist")}>Checklist</TabButton>
          </div>

          {activeTab === "simulator" ? (
            <section className="space-y-5 rounded-[24px] border border-white/10 bg-[#111821] p-5">
              {loading ? (
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                  <LoaderCircle className="size-5 animate-spin text-[#22F2C2]" /> Reading your report data...
                </div>
              ) : null}

              {error ? <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs font-semibold text-rose-200">{error}</p> : null}

              {topCard ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-bold text-white">
                        <CreditCard className="size-4 text-[#22F2C2]" /> {topCard.bankName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatRupees(topCard.balance)} used of {formatRupees(topCard.creditLimit)}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-[#22F2C2]">
                      {utilizationValue}%
                    </span>
                  </div>

                  <input
                    aria-label="Credit card utilization"
                    className="h-2 w-full cursor-pointer accent-[#22F2C2]"
                    max={100}
                    min={0}
                    type="range"
                    value={utilizationValue}
                    onChange={(event) => setUtilizationValue(Number(event.target.value))}
                  />
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>5% Ideal</span>
                    <span>90% Danger</span>
                  </div>
                </div>
              ) : (
                <EmptyState icon={<CreditCard className="size-5" />} text="No credit card utilization found" />
              )}

              <div className="space-y-1">
                {actions.length ? (
                  actions.map((action) => (
                    <ActionRow
                      action={action}
                      checked={selectedActions.includes(action.id)}
                      key={action.id}
                      onChange={() => toggleAction(action.id)}
                    />
                  ))
                ) : (
                  <EmptyState icon={<AlertTriangle className="size-5" />} text="No simulator actions available from your current report" />
                )}
              </div>

              <p className="text-[11px] leading-5 text-slate-500">
                This is an estimated simulator based on your report data. Actual bureau score changes may vary.
              </p>
            </section>
          ) : null}

          {activeTab === "plan" ? <Placeholder text="No plan available yet" /> : null}
          {activeTab === "checklist" ? <Placeholder text="Checklist coming soon" /> : null}
        </PageContent>
      </div>
      <DashboardBottomNav />
    </PortalShell>
  );
}

function ScoreMetric({ label, tone = "text-white", value }: { label: string; tone?: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={cn("mt-2 text-3xl font-black", tone)}>{value}</p>
    </div>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={cn("min-h-10 rounded-xl px-2 text-xs font-black transition", active ? "bg-[#22F2C2] text-[#03100D]" : "text-slate-400")}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ActionRow({ action, checked, onChange }: { action: SimulatorAction; checked: boolean; onChange: () => void }) {
  const positive = action.impact > 0;

  return (
    <button className="flex w-full items-center justify-between gap-4 border-b border-white/10 py-4 text-left last:border-b-0" type="button" onClick={onChange}>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-white">{action.title}</span>
        <span className={cn("mt-1 block text-xs font-semibold", positive ? "text-[#22F2C2]" : "text-rose-300")}>
          {action.subtitle} ({formatSigned(action.impact)} pts)
        </span>
      </span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full border transition", checked ? "border-[#22F2C2]/60 bg-[#22F2C2]/30" : "border-white/10 bg-slate-800")}>
        <span className={cn("absolute top-1 size-5 rounded-full bg-white transition", checked ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-slate-400">
      <span className="text-[#22F2C2]">{icon}</span>
      {text}
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return <div className="rounded-[24px] border border-white/10 bg-[#111821] p-5 text-sm font-semibold text-slate-400">{text}</div>;
}

function getCreditCardAccounts(accounts: CreditAccount[]) {
  return accounts
    .map((account, index): CardAccount | null => {
      if (!creditCardTypes.has(String(account.type ?? "")) || !isActiveAccount(account)) {
        return null;
      }

      const creditLimit = readNumericValue(account.high_credit_amount);
      const balance = readNumericValue(account.current_balance);

      if (creditLimit <= 0) {
        return null;
      }

      return {
        balance,
        bankName: account.member_name?.trim() || "Credit card",
        creditLimit,
        id: `${account.member_name ?? "card"}-${index}`,
        utilization: Math.min(100, Math.max(0, (balance / creditLimit) * 100)),
      };
    })
    .filter((account): account is CardAccount => Boolean(account))
    .sort((first, second) => second.utilization - first.utilization);
}

function buildSimulatorActions(accounts: CreditAccount[], cardAccounts: CardAccount[]) {
  const actions: SimulatorAction[] = [];
  const hasActiveLoan = accounts.some((account) => !creditCardTypes.has(String(account.type ?? "")) && isActiveAccount(account));
  const hasOverdue = accounts.some((account) => readNumericValue(account.amount_overdue) > 0 || hasDpd(account));
  const hasInactiveCard = accounts.some((account) => creditCardTypes.has(String(account.type ?? "")) && !isActiveAccount(account));
  const hasHighUtilizationCard = cardAccounts.some((account) => account.utilization > 30);

  if (hasActiveLoan) {
    actions.push({ id: "miss-emi", impact: -58, subtitle: "Late payment risk", title: "Miss EMI this month" });
  }

  if (hasOverdue) {
    actions.push({ id: "pay-overdue", impact: 25, subtitle: "Clears overdue pressure", title: "Pay overdue amount" });
  }

  if (hasInactiveCard) {
    actions.push({ id: "close-inactive-card", impact: -10, subtitle: "May reduce age or available limit", title: "Close inactive card" });
  }

  if (hasHighUtilizationCard) {
    actions.push({ id: "pay-card-below-30", impact: 20, subtitle: "Lower utilization improves profile", title: "Pay credit card dues below 30%" });
  }

  if (!cardAccounts.length || accounts.length <= 2) {
    actions.push({ id: "secured-card", impact: 15, subtitle: "Can improve thin credit mix", title: "Get secured/FD-backed credit card" });
  }

  return actions;
}

function readScore(result: DisplayDataResponse | null) {
  const score = result?.data?.display?.score?.value ?? result?.data?.credit_score ?? result?.data?.report?.credit_score;
  const numericScore = readNumericValue(score);

  return numericScore > 0 ? numericScore : null;
}

function readNumericValue(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^\d.-]/g, ""));

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function isActiveAccount(account: CreditAccount) {
  const status = String(account.account_status ?? "").toLowerCase();

  return !account.account_closed && !/(closed|inactive|settled|written|suit filed)/i.test(status);
}

function hasDpd(account: CreditAccount) {
  const details = account.payment_history_details ?? [];
  const detailDpd = details.some((history) => readNumericValue(history.Days_Past_Due) > 0);
  const profileDpd = (account.payment_history ?? []).some((history) => /\b(0*[1-9]\d*|sub|sma|dbt|lss)\b/i.test(history));

  return detailDpd || profileDpd;
}

function getUtilizationImpact(utilization: number) {
  if (utilization <= 10) return 20;
  if (utilization <= 30) return 12;
  if (utilization <= 50) return -8;
  if (utilization <= 75) return -20;
  if (utilization <= 90) return -35;

  return -50;
}

function clampScore(score: number) {
  return Math.min(900, Math.max(300, Math.round(score)));
}

function getScoreStatus(score: number) {
  if (score >= 750) return { label: "Excellent", tone: "text-[#22F2C2]" };
  if (score >= 700) return { label: "Good", tone: "text-emerald-300" };
  if (score >= 650) return { label: "Fair", tone: "text-amber-300" };

  return { label: "Poor", tone: "text-rose-300" };
}

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

async function loadNotifications(token: string) {
  const response = await apiRequest(`/notifications?limit=${notificationsPageSize}&unreadOnly=false`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load notifications.");
  }

  const result = (await response.json()) as {
    status?: string;
    data?: {
      unreadCount?: number | null;
    };
  };

  return {
    unreadCount: result.status === "success" ? result.data?.unreadCount ?? 0 : 0,
  };
}

function formatRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}
