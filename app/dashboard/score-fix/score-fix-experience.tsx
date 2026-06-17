"use client";

import { Bell, Crown, LoaderCircle, TrendingDown, TrendingUp, Upload, X } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfilePanel, type UserProfile } from "@/app/dashboard/home-dashboard";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import { DashboardHeaderHomeControl, PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";
import { SubscribePromptOverlay, useSubscribePrompt } from "@/components/dashboard/subscribe-prompt";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { CibilDisplayDataError, getCachedCibilDisplayData, getStoredLatestCibilScoreCheckData } from "@/lib/cibil-display-cache";
import { readSelectedCibilRepairAccounts, writeSelectedCibilRepairAccounts, type SelectedCibilRepairAccount } from "@/lib/cibil-repair-selection";
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
    id?: string;
    planName: string;
    amount?: number | null;
    currency?: string;
    offerTag?: string | null;
    billingCycle?: string;
    buttonLabel?: string | null;
    displayOrder?: number;
    isActive?: boolean;
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
  accountNumber?: string | null;
  accountType?: string | null;
  bankName?: string | null;
  createdDate?: string | null;
  disputeId?: string | null;
  id?: string;
  issueType?: string | null;
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

type RepairDocumentForm = {
  closingDate: string;
  error: string;
  file: File | null;
  remarks: string;
  uploaded: boolean;
  uploading: boolean;
};

type CibilRepairStatus = {
  activeDisputes?: number;
  resolvedDisputes?: number;
  pointsGained?: number;
};

type RepairIssueCard = {
  id: string;
  accountNumber: string;
  accountType: string;
  subscriberName: string;
  issueType: string;
  issueLabel: string;
  issueLabels: string[];
  currentBalance: number;
  overdueAmount: number;
  accountStatus: string;
  rawAccount: Record<string, unknown>;
};

const notificationsPageSize = 10;
const baselineUtilization = 42;
const fallbackRepairContent: CibilRepairContent = {
  plans: [],
  timelines: [],
};
const reportHighlightCardClass =
  "border border-[#0F5D43]/60 bg-[radial-gradient(circle_at_84%_0%,rgba(34,242,194,0.09),transparent_36%),linear-gradient(135deg,rgba(8,54,37,0.98),rgba(9,38,25,0.98))] shadow-[0_0_34px_rgba(34,242,194,0.07),0_18px_40px_rgba(0,0,0,0.32)] backdrop-blur-xl";
const reportMiniCardClass = "border border-[#0D5A3F]/55 bg-[linear-gradient(135deg,rgba(9,45,31,0.76),rgba(18,34,24,0.72))]";
const staticSimulatorActions: SimulatorAction[] = [
  { id: "miss-emi", impact: -20, subtitle: "Drops score by 20 pts", title: "Miss EMI this month" },
  { id: "close-inactive-card", impact: -12, subtitle: "May reduce available credit", title: "Close inactive credit card" },
  { id: "fd-backed-card", impact: 21, subtitle: "Improves credit mix", title: "Get FD-backed credit card" },
];

function parseDiscountPercent(offerTag?: string | null) {
  const discountMatch = offerTag?.match(/(\d+(?:\.\d+)?)\s*%/);
  return discountMatch ? Number(discountMatch[1]) : null;
}

function getOriginalAmount(amount?: number | null, offerTag?: string | null) {
  const discountPercent = parseDiscountPercent(offerTag);

  if (typeof amount !== "number" || !discountPercent || discountPercent >= 100) {
    return null;
  }

  return amount / (1 - discountPercent / 100);
}

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "INR",
  }).format(Math.round(amount));
}

function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;

  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getAccountsFromDisplayData(displayData: DisplayDataResponse | null) {
  const data = displayData?.data as
    | {
        credit_report?: {
          CAIS_Account?: { CAIS_Account_DETAILS?: Record<string, unknown>[] };
          RESPONSES?: { RESPONSE?: Record<string, unknown> | Record<string, unknown>[] };
        };
      }
    | undefined;
  const responses = data?.credit_report?.RESPONSES?.RESPONSE;
  const responseList = Array.isArray(responses) ? responses : responses ? [responses] : [];
  const crifLoanAccounts = responseList.flatMap((response) => {
    const loanDetails = response["LOAN-DETAILS"];

    return Array.isArray(loanDetails) ? loanDetails : loanDetails ? [loanDetails as Record<string, unknown>] : [];
  });

  if (crifLoanAccounts.length) return crifLoanAccounts;

  return Array.isArray(data?.credit_report?.CAIS_Account?.CAIS_Account_DETAILS)
    ? data.credit_report.CAIS_Account.CAIS_Account_DETAILS
    : [];
}

function readAccountHistory(account: Record<string, unknown>) {
  if (Array.isArray(account.CAIS_Account_History)) return account.CAIS_Account_History as Record<string, unknown>[];
  if (Array.isArray(account.payment_history_details)) return account.payment_history_details as Record<string, unknown>[];
  return [];
}

function readCrifDpdValues(account: Record<string, unknown>) {
  const combinedHistory = readString(account["COMBINED-PAYMENT-HISTORY"]);

  if (combinedHistory) {
    return combinedHistory
      .split("|")
      .map((entry) => {
        const status = entry.split(",")[1] ?? "";
        const dpdValue = status.split("/")[0]?.trim() ?? "";

        return /^\d+$/.test(dpdValue) ? Number(dpdValue) : 0;
      });
  }

  return readAccountHistory(account).map((history) => toNumber(history.Days_Past_Due ?? history.days_past_due));
}

function readMaxDpd(account: Record<string, unknown>) {
  return Math.max(0, ...readCrifDpdValues(account));
}

function hasOverdue(account: Record<string, unknown>) {
  return toNumber(account["OVERDUE-AMT"]) > 0;
}

function hasSettled(account: Record<string, unknown>) {
  const writtenStatus = readString(account["WRITTEN-OFF-SETTLED-STATUS"]).toLowerCase();

  return (
    writtenStatus.includes("settled") ||
    toNumber(account["SETTLEMENT-AMT"]) > 0
  );
}

function hasWrittenOff(account: Record<string, unknown>) {
  const writtenStatus = readString(account["WRITTEN-OFF-SETTLED-STATUS"]).toLowerCase();

  return (
    toNumber(account["WRITE-OFF-AMT"]) > 0 ||
    toNumber(account["PRINCIPAL-WRITE-OFF-AMT"]) > 0 ||
    writtenStatus.includes("written off") ||
    writtenStatus.includes("write off")
  );
}

function hasSuitFiled(account: Record<string, unknown>) {
  const suitStatus = readString(account["SUIT-FILED-WILFUL-DEFAULT-STATUS"]);

  return (
    (Boolean(suitStatus) && !suitStatus.toLowerCase().includes("no suit filed")) ||
    Boolean(readString(account["SUIT-FILED-DT"]))
  );
}

function buildIssueLabels(account: Record<string, unknown>) {
  const maxDpd = readMaxDpd(account);

  return [
    hasWrittenOff(account) ? "Written Off" : null,
    hasSettled(account) ? "Settled" : null,
    hasSuitFiled(account) ? "Suit Filed" : null,
    hasOverdue(account) ? "Overdue" : null,
    maxDpd > 0 ? "Late Payment" : null,
  ].filter(Boolean) as string[];
}

function readRepairAccountNumber(account: Record<string, unknown>) {
  return readString(account["ACCT-NUMBER"] ?? account.Account_Number ?? account.account_number ?? account.AccountNumber);
}

function readRepairSubscriberName(account: Record<string, unknown>) {
  return readString(account["CREDIT-GUARANTOR"] ?? account.Subscriber_Name ?? account.subscriberName ?? account.member_name);
}

function readRepairAccountType(account: Record<string, unknown>) {
  return readString(account["ACCT-TYPE"] ?? account.Account_Type ?? account.account_type ?? account.AccountType) || "Loan";
}

function readRepairCurrentBalance(account: Record<string, unknown>) {
  return toNumber(account["CURRENT-BAL"] ?? account.Current_Balance ?? account.current_balance);
}

function readRepairOverdueAmount(account: Record<string, unknown>) {
  return toNumber(account["OVERDUE-AMT"]);
}

function readRepairAccountStatus(account: Record<string, unknown>) {
  return readString(account["ACCOUNT-STATUS"] ?? account.Account_Status ?? account.account_status) || "--";
}

function buildRepairIssueCards(displayData: DisplayDataResponse | null): RepairIssueCard[] {
  const cards = new Map<string, RepairIssueCard>();

  getAccountsFromDisplayData(displayData).forEach((account, index) => {
    const issueLabels = buildIssueLabels(account);

    if (!issueLabels.length) return;

    const accountNumber = readRepairAccountNumber(account);
    const subscriberName = readRepairSubscriberName(account);

    if (!accountNumber || !subscriberName) return;

    const id = `${subscriberName.toLowerCase()}-${accountNumber || index}`;

    if (cards.has(id)) {
      const existingCard = cards.get(id);

      if (existingCard) {
        existingCard.issueLabels = Array.from(new Set([...existingCard.issueLabels, ...issueLabels]));
        existingCard.issueType = existingCard.issueLabels.join(", ");
        existingCard.issueLabel = existingCard.issueLabels[0] ?? "";
        existingCard.currentBalance = Math.max(existingCard.currentBalance, readRepairCurrentBalance(account));
        existingCard.overdueAmount = Math.max(existingCard.overdueAmount, readRepairOverdueAmount(account));
      }

      return;
    }

    cards.set(id, {
      id,
      accountNumber,
      accountType: readRepairAccountType(account),
      subscriberName,
      issueType: issueLabels.join(", "),
      issueLabel: issueLabels[0],
      issueLabels,
      currentBalance: readRepairCurrentBalance(account),
      overdueAmount: readRepairOverdueAmount(account),
      accountStatus: readRepairAccountStatus(account),
      rawAccount: account,
    });
  });

  return Array.from(cards.values()).filter((card) => card.currentBalance > 0 || card.overdueAmount > 0);
}

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
  const { isFreeTier, loading: subscriptionLoading } = useSubscriptionAccess();
  const { closeSubscribePrompt, promptSubscribe, showSubscribePrompt } = useSubscribePrompt();
  const initialTabHandledRef = useRef(false);
  const visibleImproveTabs = isFreeTier ? improveTabs.filter((tab) => tab === "Simulator") : improveTabs;

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

      const plans = (result.data?.plans ?? [])
        .filter((plan: CibilRepairContent["plans"][number]) => plan.isActive !== false)
        .sort((firstPlan: CibilRepairContent["plans"][number], secondPlan: CibilRepairContent["plans"][number]) => (firstPlan.displayOrder ?? 0) - (secondPlan.displayOrder ?? 0));
      const timelines = (result.data?.timelines ?? [])
        .filter((timeline: CibilRepairContent["timelines"][number]) => timeline.isActive !== false)
        .sort((firstTimeline: CibilRepairContent["timelines"][number], secondTimeline: CibilRepairContent["timelines"][number]) => firstTimeline.displayOrder - secondTimeline.displayOrder);

      setRepairContent({
        plans: plans.length ? plans : fallbackRepairContent.plans,
        timelines: timelines.length ? timelines : fallbackRepairContent.timelines,
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

      setRepairStatus(readRepairStatus(requestsResult?.data) ?? readRepairStatus(statusResult?.data));
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
    function refreshScoreFixScreen() {
      void loadRepairContent();

      if (activeTab === "Credit Improvement Plan") {
        void loadRepairRequests();
      }
    }

    window.addEventListener("scorecare:app-refresh", refreshScoreFixScreen);

    return () => window.removeEventListener("scorecare:app-refresh", refreshScoreFixScreen);
  }, [activeTab, loadRepairContent, loadRepairRequests]);

  useEffect(() => {
    if (subscriptionLoading) return;

    let tabTimer: number | undefined;

    if (!initialTabHandledRef.current) {
      initialTabHandledRef.current = true;

      if (!isFreeTier) {
        tabTimer = window.setTimeout(() => setActiveTab("Credit Improvement Plan"), 0);
        return () => {
          if (tabTimer) window.clearTimeout(tabTimer);
        };
      }
    }

    if (isFreeTier && activeTab === "Credit Improvement Plan") {
      tabTimer = window.setTimeout(() => setActiveTab("Simulator"), 0);
    }

    return () => {
      if (tabTimer) window.clearTimeout(tabTimer);
    };
  }, [activeTab, isFreeTier, subscriptionLoading]);

  function handleTabChange(tab: ImproveTab) {
    if (tab === "Credit Improvement Plan" && isFreeTier) {
      setActiveTab("Simulator");
      promptSubscribe();
      return;
    }

    setActiveTab(tab);
  }

  async function saveImproveToolAnalytics() {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    const response = await apiRequest("/improve-tool-analytics", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {},
    });

    if (response.status === 401 || response.status === 403) {
      clearScorecareSession();
      router.replace("/login");
    }
  }

  function toggleAction(actionId: string) {
    const isSelected = selectedActions.includes(actionId);

    if (!isSelected) {
      void saveImproveToolAnalytics();
    }

    setSelectedActions((currentActions) => (isSelected ? currentActions.filter((id) => id !== actionId) : [...currentActions, actionId]));
  }

  return (
    <PortalShell active="fix">
      <PortalTopBar title="Improve" />
      <div className="min-h-screen bg-[#050912] pb-28 text-white">
        <PageContent className="max-w-md space-y-5">
          <div className="flex items-center justify-between">
            <DashboardHeaderHomeControl className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl" iconClassName="size-5" onMenuClick={() => setShowProfile(true)} />
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
                  <span className="absolute right-1.5 top-1.5 grid min-w-5 place-items-center rounded-full bg-[#FF3B30] px-1.5 text-caption font-bold leading-5 text-white shadow-[0_6px_12px_rgba(255,59,48,0.28)]">
                  <AnimatedNumber value={notificationUnreadCount > 99 ? "99+" : notificationUnreadCount} />
                  </span>
                ) : null}
              </Link>
            </div>
          </div>
          <div className="space-y-1 pt-2">
            {/* <p className="text-tiny font-bold uppercase tracking-[0.18em] text-[#22F2C2]">Score Simulator</p> */}
            <h1 className="text-2xl font-black tracking-normal text-white">Score Improvement</h1>
          </div>

          <section className={cn("rounded-[2rem] p-4 text-white", reportHighlightCardClass)}>
            <div className="grid grid-cols-2 gap-3">
              <ScoreMetric label="Current Score" value={currentScore ? String(currentScore) : "--"} />
              <ScoreMetric label="Projected Score" value={projectedScore ? String(projectedScore) : "--"} tone={projectedScore ? scoreStatus.tone : undefined} />
            </div>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className={cn("text-3xl font-black", difference > 0 && "text-[#22F2C2]", difference < 0 && "text-[#FF3B30]", difference === 0 && "text-slate-300")}>
                  <AnimatedNumber value={`${formatSigned(difference)} pts`} />
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">{scoreStatusLabel}</p>
              </div>
              <div className={cn("grid size-12 place-items-center rounded-2xl border", difference >= 0 ? "border-[#22F2C2]/25 bg-[#22F2C2]/10 text-[#22F2C2]" : "border-rose-400/25 bg-rose-400/10 text-[#FF3B30]")}>
                {difference >= 0 ? <TrendingUp className="size-6" /> : <TrendingDown className="size-6" />}
              </div>
            </div>
          </section>

          <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
            {visibleImproveTabs.map((tab) => (
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
            <section className={cn("space-y-5 rounded-[2rem] p-4 text-white", reportHighlightCardClass)}>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-bold text-white">Credit Card Utilization</p>
                    <p className="mt-1 text-caption font-semibold text-[#22F2C2]">Keep utilization below 30%</p>
                  </div>
                  <span className="text-[32px] font-black leading-none text-white"><AnimatedNumber value={`${utilizationValue}%`} /></span>
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
                <div className="flex justify-between text-tiny font-bold text-[#77869B]">
                  <span><AnimatedNumber value="5%" /> Ideal</span>
                  <span><AnimatedNumber value="90%" /> Danger</span>
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
              displayData={displayData}
              onRepairDocumentsUploaded={loadRepairRequests}
              repairContent={repairContent}
              repairRequests={repairRequests}
              repairRequestsLoading={repairRequestsLoading}
              repairStatus={repairStatus}
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
      <p className="text-tiny font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={cn("mt-2 text-3xl font-black", tone)}><AnimatedNumber value={value} /></p>
    </div>
  );
}

function ActionRow({ action, checked, onChange }: { action: SimulatorAction; checked: boolean; onChange: () => void }) {
  return (
    <button className="flex w-full items-center justify-between gap-4 border-b border-white/10 py-4 text-left last:border-b-0" type="button" onClick={onChange}>
      <span className="min-w-0">
        <span className="block text-lg font-bold text-white">{action.title}</span>
        
      </span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full border transition", checked ? "border-[#22F2C2]/60 bg-[#22F2C2]/30" : "border-white/10 bg-slate-800")}>
        <span className={cn("absolute top-1 size-5 rounded-full bg-white transition", checked ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

function CreditImprovementPlan({
  displayData,
  onRepairDocumentsUploaded,
  repairContent,
  repairRequests,
  repairRequestsLoading,
  repairStatus,
}: {
  displayData: DisplayDataResponse | null;
  onRepairDocumentsUploaded: () => void;
  repairContent: CibilRepairContent;
  repairRequests: CibilRepairRequest[];
  repairRequestsLoading: boolean;
  repairStatus: CibilRepairStatus | null;
}) {
  const router = useRouter();
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [documentForms, setDocumentForms] = useState<Record<string, RepairDocumentForm>>({});
  const [uploadAccounts, setUploadAccounts] = useState<SelectedCibilRepairAccount[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const disputeStats = buildDisputeStats(repairStatus);
  const showDisputeCentre = hasRepairCounts(repairStatus);
  const plan = repairContent.plans.find((repairPlan) => repairPlan.isActive) ?? repairContent.plans[0] ?? null;
  const originalAmount = getOriginalAmount(plan?.amount, plan?.offerTag);
  const repairIssueCards = useMemo(() => buildRepairIssueCards(displayData), [displayData]);
  const selectedAccounts = useMemo(() => repairIssueCards.filter((card) => selectedIssueIds.includes(card.id)), [repairIssueCards, selectedIssueIds]);
  const selectedCount = selectedAccounts.length;

  function toggleIssueCard(issueId: string) {
    setSelectedIssueIds((currentIds) => (currentIds.includes(issueId) ? currentIds.filter((id) => id !== issueId) : [...currentIds, issueId]));
  }

  function updateDocumentForm(accountId: string, values: Partial<RepairDocumentForm>) {
    setDocumentForms((currentForms) => {
      const existingForm = currentForms[accountId] ?? {
        closingDate: "",
        error: "",
        file: null,
        remarks: "",
        uploaded: false,
        uploading: false,
      };

      return {
        ...currentForms,
        [accountId]: {
          ...existingForm,
          ...values,
        },
      };
    });
  }

  function openRepairDocumentUpload(request?: CibilRepairRequest) {
    const storedAccounts = readSelectedCibilRepairAccounts();
    const requestAccount = request ? readRepairRequestAccount(request) : null;
    const nextAccounts = storedAccounts.length ? storedAccounts : requestAccount ? [requestAccount] : [];

    setUploadAccounts(nextAccounts);
    setUploadDialogOpen(true);
  }

  async function uploadRepairDocuments() {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return false;
    }

    for (const account of uploadAccounts) {
      const form = documentForms[account.id];

      if (!form?.file) {
        updateDocumentForm(account.id, { error: "Document upload is required." });
        return false;
      }

      if (!form.closingDate) {
        updateDocumentForm(account.id, { error: "Closing date is required." });
        return false;
      }

      const validationError = validateRepairDocumentFile(form.file);

      if (validationError) {
        updateDocumentForm(account.id, { error: validationError });
        return false;
      }
    }

    for (const account of uploadAccounts) {
      const form = documentForms[account.id];

      if (!form || form.uploaded || !form.file) continue;

      updateDocumentForm(account.id, { error: "", uploading: true });

      const formData = new FormData();
      formData.append("accountType", account.accountType);
      formData.append(isCreditCardAccount(account.accountType) ? "creditCardNumber" : "loanNumber", account.accountNumber);
      formData.append("closingDate", form.closingDate);
      formData.append("remarks", form.remarks);
      formData.append("file", form.file);

      try {
        const response = await apiRequest("/api/credit-repair/documents", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const result = await response.json().catch(() => null);

        if (response.status === 401 || response.status === 403) {
          clearScorecareSession();
          router.replace("/login");
          return false;
        }

        if (!response.ok || result?.status !== "success") {
          updateDocumentForm(account.id, { error: result?.message || "Document upload failed.", uploading: false });
          return false;
        }

        updateDocumentForm(account.id, { uploaded: true, uploading: false });
      } catch {
        updateDocumentForm(account.id, { error: "Document upload failed.", uploading: false });
        return false;
      }
    }

    setUploadDialogOpen(false);
    onRepairDocumentsUploaded();
    return true;
  }

  async function continueToRepairSummary() {
    if (!selectedAccounts.length) return;

    writeSelectedCibilRepairAccounts(
      selectedAccounts.map((account) => ({
        id: account.id,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        accountStatus: account.accountStatus,
        currentBalance: account.currentBalance,
        issueType: account.issueType,
        issueLabels: account.issueLabels,
        rawAccount: account.rawAccount,
        subscriberName: account.subscriberName,
      })),
    );
    router.push("/dashboard/score-fix/cibil-repair-summary");
  }

  return (
    <div className="space-y-4">
      <section className={cn("overflow-hidden rounded-[2rem] text-white", reportHighlightCardClass)}>
        <div className="px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="whitespace-nowrap text-base font-bold uppercase leading-none">Credit Repair Service</h2>
            <div className="shrink-0 text-right">
              {typeof plan?.amount === "number" ? (
                <div>
                  {originalAmount ? <p className="text-title font-semibold leading-none text-[#9fb2c6] line-through"><AnimatedNumber value={formatINR(originalAmount)} /></p> : null}
                  {plan.offerTag ? <p className="mt-1 text-caption font-bold leading-none text-[#22F2C2]">Offer: {plan.offerTag}</p> : null}
                  <p className="mt-2 text-[24px] font-black leading-none text-white"><AnimatedNumber value={formatINR(plan.amount)} /></p>
                </div>
              ) : null}
            </div>
          </div>
          <p className="mt-2 text-caption leading-5 text-[#9fb2c6]">Expert review, disputes, lender follow-up, and score verification in one guided flow.</p>
        </div>
      </section>

      {/* <section className={cn("rounded-[1.75rem] p-4 text-white", reportCardClass)}>
        <p className="text-caption font-semibold uppercase tracking-[0.16em] text-[#1F756B]">Repair Timeline</p>
        <div className="mt-4 space-y-3">
          {repairContent.timelines.map((timeline) => (
            <div key={timeline.id} className={cn("flex gap-3 rounded-2xl p-3", reportMiniCardClass)}>
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#22F2C2]/12 text-caption font-bold text-[#22F2C2]">{timeline.displayOrder}</span>
              <div>
                <p className="text-sm font-semibold text-white">{timeline.title}</p>
                <p className="mt-1 text-caption leading-5 text-[#9fb2c6]">{timeline.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section> */}

      <section className={cn("rounded-[2rem] p-4 text-white", reportHighlightCardClass)}>
        <h2 className="text-base font-semibold text-white">Select issues to repair</h2>
        <p className="mt-1 text-body leading-5 text-[#9fb2c6]">Choose the accounts you want us to review and repair.</p>
        <RepairIssueCards cards={repairIssueCards} selectedIds={selectedIssueIds} onToggle={toggleIssueCard} />
      </section>

      {showDisputeCentre ? (
        <section className={cn("rounded-[2rem] p-4 text-white", reportHighlightCardClass)}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-body font-bold uppercase tracking-[0.16em] text-[#1F756B]">Dispute Centre</p>
              <h2 className="mt-1 text-lg font-semibold">Case progress</h2>
            </div>
            <span className="rounded-full bg-[#FF3B30] px-3 py-1 text-body font-semibold text-[#ffff]">Live</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {disputeStats.map((stat) => (
              <div key={stat.label} className={cn("rounded-2xl px-3 py-3", reportMiniCardClass)}>
                <p className="text-lg font-semibold"><AnimatedNumber value={stat.value} /></p>
                <p className="mt-1 text-body leading-3 text-[#9fb2c6]">{stat.label}</p>
              </div>
            ))}
          </div>

          <RepairRequestsTable loading={repairRequestsLoading} requests={repairRequests} status={repairStatus} onUploadDocuments={openRepairDocumentUpload} />
          <RepairDisputeCards loading={repairRequestsLoading} requests={repairRequests} status={repairStatus} />
        </section>
      ) : null}

      <div className="sticky bottom-24 z-20 rounded-2xl border border-[#0D5A3F]/70 bg-[#071812]/95 p-4 shadow-[0_18px_36px_rgba(0,0,0,0.42)] backdrop-blur">
        <button
          className={cn(
            "h-12 w-full rounded-2xl text-sm font-black transition",
            selectedCount ? "bg-[linear-gradient(135deg,#22F2C2,#13B98F)] text-[#04120e] shadow-[0_14px_28px_rgba(34,242,194,0.22)]" : "cursor-not-allowed bg-white/10 text-[#6F7B8E]",
          )}
          disabled={!selectedCount}
          type="button"
          onClick={continueToRepairSummary}
        >
          Continue
        </button>
      </div>
      {uploadDialogOpen ? (
        <RepairDocumentUploadDialog
          accounts={uploadAccounts}
          forms={documentForms}
          submitting={uploadAccounts.some((account) => documentForms[account.id]?.uploading)}
          onChange={updateDocumentForm}
          onClose={() => setUploadDialogOpen(false)}
          onSubmit={uploadRepairDocuments}
        />
      ) : null}
    </div>
  );
}

function RepairIssueCards({ cards, selectedIds, onToggle }: { cards: RepairIssueCard[]; selectedIds: string[]; onToggle: (issueId: string) => void }) {
  if (!cards.length) {
    return (
      <div className={cn("mt-4 rounded-2xl p-4", reportMiniCardClass)}>
        <p className="text-sm font-semibold text-white">No repair issues found</p>
        <p className="mt-1 text-caption leading-5 text-[#9fb2c6]">Your report has no overdue, settled, written-off, suit-filed, or negative accounts.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {cards.map((card) => {
        const selected = selectedIds.includes(card.id);

        return (
          <button
            className={cn(
              "w-full rounded-2xl border p-4 text-left transition",
              selected ? "border-[#22F2C2] bg-[#0B2B23] shadow-[0_0_22px_rgba(34,242,194,0.18)]" : "border-[#0D5A3F]/55 bg-[linear-gradient(135deg,rgba(9,45,31,0.76),rgba(18,34,24,0.72))]",
            )}
            key={card.id}
            type="button"
            onClick={() => onToggle(card.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-bold text-white">{card.subscriberName}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {card.issueLabels.map((label) => (
                    <span key={label} className="rounded-full bg-[#22F2C2]/12 px-2 py-1 text-body font-bold text-[#22F2C2]">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <span className={cn("grid size-6 shrink-0 place-items-center rounded-md border", selected ? "border-[#22F2C2] bg-[#22F2C2] text-[#04120e]" : "border-white/25 text-transparent")}>✓</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-body">
              {card.currentBalance > 0 ? (
                <div>
                  <p className="text-[#7792aa]">Current balance</p>
                  <p className="mt-1 font-bold text-white"><AnimatedNumber value={formatINR(card.currentBalance)} /></p>
                </div>
              ) : null}
              {card.overdueAmount > 0 ? (
                <div>
                  <p className="text-[#7792aa]">Amount Past Due</p>
                  <p className="mt-1 font-bold text-white"><AnimatedNumber value={formatINR(card.overdueAmount)} /></p>
                </div>
              ) : null}
              <div>
                <p className="text-[#7792aa]">Account number</p>
                <p className="mt-1 font-bold text-white">{maskAccountNumber(card.accountNumber)}</p>
              </div>
              <div>
                <p className="text-[#7792aa]">Status</p>
                <p className="mt-1 font-bold text-white">{card.accountStatus || "--"}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function maskAccountNumber(accountNumber: string) {
  if (!accountNumber) return "--";

  if (/x/i.test(accountNumber)) return accountNumber;

  return accountNumber.length > 4 ? `${"X".repeat(Math.max(accountNumber.length - 4, 3))}${accountNumber.slice(-4)}` : accountNumber;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value).trim();
}

function RepairDisputeCards({ loading, requests, status }: { loading: boolean; requests: CibilRepairRequest[]; status: CibilRepairStatus | null }) {
  const disputes = requests.filter(hasDisputeData);

  if (loading) {
    return <div className={cn("mt-4 h-20 animate-pulse rounded-2xl", reportMiniCardClass)} />;
  }

  if (!disputes.length && !status?.activeDisputes) {
    return (
      <div className={cn("mt-4 rounded-2xl p-3", reportMiniCardClass)}>
        <p className="text-xs font-semibold">No active disputes found</p>
        <p className="mt-1 text-caption leading-5 text-[#9fb2c6]">You currently have no dispute cases associated with this credit report.</p>
      </div>
    );
  }

  if (!disputes.length) return null;

  return (
    <div className="mt-4 space-y-3">
      {disputes.map((dispute) => (
        <div key={getDisputeId(dispute)} className={cn("rounded-2xl p-3", reportMiniCardClass)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold">{getDisputeId(dispute)}</p>
              <p className="mt-1 text-caption text-[#9fb2c6]">{dispute.lenderName || "--"}</p>
              <p className="mt-1 text-caption text-[#9fb2c6]">Created {formatDisputeCreatedDate(dispute)}</p>
            </div>
            <span className="rounded-full bg-[#1F756B]/12 px-2.5 py-1 text-caption font-semibold capitalize text-[#1F756B]">{dispute.repairStatus || dispute.paymentStatus || "--"}</span>
          </div>
          {readDisputeProgress(dispute) ? <p className="mt-3 text-caption font-semibold text-[#1F756B]">Progress <AnimatedNumber value={readDisputeProgress(dispute)} /></p> : null}
        </div>
      ))}
    </div>
  );
}

function RepairRequestsTable({
  loading,
  onUploadDocuments,
  requests,
  status,
}: {
  loading: boolean;
  onUploadDocuments: (request: CibilRepairRequest) => void;
  requests: CibilRepairRequest[];
  status: CibilRepairStatus | null;
}) {
  const hasRecords = hasRepairCounts(status);

  return (
    <div className={cn("mt-4 overflow-hidden rounded-2xl", reportMiniCardClass)}>
      <div className="grid grid-cols-[1.1fr_0.8fr_1fr] border-b border-white/10 px-3 py-2 text-caption font-semibold uppercase tracking-[0.12em] text-[#9fb2c6]">
        <span>Date/Time</span>
        <span>Status</span>
        <span>Remarks</span>
      </div>
      {loading ? (
        <div className="grid gap-2 px-3 py-3">
          <div className="h-3 animate-pulse rounded-full bg-white/10" />
          <div className="h-3 w-10/12 animate-pulse rounded-full bg-white/10" />
        </div>
      ) : hasRecords && requests.length ? (
        requests.map((request) => {
          const statusLabel = request.repairStatus || request.paymentStatus || "--";

          return (
            <div key={request.publicId ?? request.id} className="grid grid-cols-[1.1fr_0.8fr_1fr] gap-2 border-b border-white/8 px-3 py-2 text-caption text-white last:border-b-0">
              <span className="text-[#c8d3e2]">{formatRepairRequestDate(request)}</span>
              {isUploadDocumentStatus(statusLabel) ? (
                <button className="inline-flex w-fit items-center gap-1 rounded-full bg-[#22F2C2]/12 px-2 py-1 font-semibold text-[#22F2C2]" type="button" onClick={() => onUploadDocuments(request)}>
                  <Upload className="size-3" />
                  Upload
                </button>
              ) : (
                <span className="font-semibold capitalize text-[#1F756B]">{statusLabel}</span>
              )}
              <span className="text-[#9fb2c6]">{request.remarks || "--"}</span>
            </div>
          );
        })
      ) : (
        <p className="px-3 py-3 text-caption text-[#9fb2c6]">No records found.</p>
      )}
    </div>
  );
}

function RepairDocumentUploadDialog({
  accounts,
  forms,
  onChange,
  onClose,
  onSubmit,
  submitting,
}: {
  accounts: SelectedCibilRepairAccount[];
  forms: Record<string, RepairDocumentForm>;
  onChange: (accountId: string, values: Partial<RepairDocumentForm>) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto overflow-x-hidden bg-[#050912] text-white backdrop-blur-md">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5">
        <div className="rounded-[28px] border border-[#00CFA4]/25 bg-[radial-gradient(circle_at_100%_0%,rgba(34,242,194,0.12),transparent_34%),linear-gradient(145deg,#061A13,#082519)] p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-[#22F2C2]">
              <Upload className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-caption font-black uppercase tracking-[0.22em] text-[#22F2C2]">Upload Documents</p>
              <h2 className="mt-2 text-lg font-black tracking-tight text-white">Repair documents</h2>
              <p className="mt-1 text-caption text-[#AAB6C8]">Upload documents for the selected accounts.</p>
            </div>
            <button aria-label="Close upload documents" className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-white" type="button" onClick={onClose}>
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {accounts.length ? accounts.map((account) => {
            const form = forms[account.id];
            const numberLabel = isCreditCardAccount(account.accountType) ? "Credit card number" : "Loan number";

            return (
              <section key={account.id} className="rounded-[24px] border border-[#1F756B]/25 bg-[linear-gradient(145deg,#09131F,#0D1827)] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.24)]">
                <p className="text-sm font-black text-white">{account.subscriberName}</p>
                <div className="mt-4 space-y-4">
                  <RepairDocumentField label={numberLabel}>
                    <input className="h-12 w-full rounded-[18px] border border-white/10 bg-[#101B2B] px-4 text-body font-medium text-white outline-none" readOnly value={account.accountNumber} />
                  </RepairDocumentField>
                  <RepairDocumentField label="Document" required>
                    <label className="grid min-h-28 cursor-pointer place-items-center rounded-[20px] border border-dashed border-[#22F2C2]/30 bg-[#0A1725] px-4 text-center text-[#AAB6C8]">
                      <input
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        className="sr-only"
                        required
                        type="file"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          onChange(account.id, { error: file ? validateRepairDocumentFile(file) : "", file, uploaded: false });
                        }}
                      />
                      <span className="w-full min-w-0">
                        <Upload className="mx-auto size-8 text-[#22F2C2]" />
                        <span className="mt-3 block truncate text-xs font-bold text-white">{form?.file?.name || "Choose document"}</span>
                        <span className="mt-2 block text-caption text-[#AAB6C8]">PDF, JPG, JPEG, or PNG. Max 5MB.</span>
                      </span>
                    </label>
                  </RepairDocumentField>
                  <RepairDocumentField label="Closing date" required>
                    <input className="h-12 w-full rounded-[18px] border border-white/10 bg-[#101B2B] px-4 text-body font-medium text-white outline-none" required type="date" value={form?.closingDate ?? ""} onChange={(event) => onChange(account.id, { closingDate: event.target.value, uploaded: false })} />
                  </RepairDocumentField>
                  <RepairDocumentField label="Remarks">
                    <textarea className="min-h-24 w-full resize-none rounded-[18px] border border-white/10 bg-[#101B2B] px-4 py-3 text-body font-medium text-white outline-none" value={form?.remarks ?? ""} onChange={(event) => onChange(account.id, { remarks: event.target.value, uploaded: false })} />
                  </RepairDocumentField>
                  {form?.error ? <p className="rounded-2xl border border-[#FF5C8A]/25 bg-[#FF5C8A]/10 px-4 py-3 text-sm font-medium text-[#FF8AAB]">{form.error}</p> : null}
                </div>
              </section>
            );
          }) : (
            <section className="rounded-[24px] border border-[#1F756B]/25 bg-[linear-gradient(145deg,#09131F,#0D1827)] p-5">
              <p className="text-sm font-semibold text-white">No selected accounts found.</p>
            </section>
          )}
        </div>

        <div className="mt-5 grid gap-3 border-t border-white/10 pt-4">
          <button className="h-12 rounded-[18px] bg-[linear-gradient(135deg,#08DB69,#22F2C2)] text-sm font-black text-[#031812] shadow-[0_12px_28px_rgba(8,219,105,0.28)] disabled:opacity-60" disabled={submitting || !accounts.length} type="button" onClick={onSubmit}>
            {submitting ? (
              <span className="inline-flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" /> Uploading...</span>
            ) : (
              "Submit documents"
            )}
          </button>
          <button className="h-12 rounded-[18px] border border-white/10 bg-white/[0.05] text-sm font-bold text-[#AAB6C8]" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function RepairDocumentField({ children, label, required }: { children: React.ReactNode; label: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-caption font-semibold text-[#DDE7F4]">
        {label} {required ? <span className="text-[#FF5C8A]">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function readRepairStatus(data: unknown): CibilRepairStatus | null {
  if (!data || typeof data !== "object") return null;

  const status = data as CibilRepairStatus;

  return {
    activeDisputes: toNumber(status.activeDisputes),
    resolvedDisputes: toNumber(status.resolvedDisputes),
    pointsGained: toNumber(status.pointsGained),
  };
}

function hasRepairCounts(status: CibilRepairStatus | null) {
  return Boolean((status?.activeDisputes ?? 0) || (status?.resolvedDisputes ?? 0) || (status?.pointsGained ?? 0));
}

function isUploadDocumentStatus(status: string) {
  return status.toLowerCase().replace(/[\s-]+/g, "_") === "upload_document";
}

function readRepairRequestAccount(request: CibilRepairRequest): SelectedCibilRepairAccount | null {
  const accountNumber = readString(request.accountNumber);
  const accountType = readString(request.accountType) || "Loan";
  const subscriberName = readString(request.bankName ?? request.lenderName);

  if (!accountNumber || !subscriberName) return null;

  return {
    id: request.publicId || request.id || `${subscriberName.toLowerCase()}-${accountNumber}`,
    accountNumber,
    accountType,
    accountStatus: readString(request.repairStatus ?? request.paymentStatus) || "--",
    currentBalance: 0,
    issueType: readString(request.issueType),
    issueLabels: request.issueType ? [String(request.issueType)] : [],
    rawAccount: {},
    subscriberName,
  };
}

function isCreditCardAccount(accountType: string) {
  return accountType.toLowerCase().includes("credit card") || accountType === "10" || accountType === "31" || accountType === "35" || accountType === "36";
}

function getRepairDocumentType(accountType: string) {
  return isCreditCardAccount(accountType) ? "Credit card closure proof" : "Loan closure proof";
}

function validateRepairDocumentFile(file: File) {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
  const hasAllowedType = allowedTypes.includes(file.type);
  const hasAllowedExtension = allowedExtensions.some((extension) => file.name.toLowerCase().endsWith(extension));

  if (!hasAllowedType && !hasAllowedExtension) {
    return "Only PDF, JPG, JPEG, or PNG files are allowed.";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "File size must be 5MB or less.";
  }

  return "";
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

  return { label: "Poor", tone: "text-[#FF3B30]" };
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
