"use client";

import { Bell, Crown, Menu, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfilePanel, type UserProfile } from "@/app/dashboard/home-dashboard";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";
import { SubscribePromptOverlay, useSubscribePrompt } from "@/components/dashboard/subscribe-prompt";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { CibilDisplayDataError, getCachedCibilDisplayData, getStoredLatestCibilScoreCheckData } from "@/lib/cibil-display-cache";
import { useSubscriptionAccess } from "@/lib/subscription-access";
import { cn } from "@/lib/utils";

const improveTabs = ["Credit Improvement Plan", "Simulator"] as const;

type ImproveTab = (typeof improveTabs)[number];

type SimulatorAction = {
  id: string;
  title: string;
  subtitle: string;
  impact: number;
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
    };
  };
};

type CibilRepairContent = {
  plans: {
    id: string;
    planName: string;
    amount: number;
    currency: string;
    billingCycle: string;
    buttonLabel: string;
    displayOrder: number;
    isActive: boolean;
  }[];
  timelines: {
    id: string;
    title: string;
    description: string;
    displayOrder: number;
    isActive: boolean;
  }[];
};

type CibilRepairRequest = {
  createdDate?: string | null;
  disputeId?: string | null;
  id?: string;
  lenderName?: string | null;
  publicId?: string;
  paymentStatus?: string | null;
  repairStatus?: string | null;
  progress?: number | string | null;
  remarks?: string | null;
  createdAt?: string | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
};

type CibilRepairStatus = {
  activeDisputes?: number;
  resolvedDisputes?: number;
  pointsGained?: number;
};

const notificationsPageSize = 10;
const baselineUtilization = 42;
const fallbackRepairContent: CibilRepairContent = {
  plans: [
    {
      id: "cibil-full-repair-monthly",
      planName: "Full Repair",
      amount: 499,
      currency: "INR",
      billingCycle: "monthly",
      buttonLabel: "Start Full Repair",
      displayOrder: 1,
      isActive: true,
    },
  ],
  timelines: [
    { id: "report-analysis", title: "Report Analysis", description: "Review accounts, enquiries, balances, and negative signals.", displayOrder: 1, isActive: true },
    { id: "error-detection", title: "Error Detection", description: "Find wrong ownership, duplicate entries, late marks, and closure gaps.", displayOrder: 2, isActive: true },
    { id: "dispute-submission", title: "Dispute Submission", description: "Prepare bureau-ready disputes with supporting documents.", displayOrder: 3, isActive: true },
    { id: "lender-follow-up", title: "Lender Follow-up", description: "Coordinate lender follow-up until account correction is confirmed.", displayOrder: 4, isActive: true },
    { id: "score-verification", title: "Score Verification", description: "Verify bureau update and score movement after resolution.", displayOrder: 5, isActive: true },
  ],
};
const reportCardClass =
  "border border-[#103A2B]/50 bg-[linear-gradient(135deg,#06120E_0%,#081712_50%,#091813_100%)] shadow-[0_20px_45px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.02)]";
const reportMiniCardClass = "border border-[#0D5A3F]/55 bg-[linear-gradient(135deg,rgba(9,45,31,0.76),rgba(18,34,24,0.72))]";
const staticSimulatorActions: SimulatorAction[] = [
  { id: "miss-emi", impact: -20, subtitle: "Drops score by 20 pts", title: "Miss EMI this month" },
  { id: "close-inactive-card", impact: -12, subtitle: "May reduce available credit", title: "Close inactive credit card" },
  { id: "fd-backed-card", impact: 21, subtitle: "Improves credit mix", title: "Get FD-backed credit card" },
];

export function ScoreFixExperience() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ImproveTab>("Simulator");
  const [utilizationValue, setUtilizationValue] = useState(42);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [displayData, setDisplayData] = useState<DisplayDataResponse | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [, setIsLanguageLoading] = useState(false);
  const [repairContent, setRepairContent] = useState<CibilRepairContent>(fallbackRepairContent);
  const [repairRequests, setRepairRequests] = useState<CibilRepairRequest[]>([]);
  const [repairStatus, setRepairStatus] = useState<CibilRepairStatus | null>(null);
  const [repairRequestsLoading, setRepairRequestsLoading] = useState(false);
  const [repairSubmitting, setRepairSubmitting] = useState(false);
  const [repairError, setRepairError] = useState("");
  const { isFreeTier, loading: subscriptionLoading } = useSubscriptionAccess();
  const { closeSubscribePrompt, promptSubscribe, showSubscribePrompt } = useSubscribePrompt();
  const initialTabHandledRef = useRef(false);

  const actions = staticSimulatorActions;
  const currentScore = readScore(displayData);
  const actionImpact = actions
    .filter((action) => selectedActions.includes(action.id))
    .reduce((total, action) => total + action.impact, 0);
  const utilizationImpact = getUtilizationImpact(utilizationValue);
  const projectedScore = currentScore ? clampScore(currentScore + actionImpact + utilizationImpact) : null;
  const difference = currentScore && projectedScore ? projectedScore - currentScore : 0;
  const scoreStatus = getScoreStatus(projectedScore ?? 0);
  const scoreStatusLabel = projectedScore ? scoreStatus.label : "Score unavailable";
  const storedProfileName = typeof window !== "undefined" ? localStorage.getItem("scorecare_full_name")?.trim() : "";
  const profileName = profile?.fullName?.trim() || storedProfileName || "there";

  const validateSession = useCallback(() => {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  useEffect(() => {
    async function loadDisplayData() {
      const token = localStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) return;

      try {
        const result = (await getCachedCibilDisplayData(token)) as DisplayDataResponse;

        setDisplayData(result);
      } catch (loadError) {
        if (loadError instanceof CibilDisplayDataError && (loadError.status === 401 || loadError.status === 403)) {
          clearScorecareSession();
          router.replace("/login");
          return;
        }

        setDisplayData(getStoredLatestCibilScoreCheckData(token) as DisplayDataResponse | null);
      }
    }

    void loadDisplayData();
  }, [router]);

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

  const loadRepairContent = useCallback(async () => {
    try {
      const response = await apiRequest("/cibil-repair-content");
      const result = await response.json();

      if (!response.ok || result?.status !== "success") {
        return;
      }

      setRepairContent({
        plans: (result.data?.plans ?? []).filter((plan: CibilRepairContent["plans"][number]) => plan.isActive),
        timelines: (result.data?.timelines ?? []).filter((timeline: CibilRepairContent["timelines"][number]) => timeline.isActive),
      });
    } catch {
      setRepairContent(fallbackRepairContent);
    }
  }, []);

  const loadRepairRequests = useCallback(async () => {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    setRepairRequestsLoading(true);

    try {
      const [statusResponse, requestsResponse] = await Promise.all([
        apiRequest("/cibil-repair-content/requests/me/status", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiRequest("/cibil-repair-content/requests/me", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statusResponse.status === 401 || statusResponse.status === 403 || requestsResponse.status === 401 || requestsResponse.status === 403) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      if (!statusResponse.ok || !requestsResponse.ok) {
        throw new Error("Unable to load repair requests");
      }

      const [statusResult, requestsResult] = await Promise.all([
        statusResponse.json(),
        requestsResponse.json(),
      ]);

      setRepairStatus(statusResult?.data && typeof statusResult.data === "object" ? statusResult.data : null);
      setRepairRequests(Array.isArray(requestsResult?.data?.requests) ? requestsResult.data.requests : []);
    } catch {
      setRepairStatus(null);
      setRepairRequests([]);
    } finally {
      setRepairRequestsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (activeTab !== "Credit Improvement Plan") {
      return;
    }

    const repairTimer = window.setTimeout(() => {
      void loadRepairContent();
      void loadRepairRequests();
    }, 0);

    return () => window.clearTimeout(repairTimer);
  }, [activeTab, loadRepairContent, loadRepairRequests]);

  useEffect(() => {
    if (subscriptionLoading) return;

    if (!initialTabHandledRef.current) {
      initialTabHandledRef.current = true;

      if (new URLSearchParams(window.location.search).get("tab") === "credit-improvement-plan" && !isFreeTier) {
        setActiveTab("Credit Improvement Plan");
        return;
      }
    }

    if (isFreeTier && activeTab === "Credit Improvement Plan") {
      setActiveTab("Simulator");
    }
  }, [activeTab, isFreeTier, subscriptionLoading]);

  function handleTabChange(tab: ImproveTab) {
    if (tab === "Credit Improvement Plan" && isFreeTier) {
      setActiveTab("Simulator");
      promptSubscribe();
      return;
    }

    setActiveTab(tab);
  }

  function toggleAction(actionId: string) {
    setSelectedActions((currentActions) =>
      currentActions.includes(actionId) ? currentActions.filter((id) => id !== actionId) : [...currentActions, actionId],
    );
  }

  async function submitRepairRequest(plan: CibilRepairContent["plans"][number]) {
    if (repairSubmitting) return;

    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    setRepairSubmitting(true);
    setRepairError("");

    try {
      const response = await apiRequest("/cibil-repair-content/requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          planPublicId: plan.id,
          planName: plan.planName,
          amount: plan.amount,
          currency: plan.currency,
          paymentStatus: "pending",
          repairStatus: "submitted",
          remarks: "User selected CIBIL report repair",
        },
      });

      if (response.status === 401 || response.status === 403) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to submit repair request");
      }

      void loadRepairRequests();
    } catch {
      setRepairError("Could not submit repair request. Please try again.");
    } finally {
      setRepairSubmitting(false);
    }
  }

  return (
    <PortalShell active="fix">
      <PortalTopBar title="Improve" />
      <div className="min-h-screen bg-[#050912] pb-28 text-white">
        <PageContent className="max-w-md space-y-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Open profile menu"
              className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl"
              onClick={() => setShowProfile(true)}
            >
              <Menu className="size-5" strokeWidth={1.8} />
            </button>
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
              <ScoreMetric label="Current Score" value={currentScore ? String(currentScore) : "--"} />
              <ScoreMetric label="Projected Score" value={projectedScore ? String(projectedScore) : "--"} tone={projectedScore ? scoreStatus.tone : undefined} />
            </div>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className={cn("text-3xl font-black", difference > 0 && "text-[#22F2C2]", difference < 0 && "text-[#EF4444]", difference === 0 && "text-slate-300")}>
                  {formatSigned(difference)} pts
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">{scoreStatusLabel}</p>
              </div>
              <div className={cn("grid size-12 place-items-center rounded-2xl border", difference >= 0 ? "border-[#22F2C2]/25 bg-[#22F2C2]/10 text-[#22F2C2]" : "border-rose-400/25 bg-rose-400/10 text-[#EF4444]")}>
                {difference >= 0 ? <TrendingUp className="size-6" /> : <TrendingDown className="size-6" />}
              </div>
            </div>
          </section>

          <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
            {improveTabs.map((tab) => (
              <button
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition",
                  activeTab === tab ? "border-[#00D5A7]/80 bg-[#052E24]/70 text-[#22F2C2]" : "border-white/10 bg-white/[0.04] text-[#9DB0C9]",
                )}
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Simulator" ? (
            <section className="space-y-5 rounded-[28px] border border-white/10 bg-[#111821] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-white">Credit Card Utilization</p>
                    <p className="mt-1 text-[12px] font-semibold text-[#22F2C2]">Keep utilization below 30%</p>
                  </div>
                  <span className="text-[32px] font-black leading-none text-white">{utilizationValue}%</span>
                </div>

                <input
                  aria-label="Credit card utilization"
                  className="scorecare-utilization-slider h-2 w-full cursor-pointer appearance-none rounded-full"
                  max={90}
                  min={5}
                  style={{ background: `linear-gradient(to right, #22F2C2 0%, #22F2C2 ${((utilizationValue - 5) / 85) * 100}%, rgba(255,255,255,0.12) ${((utilizationValue - 5) / 85) * 100}%, rgba(255,255,255,0.12) 100%)` }}
                  type="range"
                  value={utilizationValue}
                  onChange={(event) => setUtilizationValue(Number(event.target.value))}
                />
                <div className="flex justify-between text-[11px] font-bold text-[#77869B]">
                  <span>5% Ideal</span>
                  <span>90% Danger</span>
                </div>
              </div>

              <div>
                {actions.map((action) => (
                  <ActionRow
                    action={action}
                    checked={selectedActions.includes(action.id)}
                    key={action.id}
                    onChange={() => toggleAction(action.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "Credit Improvement Plan" ? (
            <CreditImprovementPlan
              onStartRepair={submitRepairRequest}
              repairContent={repairContent}
              repairError={repairError}
              repairRequests={repairRequests}
              repairRequestsLoading={repairRequestsLoading}
              repairStatus={repairStatus}
              repairSubmitting={repairSubmitting}
            />
          ) : null}
        </PageContent>
      </div>
      <DashboardBottomNav />
      {showProfile ? (
        <ProfilePanel
          profile={profile}
          name={profileName}
          onClose={() => setShowProfile(false)}
          onHelp={() => router.push("/help-center")}
          onLanguageLoadingChange={setIsLanguageLoading}
          onProfileUpdate={setProfile}
        />
      ) : null}
      <SubscribePromptOverlay onClose={closeSubscribePrompt} show={showSubscribePrompt} />
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

function ActionRow({ action, checked, onChange }: { action: SimulatorAction; checked: boolean; onChange: () => void }) {
  return (
    <button className="flex w-full items-center justify-between gap-4 border-b border-white/10 py-4 text-left last:border-b-0" type="button" onClick={onChange}>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-white">{action.title}</span>
        
      </span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full border transition", checked ? "border-[#22F2C2]/60 bg-[#22F2C2]/30" : "border-white/10 bg-slate-800")}>
        <span className={cn("absolute top-1 size-5 rounded-full bg-white transition", checked ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

function CreditImprovementPlan({
  onStartRepair,
  repairContent,
  repairError,
  repairRequests,
  repairRequestsLoading,
  repairStatus,
  repairSubmitting,
}: {
  onStartRepair: (plan: CibilRepairContent["plans"][number]) => void;
  repairContent: CibilRepairContent;
  repairError: string;
  repairRequests: CibilRepairRequest[];
  repairRequestsLoading: boolean;
  repairStatus: CibilRepairStatus | null;
  repairSubmitting: boolean;
}) {
  const disputeStats = buildDisputeStats(repairStatus);
  const plan = [...repairContent.plans].sort((a, b) => a.displayOrder - b.displayOrder)[0] ?? fallbackRepairContent.plans[0];
  const timelines = repairContent.timelines.length ? [...repairContent.timelines].sort((a, b) => a.displayOrder - b.displayOrder) : fallbackRepairContent.timelines;
  const amountLabel = new Intl.NumberFormat("en-IN", {
    currency: plan.currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(plan.amount);
  const billingCycleLabel = plan.billingCycle === "monthly" ? "mo" : plan.billingCycle;

  return (
    <div className="space-y-4">
      {repairError ? <p className="rounded-2xl bg-[#ff4d7d]/10 px-3 py-2 text-[12px] font-medium text-[#ff8cab]">{repairError}</p> : null}

      <section className={cn("overflow-hidden rounded-[1.75rem] text-white", reportCardClass)}>
        <div className="bg-[radial-gradient(circle_at_85%_0%,rgba(31,117,107,0.28),transparent_34%),linear-gradient(160deg,#10243a,#081625)] px-4 py-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1F756B]">Credit Repair Service</p>
          <h2 className="mt-2 text-base font-semibold">{plan.planName}</h2>
          <p className="mt-2 text-[12px] leading-5 text-[#9fb2c6]">Expert review, disputes, lender follow-up, and score verification in one guided flow.</p>
          <button className="mt-4 h-11 w-full rounded-2xl bg-[#EF4444] text-xs font-semibold text-white shadow-[0_14px_28px_rgba(255,77,125,0.26)] disabled:opacity-60" disabled={repairSubmitting} type="button" onClick={() => onStartRepair(plan)}>
            {repairSubmitting ? "Submitting..." : `${plan.buttonLabel} — ${amountLabel}/${billingCycleLabel}`}
          </button>
        </div>
      </section>

      <section className={cn("rounded-[1.75rem] p-4 text-white", reportCardClass)}>
        <h2 className="text-sm font-semibold text-white">Repair timeline</h2>
        <div className="mt-4 space-y-3">
          {timelines.map((step, index) => (
            <div key={step.id} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#22F2C2]/12 text-[12px] font-semibold text-[#22F2C2]">{index + 1}</span>
              <div className="border-b border-white/10 pb-3 last:border-b-0">
                <p className="text-xs font-semibold text-white">{step.title}</p>
                <p className="mt-1 text-[12px] text-[#9fb2c6]">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={cn("rounded-[1.75rem] p-4 text-white", reportCardClass)}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#1F756B]">Dispute Centre</p>
            <h2 className="mt-1 text-sm font-semibold">Case progress</h2>
          </div>
          <span className="rounded-full bg-[#ff4d7d]/14 px-3 py-1 text-[12px] font-semibold text-[#ff8cab]">Live</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {disputeStats.map((stat) => (
            <div key={stat.label} className={cn("rounded-2xl px-3 py-3", reportMiniCardClass)}>
              <p className="text-sm font-semibold">{stat.value}</p>
              <p className="mt-1 text-[12px] leading-3 text-[#9fb2c6]">{stat.label}</p>
            </div>
          ))}
        </div>

        <RepairRequestsTable loading={repairRequestsLoading} requests={repairRequests} />
        <RepairDisputeCards loading={repairRequestsLoading} requests={repairRequests} />
      </section>
    </div>
  );
}

function RepairDisputeCards({ loading, requests }: { loading: boolean; requests: CibilRepairRequest[] }) {
  const disputes = requests.filter(hasDisputeData);

  if (loading) {
    return <div className={cn("mt-4 h-20 animate-pulse rounded-2xl", reportMiniCardClass)} />;
  }

  if (!disputes.length) {
    return (
      <div className={cn("mt-4 rounded-2xl p-3", reportMiniCardClass)}>
        <p className="text-xs font-semibold">No active disputes found</p>
        <p className="mt-1 text-[12px] leading-5 text-[#9fb2c6]">You currently have no dispute cases associated with this credit report.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {disputes.map((dispute) => (
        <div key={getDisputeId(dispute)} className={cn("rounded-2xl p-3", reportMiniCardClass)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold">{getDisputeId(dispute)}</p>
              <p className="mt-1 text-[12px] text-[#9fb2c6]">{dispute.lenderName || "--"}</p>
              <p className="mt-1 text-[12px] text-[#9fb2c6]">Created {formatDisputeCreatedDate(dispute)}</p>
            </div>
            <span className="rounded-full bg-[#1F756B]/12 px-2.5 py-1 text-[12px] font-semibold capitalize text-[#1F756B]">{dispute.repairStatus || dispute.paymentStatus || "--"}</span>
          </div>
          {readDisputeProgress(dispute) ? <p className="mt-3 text-[12px] font-semibold text-[#1F756B]">Progress {readDisputeProgress(dispute)}</p> : null}
        </div>
      ))}
    </div>
  );
}

function RepairRequestsTable({ loading, requests }: { loading: boolean; requests: CibilRepairRequest[] }) {
  return (
    <div className={cn("mt-4 overflow-hidden rounded-2xl", reportMiniCardClass)}>
      <div className="grid grid-cols-[1.1fr_0.8fr_1fr] border-b border-white/10 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9fb2c6]">
        <span>Date/Time</span>
        <span>Status</span>
        <span>Remarks</span>
      </div>
      {loading ? (
        <div className="grid gap-2 px-3 py-3">
          <div className="h-3 animate-pulse rounded-full bg-white/10" />
          <div className="h-3 w-10/12 animate-pulse rounded-full bg-white/10" />
        </div>
      ) : requests.length ? (
        requests.map((request) => (
          <div key={request.publicId ?? request.id} className="grid grid-cols-[1.1fr_0.8fr_1fr] gap-2 border-b border-white/8 px-3 py-2 text-[12px] text-white last:border-b-0">
            <span className="text-[#c8d3e2]">{formatRepairRequestDate(request)}</span>
            <span className="font-semibold capitalize text-[#1F756B]">{request.repairStatus || request.paymentStatus || "--"}</span>
            <span className="text-[#9fb2c6]">{request.remarks || "--"}</span>
          </div>
        ))
      ) : (
        <p className="px-3 py-3 text-[12px] text-[#9fb2c6]">No repair requests found.</p>
      )}
    </div>
  );
}

function clampScore(score: number) {
  return Math.min(900, Math.max(300, Math.round(score)));
}

function getUtilizationImpact(utilization: number) {
  return Math.round((baselineUtilization - utilization) * 0.8);
}

function buildDisputeStats(status: CibilRepairStatus | null) {
  return [
    { label: "Active disputes", value: String(status?.activeDisputes ?? 0) },
    { label: "Resolved disputes", value: String(status?.resolvedDisputes ?? 0) },
    { label: "Points gained", value: `+${status?.pointsGained ?? 0}` },
  ];
}

function formatRepairRequestDate(request: CibilRepairRequest) {
  const value = request.submittedAt || request.createdAt || request.updatedAt;

  if (!value) return "--";

  return formatDateTime(value);
}

function hasDisputeData(request: CibilRepairRequest) {
  return Boolean(request.disputeId || request.lenderName || readDisputeProgress(request));
}

function getDisputeId(request: CibilRepairRequest) {
  return request.disputeId || request.publicId || request.id || "--";
}

function formatDisputeCreatedDate(request: CibilRepairRequest) {
  const value = request.createdDate || request.createdAt || request.submittedAt;

  return value ? formatDateTime(value) : "--";
}

function readDisputeProgress(request: CibilRepairRequest) {
  if (request.progress === null || request.progress === undefined || request.progress === "") {
    return "";
  }

  return typeof request.progress === "number" ? `${request.progress}%` : String(request.progress);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function readScore(result: DisplayDataResponse | null) {
  const score = result?.data?.display?.score?.value ?? result?.data?.credit_score ?? result?.data?.report?.credit_score;
  const numericScore = typeof score === "number" ? score : Number(score);

  return Number.isFinite(numericScore) && numericScore > 0 ? numericScore : null;
}

function getScoreStatus(score: number) {
  if (score >= 750) return { label: "Excellent", tone: "text-[#22F2C2]" };
  if (score >= 700) return { label: "Good", tone: "text-emerald-300" };
  if (score >= 650) return { label: "Fair", tone: "text-amber-300" };

  return { label: "Poor", tone: "text-[#EF4444]" };
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
