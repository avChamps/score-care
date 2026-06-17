"use client";

import {
  BadgeIndianRupee,
  Bell,
  CheckCircle2,
  Clock3,
  CreditCard,
  Crown,
  Download,
  FileSearch,
  Gauge,
  LoaderCircle,
  ReceiptText,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfilePanel, type UserProfile } from "@/app/dashboard/home-dashboard";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import {
  AppCard,
  DashboardHeaderHomeControl,
  PageContent,
  PortalShell,
  PortalTopBar,
  PrimaryPortalButton,
} from "@/components/dashboard/portal-ui";
import { SubscribePromptOverlay, useSubscribePrompt } from "@/components/dashboard/subscribe-prompt";
import { apiFetch, apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { CibilDisplayDataError, getCachedCibilDisplayData, getStoredLatestCibilScoreCheckData } from "@/lib/cibil-display-cache";
import { useSubscriptionAccess } from "@/lib/subscription-access";
import { trackEvent } from "@/src/lib/analytics";
import { cn } from "@/lib/utils";

type Tab = "accounts" | "enquiries";
type AccountFilter = "accounts" | "loans" | "cards";

type CreditAccount = {
  "LOAN-DETAILS"?: {
    "ACCOUNT-STATUS"?: string | number | null;
    "ACCT-TYPE"?: string | number | null;
  } | null;
  Account_Status?: string | number | null;
  Account_Type?: string | number | null;
  Portfolio_Type?: string | null;
  account_status?: string | number | null;
  member_name?: string | null;
  type?: string | null;
  current_balance?: string | number | null;
  high_credit_amount?: string | number | null;
  amount_overdue?: string | number | null;
  emi?: string | number | null;
  opened?: string | null;
  account_closed?: string | null;
  last_payment?: string | null;
  CAIS_Account_History?: PaymentHistoryItem[] | null;
  payment_history?: string[] | null;
  payment_frequency?: string | null;
  payment_history_details?: PaymentHistoryItem[] | null;
  portfolio_type?: string | null;
  rate_of_interest?: string | number | null;
  repayment_tenure?: string | number | null;
  reported_and_certified?: string | null;
};

type CrifLoanDetails = Record<string, unknown> & {
  "ACCOUNT-STATUS"?: string | number | null;
  "ACCT-TYPE"?: string | number | null;
  "ACTUAL-PAYMENT"?: string | number | null;
  "CLOSED-DATE"?: string | null;
  "CREDIT-GUARANTOR"?: string | null;
  "CREDIT-LIMIT"?: string | number | null;
  "CURRENT-BAL"?: string | number | null;
  "DISBURSED-AMT"?: string | number | null;
  "DISBURSED-DT"?: string | null;
  "INSTALLMENT-AMT"?: string | number | null;
  "LAST-PAYMENT-DATE"?: string | null;
  "OBLIGATION"?: string | number | null;
  "OVERDUE-AMT"?: string | number | null;
  "REPAYMENT-TENURE"?: string | number | null;
};

type CrifResponse = {
  "LOAN-DETAILS"?: CrifLoanDetails | CrifLoanDetails[] | null;
};

type PaymentHistoryItem = {
  Asset_Classification?: string | number | null;
  Days_Past_Due?: string | number | null;
  Month?: string | number | null;
  Year?: string | number | null;
};

type CreditEnquiry = {
  enquiry_kind?: string | null;
  enquiry_type?: string | null;
  member?: string | null;
  enquiry_date?: string | null;
  enquiry_purpose?: string | null;
  enquiry_amount?: string | number | null;
};

type DisplayDataResponse = {
  fetchedAt?: string | null;
  data?: {
    report?: {
      credit_score?: string | number | null;
      has_pdf?: boolean;
      download_url?: string | null;
    };
    credit_score?: string | number | null;
    display?: {
      profile?: {
        name?: string | null;
        fetched_at?: string | null;
      };
      score?: {
        value?: string | number | null;
        factors?: string[] | null;
        range?: string | null;
      };
      accounts?: CreditAccount[] | null;
      enquiries?: CreditEnquiry[] | null;
    };
    credit_report?: {
      RESPONSES?: {
        RESPONSE?: CrifResponse | CrifResponse[] | null;
      };
    };
  };
};

const CRIF_CLOSED_STATUS = "Closed";

type BehaviourItem = {
  title: string;
  value: string;
  rating: string;
  body: string;
  tone: "good" | "warn" | "danger" | "neutral";
};

type ReportAccountItem = {
  details: { label: string; value: string }[];
  history: PaymentHistoryItem[];
  id: string;
  impact: "High impact" | "Medium impact";
  impactTone: string;
  lender: string;
  loanType: string;
  opened: string;
  status: "On Time" | "Overdue" | "Closed";
  statusTone: string;
};

type ReportEnquiryItem = {
  amount?: string;
  date: string;
  id: string;
  kind: "Hard" | "Soft";
  lender: string;
  loanType: string;
  message: string;
  sortTime: number;
};

type AiAnswerBlock = {
  text: string;
  type: "heading" | "paragraph" | "list";
};

const predictorActions = [
  {
    id: "new-loan",
    title: "Get a new loan or credit card",
    Icon: BadgeIndianRupee,
    impact: -18,
    tone: "warn",
  },
  {
    id: "miss-emi",
    title: "Miss an EMI or bill payment",
    Icon: WalletCards,
    impact: -82,
    tone: "danger",
  },
  {
    id: "repay-loan",
    title: "Repay loan or clear bills",
    Icon: ReceiptText,
    impact: 42,
    tone: "good",
  },
  {
    id: "close-card",
    title: "Close your oldest credit card",
    Icon: CreditCard,
    impact: -34,
    tone: "warn",
  },
  {
    id: "high-usage",
    title: "High credit usage",
    Icon: Gauge,
    impact: -46,
    tone: "warn",
  },
  {
    id: "inquiries",
    title: "Make credit inquiries",
    Icon: CreditCard,
    impact: -22,
    tone: "warn",
  },
] as const;

const accountTypeLabels: Record<string, string> = {
  "1": "Auto Loan",
  "2": "Home Loan",
  "3": "Loan Against Property",
  "4": "Loan Against Shares",
  "5": "Personal Loan",
  "6": "Consumer Loan",
  "7": "Gold Loan",
  "8": "Education Loan",
  "9": "Business Loan",
  "10": "Credit Card",
  "13": "Auto Loan",
  "17": "Auto Loan",
  "31": "Credit Card",
  "35": "Credit Card",
  "36": "Credit Card",
  "37": "Business Loan",
  "51": "Business Loan",
  "52": "Business Loan",
  "53": "Business Loan",
  "54": "Business Loan",
  "55": "Business Loan",
  "56": "Business Loan",
  "57": "Business Loan",
  "58": "Business Loan",
  "59": "Business Loan",
  "61": "Business Loan",
};

const enquiryPurposeLabels: Record<string, string> = {
  "1": "Auto Loan",
  "2": "Home Loan",
  "5": "Personal Loan",
  "6": "Consumer Loan",
  "7": "Gold Loan",
  "9": "Business Loan",
  "10": "Credit Card",
  "13": "Auto Loan",
  "17": "Auto Loan",
  "31": "Credit Card",
  "35": "Credit Card",
  "36": "Credit Card",
  "37": "Business Loan",
  "51": "Business Loan",
  "52": "Business Loan",
  "53": "Business Loan",
  "54": "Business Loan",
  "55": "Business Loan",
  "56": "Business Loan",
  "57": "Business Loan",
  "58": "Business Loan",
  "59": "Business Loan",
  "61": "Business Loan",
};

const fallbackReportAccounts: ReportAccountItem[] = [
  {
    details: [],
    history: [],
    id: "fallback-hdfc",
    impact: "High impact",
    impactTone: "border border-[#FFD34D]/25 bg-[#FFD34D]/14 text-[#FFD34D]",
    lender: "HDFC Bank",
    loanType: "Personal Loan",
    opened: "13 Jun 2026",
    status: "On Time",
    statusTone: "bg-[#22F2C2]/12 text-[#22F2C2]",
  },
  {
    details: [],
    history: [],
    id: "fallback-sbi",
    impact: "Medium impact",
    impactTone: "bg-[#ffd166]/14 text-[#ffd166]",
    lender: "SBI",
    loanType: "Home Loan",
    opened: "11 May 2025",
    status: "Overdue",
    statusTone: "bg-[#FF5C8A]/12 text-[#FF5C8A]",
  },
  {
    details: [],
    history: [],
    id: "fallback-axis",
    impact: "High impact",
    impactTone: "border border-[#FFD34D]/25 bg-[#FFD34D]/14 text-[#FFD34D]",
    lender: "Axis Bank",
    loanType: "Credit Card",
    opened: "04 Feb 2024",
    status: "On Time",
    statusTone: "bg-[#22F2C2]/12 text-[#22F2C2]",
  },
  {
    details: [],
    history: [],
    id: "fallback-icici",
    impact: "Medium impact",
    impactTone: "bg-[#ffd166]/14 text-[#ffd166]",
    lender: "ICICI Bank",
    loanType: "Auto Loan",
    opened: "22 Aug 2023",
    status: "Closed",
    statusTone: "bg-[#7895ff]/14 text-[#aebcff]",
  },
];

const notificationsPageSize = 10;

const reportCardClass =
  "border border-[#103A2B]/50 bg-[linear-gradient(135deg,#06120E_0%,#081712_50%,#091813_100%)] shadow-[0_20px_45px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.02)]";
const reportHighlightCardClass = "border border-[#0F5D43]/60 bg-[radial-gradient(circle_at_84%_0%,rgba(34,242,194,0.09),transparent_36%),linear-gradient(135deg,rgba(8,54,37,0.98),rgba(9,38,25,0.98))] shadow-[0_0_34px_rgba(34,242,194,0.07),0_18px_40px_rgba(0,0,0,0.32)] backdrop-blur-xl";
const reportMiniCardClass = "border border-[#0D5A3F]/55 bg-[linear-gradient(135deg,rgba(9,45,31,0.76),rgba(18,34,24,0.72))]";
const reportSectionHeadingClass = "px-1 text-caption font-extrabold uppercase tracking-[0.18em] text-[#B9C7D8]";

export function CreditScoreExperience() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("accounts");
  const [activeAccountFilter, setActiveAccountFilter] = useState<AccountFilter>("accounts");
  const [displayData, setDisplayData] = useState<DisplayDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [selectedActions] = useState<string[]>([]);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [scoreHelpAnswer, setScoreHelpAnswer] = useState("");
  const [scoreHelpError, setScoreHelpError] = useState("");
  const [scoreHelpLoading, setScoreHelpLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [, setIsLanguageLoading] = useState(false);
  const [toast, setToast] = useState("");
  const { isFreeTier, loading: accessLoading } = useSubscriptionAccess();
  const { closeSubscribePrompt, promptSubscribe, showSubscribePrompt } = useSubscribePrompt();

  const score = readScore(displayData);
  const lastChecked = readLastChecked(displayData);
  const accounts = useMemo(() => readReportAccounts(displayData), [displayData]);
  const enquiries = displayData?.data?.display?.enquiries ?? [];
  const accountSummary = useMemo(() => buildAccountSummary(accounts), [accounts]);
  const storedProfileName = typeof window !== "undefined" ? localStorage.getItem("scorecare_full_name")?.trim() : "";
  const profileName = profile?.fullName?.trim() || displayData?.data?.display?.profile?.name?.trim() || storedProfileName || "there";
  const baseScore = score ?? 300;
  const predictedScore = useMemo(() => {
    const impact = predictorActions
      .filter((action) => selectedActions.includes(action.id))
      .reduce((total, action) => total + action.impact, 0);

    return Math.min(900, Math.max(300, baseScore + impact));
  }, [baseScore, selectedActions]);

  const loadDisplayData = useCallback(async () => {
    if (accessLoading) {
      return;
    }

    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    if (isFreeTier) {
      setDisplayData(getStoredLatestCibilScoreCheckData(token) as DisplayDataResponse | null);
      setError("");
      setLoading(false);
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

      setError(cachedResult ? "" : "Could not load your latest CIBIL report data.");
      setDisplayData(cachedResult);
    } finally {
      setLoading(false);
    }
  }, [accessLoading, isFreeTier, router]);

  useEffect(() => {
    if (!toast) return;

    const toastTimer = window.setTimeout(() => setToast(""), 3000);

    return () => {
      window.clearTimeout(toastTimer);
    };
  }, [toast]);

  useEffect(() => {
    if (loading || accessLoading) {
      return;
    }

    void trackEvent("credit_report_viewed", {
      page_name: "credit_report",
      report_available: Boolean(displayData),
      subscription_status: isFreeTier ? "free" : "paid",
    });
  }, [accessLoading, displayData, isFreeTier, loading]);

  useEffect(() => {
    function handleDisplayUpdate(event: Event) {
      if (isFreeTier) {
        return;
      }

      const displayEvent = event as CustomEvent<DisplayDataResponse>;

      setDisplayData(displayEvent.detail);
      setError("");
      setLoading(false);
    }

    window.addEventListener("scorecare:cibil-display-updated", handleDisplayUpdate);
    const loadTimer = window.setTimeout(() => {
      void loadDisplayData();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
      window.removeEventListener("scorecare:cibil-display-updated", handleDisplayUpdate);
    };
  }, [isFreeTier, loadDisplayData]);

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

  useEffect(() => {
    function refreshCreditScoreScreen() {
      void loadDisplayData();
    }

    window.addEventListener("scorecare:app-refresh", refreshCreditScoreScreen);

    return () => window.removeEventListener("scorecare:app-refresh", refreshCreditScoreScreen);
  }, [loadDisplayData]);

  async function downloadReport() {
    if (downloading) return;

    if (isFreeTier) {
      promptSubscribe();
      return;
    }

    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    setDownloading(true);
    setError("");

    try {
      const response = await apiFetch("/credit-reports/cibil/download-report", {
        method: "GET",
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
        throw new Error("Unable to download report");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = getReportFileName(response.headers.get("content-disposition"));
      link.click();
      URL.revokeObjectURL(url);
      void trackEvent("pdf_report_downloaded", {
        page_name: "credit_report",
        report_available: true,
      });
    } catch {
      setError("Could not download your CIBIL report. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function refreshCachedScore() {
    if (loading) return;

    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await wait(3000);
      setDisplayData((currentData) => (getStoredLatestCibilScoreCheckData(token) as DisplayDataResponse | null) ?? currentData);
    } finally {
      setLoading(false);
    }
  }

  async function predictScoreWithAiHelp() {
    if (scoreHelpLoading) return;

    if (isFreeTier) {
      promptSubscribe();
      return;
    }

    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    setScoreHelpAnswer("");
    setScoreHelpError("");
    setScoreHelpLoading(true);
    setShowScoreInfo(true);

    try {
      const response = await apiRequest("/ai/gemini", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          message: buildCreditScoreAiPrompt({
            displayData,
            predictedScore,
          }),
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(readAiMessage(result) || "Unable to load AI help");
      }

      setScoreHelpAnswer(readAiMessage(result) || "A credit score is a simple number that helps lenders understand how reliably you have handled credit in the past.");
    } catch {
      setScoreHelpError("Could not load AI help right now. Please try again.");
    } finally {
      setScoreHelpLoading(false);
    }
  }

  function handleAccountFilterClick(filter: AccountFilter) {
    if (!accessLoading && isFreeTier && (filter === "loans" || filter === "cards")) {
      promptSubscribe();
      return;
    }

    setActiveTab("accounts");
    setActiveAccountFilter(filter);
  }

  function handleReportTabClick(tab: Tab) {
    if (!accessLoading && isFreeTier && tab === "enquiries") {
      promptSubscribe();
      return;
    }

    setActiveTab(tab);
  }

  return (
    <PortalShell active="score">
      <div className="min-h-screen bg-[#050912] pb-28 text-white">
        <PortalTopBar title="Credit Report" />
        <PageContent className="px-4 py-5">
          <div className="mx-auto max-w-md">
            <div className="mb-5 flex items-center justify-between">
              <DashboardHeaderHomeControl className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl" iconClassName="size-5" onMenuClick={() => setShowProfile(true)} />
              <div className="flex items-center gap-3">
                {isFreeTier ? (
                  <button
                    aria-label="Premium benefits"
                    className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-[#FFD34D] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl"
                    type="button"
                    onClick={promptSubscribe}
                  >
                    <Crown className="size-6 fill-[#FFD34D]/20" strokeWidth={1.8} />
                  </button>
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

            <div className={cn("rounded-[2rem] p-4 text-white", reportHighlightCardClass)}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#1F756B]">Credit Report</p>
                <h1 className="mt-1 text-lg font-semibold tracking-tight">Report Insights</h1>
                <p className="mt-1 text-caption text-[#9fb2c6]">
                  Updated {loading ? "Loading..." : lastChecked ?? "--"}
                </p>
              </div>
              <button
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#08DB69] px-3 text-tiny font-semibold text-white shadow-[0_14px_28px_rgba(255,77,125,0.26)] disabled:opacity-55"
                type="button"
                onClick={downloadReport}
                disabled={downloading}
              >
                {downloading ? <LoaderCircle className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                {downloading ? "Loading" : "PDF"}
              </button>
            </div>

            {error ? <p className="mt-3 rounded-2xl bg-[#ff4d7d]/10 px-3 py-2 text-caption font-medium text-[#ff8cab]">{error}</p> : null}

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-[1.35rem] border border-[#0F5D43]/45 bg-[#102017]/70 p-1.5">
              {(["accounts", "enquiries"] as Tab[]).map((tab) => (
                <TabButton key={tab} active={activeTab === tab} onClick={() => handleReportTabClick(tab)}>
                  {toTitleCase(tab)}
                </TabButton>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {accountSummary.map((item) => (
                <button
                  key={item.filter}
                  className={cn(
                    "min-h-[84px] rounded-[1.35rem] px-3 py-3 text-left transition",
                    activeTab === "accounts" && activeAccountFilter === item.filter
                      ? "border border-[#00CFA4]/55 bg-[linear-gradient(135deg,rgba(0,173,132,0.36),rgba(8,73,48,0.74))] text-[#00D5A7] shadow-[0_0_24px_rgba(34,242,194,0.10)]"
                      : "border border-[#0F5D43]/35 bg-[rgba(21,38,27,0.82)] text-white",
                  )}
                  type="button"
                  onClick={() => handleAccountFilterClick(item.filter)}
                >
                  <p className="text-3xl font-black leading-none"><AnimatedNumber value={item.value} /></p>
                  <p className={cn("mt-2 text-caption font-semibold", activeTab === "accounts" && activeAccountFilter === item.filter ? "text-[#8AF1D4]/75" : "text-[#8FA89F]")}>{item.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 animate-[creditPanelIn_0.42s_ease-out]">
            {activeTab === "accounts" ? (
              <ReportAccountsTab accounts={accounts} activeFilter={activeAccountFilter} loading={loading} />
            ) : (
              <ReportEnquiriesTab enquiries={enquiries} loading={loading} />
            )}
          </div>
        </div>
        </PageContent>

        <DashboardBottomNav />
      </div>
      {toast ? (
        <div className="fixed left-4 right-4 top-4 z-[10000] mx-auto max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700 shadow-[0_14px_34px_rgba(16,185,129,0.22)]">
          {toast}
        </div>
      ) : null}
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
      {showScoreInfo ? (
        <ScoreInfoDialog
          aiAnswer={scoreHelpAnswer}
          aiError={scoreHelpError}
          aiLoading={scoreHelpLoading}
          onClose={() => setShowScoreInfo(false)}
        />
      ) : null}
    </PortalShell>
  );
}

function ScoreInfoDialog({
  aiAnswer,
  aiError,
  aiLoading,
  onClose,
}: {
  aiAnswer: string;
  aiError: string;
  aiLoading: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 pb-24 pt-5 backdrop-blur-sm animate-[creditPanelIn_0.2s_ease-out] sm:py-5">
      <div className="flex max-h-[calc(100dvh-8rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] sm:max-h-[calc(100dvh-2.5rem)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-600">About CIBIL Score</p>
            <h2 className="mt-1 text-base font-bold text-slate-950">Your credit health number</h2>
          </div>
          <button
            aria-label="Close CIBIL score information"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            type="button"
            onClick={onClose}
          >
            <XCircle className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-scroll px-5 py-4 text-xs leading-5 text-slate-600 [scrollbar-gutter:stable] [scrollbar-width:thin]">
          {aiLoading ? (
            <AiLoadingState />
          ) : aiError ? (
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
              <p className="font-bold">AI help unavailable</p>
              <p className="mt-1">{aiError}</p>
            </div>
          ) : aiAnswer ? (
            <AiAnswerContent answer={aiAnswer} />
          ) : (
            <AiLoadingState />
          )}
          {!aiLoading && aiAnswer ? (
            <div className="mt-3 rounded-2xl bg-slate-50 p-3">
              <p className="font-bold text-slate-800">Quick guide</p>
              <p className="mt-1">750+ is generally considered strong, 650-749 is moderate, and lower scores may need improvement.</p>
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-100 bg-white px-5 py-4">
          <button
            className="h-10 w-full rounded-full bg-cyan-600 text-xs font-bold text-white shadow-lg shadow-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-700"
            type="button"
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function AiLoadingState() {
  return (
    <div className="grid min-h-64 place-items-center py-4 text-center">
      <div className="w-full max-w-[16rem]">
        <div className="relative mx-auto grid size-16 place-items-center">
          <span className="absolute inset-0 rounded-full border-4 border-cyan-100" />
          <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 border-r-cyan-300 animate-spin" />
          <Sparkles className="size-6 text-cyan-600 animate-pulse" />
        </div>
        <p className="mt-5 text-sm font-black text-slate-950">Preparing your score insight</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Reading your credit data and building a simple explanation.
        </p>
        <div className="mt-5 space-y-2">
          <span className="block h-3 rounded-full bg-slate-100 animate-pulse" />
          <span className="mx-auto block h-3 w-10/12 rounded-full bg-slate-100 animate-pulse" />
          <span className="mx-auto block h-3 w-7/12 rounded-full bg-slate-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function AiAnswerContent({ answer }: { answer: string }) {
  const blocks = formatAiAnswer(answer);

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <p key={`${block.text}-${index}`} className="text-sm font-black leading-5 text-slate-900">
              {block.text}
            </p>
          );
        }

        if (block.type === "list") {
          return (
            <div key={`${block.text}-${index}`} className="flex gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cyan-500" />
              <p>{block.text}</p>
            </div>
          );
        }

        return <p key={`${block.text}-${index}`}>{block.text}</p>;
      })}
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex items-center justify-center rounded-full px-2.5 py-2 text-tiny font-semibold capitalize transition duration-300",
        active ? "bg-[linear-gradient(135deg,#00D5A7,#13B98F)] text-[#041B12] shadow-[0_10px_22px_rgba(34,242,194,0.16)]" : "border border-[#0F5D43]/45 bg-[rgba(21,38,27,0.58)] text-[#8FA89F] hover:bg-white/[0.08] hover:text-white",
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ReportAccountsTab({ accounts, activeFilter, loading }: { accounts: CreditAccount[]; activeFilter: AccountFilter; loading: boolean }) {
  const filteredAccounts = filterAccountsByType(accounts, activeFilter);
  const openAccounts = filteredAccounts.filter((account) => !isClosedAccount(account));
  const closedAccounts = filteredAccounts.filter(isClosedAccount);
  const openItems = buildReportAccounts(openAccounts, false);
  const closedItems = buildReportAccounts(closedAccounts, false);
  const hasRecords = openItems.length > 0 || closedItems.length > 0;

  return (
    <div className="space-y-3">
      {loading ? (
        <ReportAccountsSkeleton />
      ) : !hasRecords ? (
        <ReportNoRecords />
      ) : (
        <>
          <ReportAccountSection items={openItems} title="Active Accounts" />
          <ReportAccountSection items={closedItems} title="Closed Accounts" />
        </>
      )}
    </div>
  );
}

function ReportNoRecords({ description = "No report records available." }: { description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileSearch className="size-12 text-[#AAB6C8]" strokeWidth={1.6} />
      <p className="mt-4 text-base font-semibold text-white">No Records Found</p>
      <p className="mt-1 text-body-sm text-[#AAB6C8]">{description}</p>
    </div>
  );
}

function ReportEnquiriesTab({ enquiries, loading }: { enquiries: CreditEnquiry[]; loading: boolean }) {
  const items = buildReportEnquiries(enquiries);
  const hardEnquiries = items.filter((enquiry) => enquiry.kind === "Hard");
  const softEnquiries = items.filter((enquiry) => enquiry.kind === "Soft");
  const last90HardCount = hardEnquiries.filter(isWithinLast90Days).length;

  return (
    <div className="space-y-3">
      {loading ? (
        <ReportLoadingCard label="Loading enquiries..." />
      ) : items.length ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <EnquirySummaryCard label="Hard Enquiries" value={hardEnquiries.length} />
            <EnquirySummaryCard label="Soft Enquiries" value={softEnquiries.length} />
            <EnquirySummaryCard label="Last 90 Days" value={last90HardCount} />
          </div>
          <ReportEnquirySection enquiries={hardEnquiries} title="Hard Enquiries" />
          <ReportEnquirySection enquiries={softEnquiries} title="Soft Enquiries" />
        </>
      ) : (
        <ReportNoRecords description="No loan applications available." />
      )}
    </div>
  );
}

function EnquirySummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={cn("rounded-2xl px-3 py-2 text-white", reportCardClass)}>
      <p className="text-sm font-semibold"><AnimatedNumber value={value} /></p>
      <p className="mt-1 text-caption leading-3 text-[#9fb2c6]">{label}</p>
    </div>
  );
}

function ReportEnquirySection({ enquiries, title }: { enquiries: ReportEnquiryItem[]; title: string }) {
  if (!enquiries.length) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className={reportSectionHeadingClass}>{title}</h2>
      {enquiries.map((enquiry) => <ReportEnquiryCard key={enquiry.id} enquiry={enquiry} />)}
    </section>
  );
}

function ReportAccountSection({ items, title }: { items: ReportAccountItem[]; title: string }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className={reportSectionHeadingClass}>{title}</h2>
      {items.map((account) => <ReportAccountCard key={account.id} account={account} />)}
    </section>
  );
}

function ReportAccountCard({ account }: { account: ReportAccountItem }) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <article className={cn("relative overflow-hidden rounded-[1.65rem] p-4 text-white", showHistory ? "pb-8" : "", reportCardClass)}>
      <div className="absolute inset-x-5 top-0 h-1 rounded-b-full bg-[linear-gradient(90deg,#00D5A7_0%,#20D4AA_45%,#C8B945_78%,#F4A51C_100%)]" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold">{account.lender}</h2>
          <p className="mt-1 text-caption text-[#9fb2c6]">{account.loanType}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-3 py-1 text-caption font-semibold", account.statusTone)}>
          {account.status}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-semibold", account.impactTone)}>
          {account.impact === "High impact" ? <Zap className="size-3" fill="currentColor" strokeWidth={2.4} /> : null}
          {account.impact}
        </span>
        <span className="rounded-full border border-white/[0.06] bg-white/[0.045] px-3 py-1.5 text-caption font-medium text-[#9fb2c6]">Opened {account.opened}</span>
      </div>
      {account.details.length ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {account.details.map((detail) => (
            <div key={detail.label} className={cn("rounded-2xl px-3 py-2", reportMiniCardClass)}>
              <p className="text-caption font-semibold uppercase tracking-[0.12em] text-[#6f8399]">{detail.label}</p>
              <p className="mt-1 truncate text-body-sm font-semibold text-[#dbe7f4]"><AnimatedNumber value={detail.value} /></p>
            </div>
          ))}
        </div>
      ) : null}
      <button
        className="mt-4 h-10 w-full rounded-2xl border border-[#1F756B]/35 bg-[#1F756B]/12 text-caption font-semibold text-[#22F2C2] transition hover:bg-[#1F756B]/18"
        type="button"
        onClick={() => setShowHistory((current) => !current)}
      >
        {showHistory ? "Hide Payment History" : "View Payment History"}
      </button>
      {showHistory ? (
        <div className="mt-4 rounded-[1.35rem] border border-[#1F756B]/30 bg-[#07130F]/70 p-3">
          <h3 className="text-caption font-semibold uppercase tracking-[0.14em] text-[#8AF1D4]">Payment History</h3>
          {account.history.length ? (
           <div className="mt-3 max-h-[320px] overflow-y-auto pr-1 pb-1">
              <table className="w-full table-fixed border-separate border-spacing-y-2 text-left text-caption">
                <thead className="text-[#8FA89F]">
                  <tr>
                    <th className="w-[45%] px-2 py-1 font-semibold">Month / Year</th>
                    <th className="w-[18%] px-2 py-1 font-semibold">DPD</th>
                    {/* <th className="px-3 py-1 font-semibold">Asset Classification</th> */}
                    <th className="w-[37%] px-2 py-1 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {account.history.map((history, index) => (
                    <tr key={`${history.Year ?? "year"}-${history.Month ?? "month"}-${index}`} className="bg-white/[0.055] text-[#dbe7f4]">
                      <td className="rounded-l-2xl px-2 py-3 font-semibold">{formatMonthYear(history.Year, history.Month)}</td>
                      <td className="px-2 py-3">{history.Days_Past_Due ?? "--"}</td>
                      {/* <td className="px-3 py-3">{history.Asset_Classification || "--"}</td> */}
                      <td className="rounded-r-2xl px-2 py-3">
                        <span className={cn("inline-flex rounded-full px-2 py-1 text-caption font-semibold", getStatusClass(history.Days_Past_Due))}>
                          {getPaymentStatus(history.Days_Past_Due)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 rounded-2xl bg-white/[0.055] px-3 py-3 text-caption font-medium text-[#9fb2c6]">No transaction history available</p>
          )}
        </div>
      ) : null}
    </article>
  );
}

function ReportEnquiryCard({ enquiry }: { enquiry: ReportEnquiryItem }) {
  return (
    <article className={cn("rounded-[1.65rem] p-4 text-white", reportCardClass)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{enquiry.lender}</h2>
          <p className="mt-1 text-caption text-[#9fb2c6]">{enquiry.loanType}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-3 py-1 text-caption font-semibold", enquiry.kind === "Hard" ? "bg-[#ff4d7d]/14 text-[#ff8cab]" : "bg-[#1F756B]/12 text-[#1F756B]")}>
          {enquiry.kind}
        </span>
      </div>
      <div className="mt-3 space-y-1 text-caption font-medium text-[#9fb2c6]">
        <p>Enquiry Date {enquiry.date}</p>
        {enquiry.amount ? <p>Requested Amount {enquiry.amount}</p> : null}
      </div>
      <p className={cn("mt-3 text-caption font-medium", enquiry.kind === "Hard" ? "text-[#ff8cab]" : "text-[#1F756B]")}>{enquiry.message}</p>
    </article>
  );
}

function ReportAccountsSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className={cn("rounded-[1.65rem] p-4", reportCardClass)}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="h-4 w-7/12 animate-pulse rounded-full bg-white/10" />
              <div className="mt-2 h-3 w-5/12 animate-pulse rounded-full bg-white/10" />
            </div>
            <div className="h-6 w-20 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className={cn("h-12 animate-pulse rounded-2xl", reportMiniCardClass)} />
            <div className={cn("h-12 animate-pulse rounded-2xl", reportMiniCardClass)} />
            <div className={cn("h-12 animate-pulse rounded-2xl", reportMiniCardClass)} />
          </div>
        </div>
      ))}
    </>
  );
}

function ReportLoadingCard({ label }: { label: string }) {
  return (
    <div className={cn("rounded-[1.65rem] p-4 text-caption font-medium text-[#9fb2c6]", reportCardClass)}>
      {label}
    </div>
  );
}

function ScorePanel({
  downloading,
  error,
  factors,
  hasReport,
  lastChecked,
  loading,
  onDownload,
  onRefresh,
  range,
  score,
}: {
  downloading: boolean;
  error: string;
  factors: string[];
  hasReport: boolean;
  lastChecked: string | null;
  loading: boolean;
  onDownload: () => void;
  onRefresh: () => void;
  range: string;
  score: number | null;
}) {
  const scoreStatus = getScoreStatus(score);

  return (
    <AppCard className="animate-[creditPanelIn_0.45s_ease-out] overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold">Your CIBIL Score</h2>
          <p className="mt-1 text-xs text-slate-500">
            {loading ? "Loading latest report..." : lastChecked ? `Last checked: ${lastChecked}` : "Latest report is not ready"}
          </p>
        </div>
        <span className={cn("rounded-full px-3 py-1.5 text-caption font-bold", hasReport ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
          {hasReport ? "PDF ready" : "No PDF"}
        </span>
      </div>

      <CreditMeter score={score} />

      <p className={cn("mt-3 rounded-2xl px-4 py-2.5 text-xs font-semibold leading-5", scoreStatus.tone)}>
        {score ? `${scoreStatus.label}. ${scoreStatus.body} ${range}` : error || "Run a CIBIL check to load your latest score."}
      </p>

      {factors.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {factors.slice(0, 2).map((factor) => (
            <p key={factor} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-caption font-bold leading-4 text-slate-500">
              {toTitleCase(factor)}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-xs font-bold text-slate-800 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-md"
          type="button"
          onClick={onRefresh}
          disabled={loading}
        >
          <RotateCcw className={loading ? "size-5 animate-spin" : "size-5"} /> {loading ? "Loading..." : "Get Latest Score"}
        </button>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-xs font-bold text-slate-800 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-55"
          type="button"
          onClick={onDownload}
          disabled={downloading || !hasReport}
        >
          <Download className={downloading ? "size-5 animate-pulse" : "size-5"} /> {downloading ? "Downloading..." : "Download Report"}
        </button>
      </div>
    </AppCard>
  );
}

function CreditMeter({ score }: { score: number | null }) {
  const displayScore = score ?? 0;
  const scoreLabel = score ? getScoreStatus(score).label : "Not checked";
  const needleAngle = score ? scoreToNeedleAngle(score) : 270;

  return (
    <div className="relative mx-auto h-[13.25rem] w-full max-w-[22rem] animate-[meterFade_0.45s_ease-out]">
      <div className="absolute inset-x-4 bottom-6 top-4 rounded-[2rem] bg-[linear-gradient(180deg,#fbfdff_0%,#ffffff_60%,#f7fbff_100%)]" />

      <svg
        className="absolute inset-x-0 top-0 h-40 w-full overflow-visible"
        viewBox="0 0 224 148"
        aria-hidden="true"
      >
        <defs>
          <filter
            id="credit-score-meter-soft-shadow"
            x="-20%"
            y="-30%"
            width="140%"
            height="160%"
          >
            <feDropShadow
              dx="0"
              dy="5"
              floodColor="#101828"
              floodOpacity="0.1"
              stdDeviation="5"
            />
          </filter>

          <linearGradient
            id="credit-score-meter-arc"
            x1="18"
            x2="206"
            y1="118"
            y2="118"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#ff4d32" />
            <stop offset="33%" stopColor="#ffb21f" />
            <stop offset="68%" stopColor="#cbe63c" />
            <stop offset="100%" stopColor="#20bd6b" />
          </linearGradient>
        </defs>

        <path
          d="M 20 118 A 92 92 0 0 1 204 118"
          fill="none"
          pathLength="100"
          stroke="#e8f1fb"
          strokeLinecap="round"
          strokeWidth="18"
        />

        <path
          d="M 20 118 A 92 92 0 0 1 204 118"
          fill="none"
          filter="url(#credit-score-meter-soft-shadow)"
          pathLength="100"
          stroke="url(#credit-score-meter-arc)"
          strokeLinecap="round"
          strokeWidth="15"
        />

        {[0, 20, 40, 60, 80, 100].map((tick) => {
          const angle = Math.PI - (Math.PI * tick) / 100;
          const outerX = 112 + Math.cos(angle) * 89;
          const outerY = 118 - Math.sin(angle) * 89;
          const innerX = 112 + Math.cos(angle) * 79;
          const innerY = 118 - Math.sin(angle) * 79;

          return (
            <line
              key={tick}
              stroke={tick === 0 || tick === 100 ? "#98a2b3" : "#cfd8e3"}
              strokeLinecap="round"
              strokeWidth={tick === 0 || tick === 100 ? 2.2 : 1.7}
              x1={innerX}
              x2={outerX}
              y1={innerY}
              y2={outerY}
            />
          );
        })}

        <g
          className="transition-transform duration-1000 ease-out"
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: "112px 118px",
          }}
        >
          <path
            d="M112 116.5 L190 111.5 L190 124.5 L112 119.5 Z"
            fill="#0b376d"
          />
          <path
            d="M112 116.5 L190 111.5 L190 116.2 L112 118 Z"
            fill="#155aa4"
            opacity="0.9"
          />
        </g>

        <circle cx="112" cy="118" fill="#0b376d" r="9" />
        <circle cx="112" cy="118" fill="#1677ff" r="5" />
      </svg>

      <div className="absolute inset-x-3 bottom-10 flex justify-between px-2 text-xs font-black text-[var(--portal-muted)]">
        <span><AnimatedNumber value={300} /></span>
        <span><AnimatedNumber value={900} /></span>
      </div>

      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-2xl font-black text-[var(--portal-ink)]">
          <AnimatedNumber value={score ? displayScore : "--"} />
        </p>
        <p className="text-xs font-bold text-[var(--portal-muted)]">{scoreLabel}</p>
      </div>
    </div>
  );
}

function ScoreDetails({
  accounts,
  behaviourItems,
  enquiries,
  loading,
}: {
  accounts: CreditAccount[];
  behaviourItems: BehaviourItem[];
  enquiries: CreditEnquiry[];
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-bold tracking-tight text-slate-950">Your Credit Behaviour</h2>
        <div className="mt-3 grid gap-3">
          {loading ? (
            <AppCard>
              <p className="text-sm font-bold text-slate-500">Loading credit behaviour...</p>
            </AppCard>
          ) : (
            behaviourItems.map((item, index) => (
              <BehaviourCard key={item.title} index={index} {...item} />
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold tracking-tight text-slate-950">Accounts</h2>
        <div className="mt-3 grid gap-3">
          {accounts.length ? (
            accounts.slice(0, 4).map((account, index) => (
              <AccountCard key={`${account.member_name ?? "account"}-${index}`} account={account} />
            ))
          ) : (
            <AppCard>
              <p className="text-sm font-bold text-slate-500">No accounts found in the latest report.</p>
            </AppCard>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold tracking-tight text-slate-950">Recent Enquiries</h2>
        <div className="mt-3 grid gap-3">
          {enquiries.length ? (
            enquiries.slice(0, 4).map((enquiry, index) => (
              <EnquiryCard key={`${enquiry.member ?? "enquiry"}-${index}`} enquiry={enquiry} />
            ))
          ) : (
            <AppCard>
              <p className="text-sm font-bold text-slate-500">No enquiries found in the latest report.</p>
            </AppCard>
          )}
        </div>
      </section>
    </div>
  );
}

function BehaviourCard({ title, value, rating, body, index, tone }: BehaviourItem & { index: number }) {
  return (
    <AppCard className="animate-[creditPanelIn_0.45s_ease-out_both] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_18px_45px_rgba(15,23,42,0.09)]" style={{ animationDelay: `${index * 55}ms` }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <Clock3 className="mt-0.5 size-6 shrink-0 text-cyan-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-950">{title}</h3>
            <p className="mt-1 text-xl font-bold text-slate-800"><AnimatedNumber value={value} /></p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-slate-200 px-3 py-1.5 text-caption font-bold text-slate-600">{rating}</span>
          <CheckCircle2 className={cn("size-7", tone === "danger" ? "text-rose-500" : tone === "warn" ? "text-amber-500" : "text-emerald-500")} />
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-600">{body}</p>
    </AppCard>
  );
}

function AccountCard({ account }: { account: CreditAccount }) {
  const overdue = readNumericValue(account.amount_overdue);

  return (
    <AppCard className={cn(overdue > 0 && "border-rose-200 bg-rose-50")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-950">{account.member_name || "Credit account"}</p>
          <p className="mt-1 text-xs text-slate-500">Type {account.type || "--"} • Opened {formatCompactDate(account.opened)}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-3 py-1.5 text-caption font-bold", overdue > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700")}>
          {overdue > 0 ? "Overdue" : "Current"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniMetric label="Balance" value={formatRupees(account.current_balance)} />
        <MiniMetric label="EMI" value={formatRupees(readAccountEmiValue(account))} />
        <MiniMetric label="Overdue" value={formatRupees(account.amount_overdue)} />
      </div>
    </AppCard>
  );
}

function EnquiryCard({ enquiry }: { enquiry: CreditEnquiry }) {
  return (
    <AppCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-950">{enquiry.member || "Credit enquiry"}</p>
          <p className="mt-1 text-xs text-slate-500">Purpose {enquiry.enquiry_purpose || "--"} • {formatCompactDate(enquiry.enquiry_date)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-caption font-bold text-slate-700">
          <AnimatedNumber value={formatRupees(enquiry.enquiry_amount)} />
        </span>
      </div>
    </AppCard>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-caption font-bold text-slate-500">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-slate-900"><AnimatedNumber value={value} /></p>
    </div>
  );
}

function PredictorPanel({
  currentScore,
  disabled,
  onPredict,
  predictedScore,
}: {
  currentScore: number;
  disabled: boolean;
  onPredict: () => void;
  predictedScore: number;
}) {
  const delta = predictedScore - currentScore;

  return (
    <div key="predictor-tab" className="space-y-5 animate-[creditPanelIn_0.42s_ease-out]">
      {/* <div className="grid grid-cols-2 gap-3">
        {predictorActions.map(({ id, title, Icon, tone }, index) => {
          const selected = selectedActions.includes(id);

          return (
            <button
              key={id}
              className={cn(
                "min-h-32 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition duration-200 hover:border-cyan-300 hover:shadow-[var(--portal-shadow-soft)] disabled:cursor-not-allowed disabled:opacity-55",
                selected && "border-cyan-300 bg-cyan-50 shadow-lg shadow-cyan-100",
              )}
              style={{ animationDelay: `${index * 45}ms` }}
              type="button"
              onClick={() => onToggle(id)}
              disabled={disabled}
            >
              <span
                className={cn(
                  "mx-auto grid size-12 place-items-center rounded-2xl transition duration-300",
                  selected && "scale-105",
                  tone === "good" && "bg-emerald-50 text-emerald-600",
                  tone === "danger" && "bg-rose-50 text-rose-600",
                  tone === "warn" && "bg-amber-50 text-amber-600",
                )}
              >
                <Icon className="size-6" />
              </span>
              <span className="mt-3 block text-xs font-bold leading-5 text-slate-800">{title}</span>
              {selected ? <CheckCircle2 className="mx-auto mt-2 size-4 text-cyan-600" /> : null}
            </button>
          );
        })}
      </div> */}

      <AppCard className="animate-[creditPanelIn_0.5s_ease-out_120ms_both]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-500">Predicted score</p>
            <p className="mt-1 text-3xl font-black text-slate-950"><AnimatedNumber value={disabled ? "--" : predictedScore} /></p>
          </div>
          <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold", delta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
            {delta >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            {disabled ? "No score" : <><AnimatedNumber value={`${delta >= 0 ? "+" : ""}${delta}`} /> points</>}
          </span>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Predictions are estimates based on common credit scoring patterns. Actual results may vary based on complete bureau data.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {/* <button className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-55" type="button" onClick={onReset} disabled={disabled}>
            <XCircle className="size-4" /> Clear actions
          </button> */}
          <PrimaryPortalButton type="button" className="h-10 text-xs" disabled={disabled} onClick={onPredict}>
            <Sparkles className="size-4" /> Predict Score
          </PrimaryPortalButton>
        </div>
      </AppCard>
    </div>
  );
}

function readAiMessage(result: unknown): string {
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

  return readAiMessage(data.data);
}

function buildCreditScoreAiPrompt({
  displayData,
  predictedScore,
}: {
  displayData: DisplayDataResponse | null;
  predictedScore: number;
}) {
  const display = displayData?.data?.display;
  const score = readScore(displayData);
  const status = getScoreStatus(score);
  const factors = display?.score?.factors?.filter(Boolean) ?? [];
  const accounts = display?.accounts ?? [];
  const enquiries = display?.enquiries ?? [];
  const overdueAccounts = accounts.filter((account) => readNumericValue(account.amount_overdue) > 0);
  const totalBalance = accounts.reduce((total, account) => total + readNumericValue(account.current_balance), 0);
  const totalLimit = accounts.reduce((total, account) => total + readNumericValue(account.high_credit_amount), 0);
  const utilization = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : null;
  const activeAccounts = accounts.filter((account) => !account.account_closed).length;
  const accountSummary = accounts.slice(0, 4).map((account, index) => {
    return [
      `Account ${index + 1}`,
      `type: ${account.type || "unknown"}`,
      `balance: ${formatRupees(account.current_balance)}`,
      `overdue: ${formatRupees(account.amount_overdue)}`,
      `opened: ${formatCompactDate(account.opened)}`,
    ].join(", ");
  });

  return [
    "Explain this user's credit score in simple terms using their actual report data.",
    "Keep it short, practical, and specific to this user. Do not use markdown symbols, asterisks, tables, or long paragraphs.",
    "",
    "User credit data:",
    `Name: ${display?.profile?.name || "Not available"}`,
    `Current credit score: ${score ? `${score} (${status.label})` : "Not available"}`,
    `Score range: ${display?.score?.range || "300 to 900"}`,
    `Predicted score shown in app: ${score ? predictedScore : "Not available"}`,
    `Score factors: ${factors.length ? factors.map(toTitleCase).join(", ") : "Not available"}`,
    `Active accounts: ${activeAccounts}`,
    `Total accounts in report: ${accounts.length}`,
    `Accounts with overdue amount: ${overdueAccounts.length}`,
    `Total balance: ${formatRupees(totalBalance)}`,
    `Total high credit amount: ${formatRupees(totalLimit)}`,
    `Estimated utilization: ${utilization === null ? "Not available" : `${utilization}%`}`,
    `Recent enquiries: ${enquiries.length}`,
    accountSummary.length ? `Account summary: ${accountSummary.join(" | ")}` : "Account summary: Not available",
    "",
    "Answer format:",
    "1. One sentence explaining what the score means for this user.",
    "2. Seven bullet points with the most important reasons from the data.",
    "3. Two next actions the user should take.",
  ].join("\n");
}

function formatAiAnswer(answer: string): AiAnswerBlock[] {
  return answer
    .split(/\n+/)
    .map(cleanAiAnswerLine)
    .filter(Boolean)
    .map((text) => ({
      text,
      type: getAiAnswerBlockType(text),
    }));
}

function cleanAiAnswerLine(line: string) {
  return line
    .replace(/^#{1,6}\s*/, "")
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function getAiAnswerBlockType(text: string): AiAnswerBlock["type"] {
  if (/^(what it means|why|reasons|next actions|actions|summary|breakdown|recommendation)s?:?$/i.test(text)) {
    return "heading";
  }

  if (/^(your|this|pay|keep|avoid|reduce|clear|check|make|use|maintain|limit|improve|because|score|credit|overdue|utilization|enquiries)/i.test(text)) {
    return "list";
  }

  return "paragraph";
}

function buildBehaviourItems(result: DisplayDataResponse | null): BehaviourItem[] {
  const score = readScore(result);
  const display = result?.data?.display;
  const accounts = display?.accounts ?? [];
  const enquiries = display?.enquiries ?? [];
  const overdueAccounts = accounts.filter((account) => readNumericValue(account.amount_overdue) > 0).length;
  const activeAccounts = accounts.filter((account) => !account.account_closed).length;
  const totalBalance = accounts.reduce((total, account) => total + readNumericValue(account.current_balance), 0);
  const totalLimit = accounts.reduce((total, account) => total + readNumericValue(account.high_credit_amount), 0);
  const utilization = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : null;

  return [
    {
      title: "Credit Score",
      value: score ? String(score) : "--",
      rating: getScoreStatus(score).label,
      body: display?.score?.range || "Score range will appear after the latest report is available.",
      tone: score && score >= 650 ? "good" : score ? "warn" : "neutral",
    },
    {
      title: "Score Factors",
      value: String(display?.score?.factors?.length ?? 0),
      rating: "Review",
      body: display?.score?.factors?.length
        ? display.score.factors.map(toTitleCase).join(". ")
        : "No score factors were returned in the latest report.",
      tone: display?.score?.factors?.length ? "warn" : "good",
    },
    {
      title: "Active Accounts",
      value: String(activeAccounts),
      rating: overdueAccounts ? "Attention" : "Current",
      body: overdueAccounts
        ? `${overdueAccounts} account needs repayment attention.`
        : `${accounts.length} account${accounts.length === 1 ? "" : "s"} found in the latest report.`,
      tone: overdueAccounts ? "danger" : "good",
    },
    {
      title: "Credit Utilization",
      value: utilization === null ? "--" : `${utilization}%`,
      rating: utilization === null ? "Pending" : utilization <= 30 ? "Good" : "High",
      body: utilization === null
        ? "Utilization needs balance and sanctioned amount data from accounts."
        : `Current balance is ${formatRupees(totalBalance)} against ${formatRupees(totalLimit)} high credit amount.`,
      tone: utilization === null ? "neutral" : utilization <= 30 ? "good" : "warn",
    },
    {
      title: "Recent Enquiries",
      value: String(enquiries.length),
      rating: enquiries.length > 2 ? "High" : "Stable",
      body: enquiries.length
        ? `${enquiries.length} enquiry${enquiries.length === 1 ? "" : "ies"} found in the latest report.`
        : "No recent enquiries were returned in the latest report.",
      tone: enquiries.length > 2 ? "warn" : "good",
    },
  ];
}

function buildReportAccounts(accounts: CreditAccount[], useFallback = true): ReportAccountItem[] {
  const mappedAccounts = accounts.map((account, index) => {
    const overdue = readNumericValue(account.amount_overdue);
    const closed = isClosedAccount(account);
    const status: ReportAccountItem["status"] = closed ? "Closed" : overdue > 0 ? "Overdue" : "On Time";
    const highImpact = readNumericValue(account.high_credit_amount) >= 100000 || overdue > 0;
    const impact: ReportAccountItem["impact"] = highImpact ? "High impact" : "Medium impact";

    return {
      details: buildReportAccountDetails(account),
      history: readPaymentHistory(account),
      id: `${account.member_name || "account"}-${readAccountType(account) || "account"}-${index}`,
      impact,
      impactTone: highImpact ? "border border-[#FFD34D]/25 bg-[#FFD34D]/14 text-[#FFD34D]" : "bg-[#ffd166]/14 text-[#ffd166]",
      lender: account.member_name || fallbackReportAccounts[index % fallbackReportAccounts.length].lender,
      loanType: getAccountTypeLabel(account),
      opened: formatCompactDate(account.opened),
      status,
      statusTone:
        status === "On Time"
          ? "bg-[#22F2C2]/12 text-[#22F2C2]"
          : status === "Closed"
            ? "bg-[#7895ff]/14 text-[#aebcff]"
            : "bg-[#FF5C8A]/12 text-[#FF5C8A]",
    };
  });

  return mappedAccounts.length || !useFallback ? mappedAccounts : fallbackReportAccounts;
}

function readReportAccounts(result: DisplayDataResponse | null): CreditAccount[] {
  const response = result?.data?.credit_report?.RESPONSES?.RESPONSE;
  const crifAccounts = toArray(response)
    .flatMap((item) => toArray(item["LOAN-DETAILS"]))
    .map(mapCrifReportAccount);

  return crifAccounts.length ? crifAccounts : result?.data?.display?.accounts ?? [];
}

function mapCrifReportAccount(account: CrifLoanDetails): CreditAccount {
  return {
    "LOAN-DETAILS": {
      "ACCOUNT-STATUS": account["ACCOUNT-STATUS"],
      "ACCT-TYPE": account["ACCT-TYPE"],
    },
    account_closed: String(account["ACCOUNT-STATUS"] ?? "").trim().toLowerCase() === "closed" ? "Closed" : null,
    account_status: account["ACCOUNT-STATUS"],
    amount_overdue: account["OVERDUE-AMT"],
    current_balance: account["CURRENT-BAL"],
    emi: account.OBLIGATION ?? account["INSTALLMENT-AMT"] ?? account["ACTUAL-PAYMENT"],
    high_credit_amount: account["CREDIT-LIMIT"] ?? account["DISBURSED-AMT"],
    last_payment: account["LAST-PAYMENT-DATE"],
    member_name: account["CREDIT-GUARANTOR"] ?? null,
    opened: account["DISBURSED-DT"],
    repayment_tenure: account["REPAYMENT-TENURE"],
    type: String(account["ACCT-TYPE"] ?? "").trim(),
  };
}

function toArray<T>(value: T | T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function buildAccountSummary(accounts: CreditAccount[]) {
  const cards = accounts.filter(isCardAccount);
  const loans = accounts.filter((account) => !isCardAccount(account));

  return [
    { filter: "accounts" as const, label: "Accounts", value: String(accounts.length) },
    { filter: "loans" as const, label: "Loans", value: String(loans.length) },
    { filter: "cards" as const, label: "Cards", value: String(cards.length) },
  ];
}

function filterAccountsByType(accounts: CreditAccount[], filter: AccountFilter) {
  if (filter === "loans") {
    return accounts.filter(isLoanAccount);
  }

  if (filter === "cards") {
    return accounts.filter(isCardAccount);
  }

  return accounts;
}

function isLoanAccount(account: CreditAccount) {
  return !isCardAccount(account);
}

function isCardAccount(account: CreditAccount) {
  return isCreditCard(readAccountType(account));
}

function isCreditCard(type = "") {
  return type.toLowerCase().includes("credit card");
}

function isClosedAccount(account: CreditAccount) {
  return readAccountStatus(account) === CRIF_CLOSED_STATUS;
}

function getAccountTypeLabel(account: CreditAccount) {
  const portfolioType = readPortfolioType(account);
  const accountType = readAccountType(account);

  if (portfolioType === "R") {
    return "Credit Card";
  }

  if (portfolioType === "I") {
    return accountTypeLabels[accountType] ?? "Loan";
  }

  return accountTypeLabels[accountType] ?? (accountType ? toTitleCase(accountType) : "Other Account");
}

function readPortfolioType(account: CreditAccount) {
  return String(account.portfolio_type ?? account.Portfolio_Type ?? "").trim().toUpperCase();
}

function readAccountType(account: CreditAccount) {
  return String(account["LOAN-DETAILS"]?.["ACCT-TYPE"] ?? account.type ?? account.Account_Type ?? "").trim();
}

function readAccountStatus(account: CreditAccount) {
  return String(account["LOAN-DETAILS"]?.["ACCOUNT-STATUS"] ?? account.account_status ?? account.Account_Status ?? "").trim();
}

function buildReportEnquiries(enquiries: CreditEnquiry[]): ReportEnquiryItem[] {
  return enquiries.map((enquiry, index) => {
    const amount = readNumericValue(enquiry.enquiry_amount);
    const kind = getEnquiryKind(enquiry);
    const sortTime = readEnquiryTime(enquiry.enquiry_date);

    return {
      amount: amount > 0 ? formatRupees(enquiry.enquiry_amount) : undefined,
      date: formatCompactDate(enquiry.enquiry_date),
      id: `${enquiry.member || "enquiry"}-${enquiry.enquiry_date || "unknown"}-${index}`,
      kind,
      lender: enquiry.member || "Credit Bureau",
      loanType: getEnquiryPurposeLabel(enquiry.enquiry_purpose),
      message: kind === "Hard" ? "May impact approval chances" : "Does not affect credit score",
      sortTime,
    };
  }).sort((a, b) => b.sortTime - a.sortTime);
}

function getEnquiryKind(enquiry: CreditEnquiry): ReportEnquiryItem["kind"] {
  const value = String(enquiry.enquiry_kind ?? enquiry.enquiry_type ?? "").trim().toLowerCase();

  if (value.includes("soft") || value.includes("noncredit") || value.includes("non-credit")) {
    return "Soft";
  }

  return "Hard";
}

function getEnquiryPurposeLabel(value: unknown) {
  const purpose = String(value ?? "").trim();

  return enquiryPurposeLabels[purpose] ?? (purpose && !/^\d+$/.test(purpose) ? toTitleCase(purpose) : "Credit Enquiry");
}

function isWithinLast90Days(enquiry: ReportEnquiryItem) {
  if (!enquiry.sortTime) {
    return false;
  }

  return Date.now() - enquiry.sortTime <= 90 * 24 * 60 * 60 * 1000;
}

function readEnquiryTime(value?: string | null) {
  if (!value) {
    return 0;
  }

  if (/^\d{8}$/.test(value)) {
    const parsed = new Date(Number(value.slice(4)), Number(value.slice(2, 4)) - 1, Number(value.slice(0, 2)));

    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function buildReportAccountDetails(account: CreditAccount) {
  const latestHistory = readPaymentHistory(account)[0];
  const latestDpd = latestHistory ? readNumericValue(latestHistory.Days_Past_Due) : null;

  return [
    { label: "Balance", value: formatRupees(account.current_balance) },
    { label: "High credit", value: formatRupees(account.high_credit_amount) },
    { label: "Overdue", value: formatRupees(account.amount_overdue) },
    { label: "EMI", value: formatRupees(readAccountEmiValue(account)) },
    { label: "Last payment", value: formatCompactDate(account.last_payment) },
    { label: "Reported", value: formatCompactDate(account.reported_and_certified) },
    { label: "Tenure", value: formatTenure(account.repayment_tenure) },
    { label: "Frequency", value: account.payment_frequency || "--" },
    { label: "Interest", value: formatInterest(account.rate_of_interest) },
    { label: "Latest DPD", value: latestDpd === null ? "--" : String(latestDpd) },
  ].filter((detail) => detail.value && detail.value !== "Rs. 0" && detail.value !== "--");
}

function readPaymentHistory(account: CreditAccount) {
  if (Array.isArray(account.CAIS_Account_History)) {
    return account.CAIS_Account_History;
  }

  if (Array.isArray(account.payment_history_details)) {
    return account.payment_history_details;
  }

  return [];
}

function formatMonthYear(year: unknown, month: unknown) {
  const numericYear = Number(year);
  const numericMonth = Number(month);

  if (!Number.isFinite(numericYear) || !Number.isFinite(numericMonth) || numericMonth < 1 || numericMonth > 12) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(new Date(numericYear, numericMonth - 1, 1));
}

function getPaymentStatus(daysPastDue: unknown) {
  if (daysPastDue === null || daysPastDue === undefined || daysPastDue === "") {
    return "No Data";
  }

  return readNumericValue(daysPastDue) > 0 ? "Delayed" : "On Time";
}

function getStatusClass(daysPastDue: unknown) {
  const status = getPaymentStatus(daysPastDue);

  if (status === "On Time") {
    return "bg-[#22F2C2]/12 text-[#22F2C2]";
  }

  if (status === "Delayed") {
    return "bg-[#FF5C8A]/12 text-[#FF8AAB]";
  }

  return "bg-white/10 text-[#9fb2c6]";
}

function readScore(result: DisplayDataResponse | null) {
  const score =
    result?.data?.display?.score?.value ??
    result?.data?.credit_score ??
    result?.data?.report?.credit_score;
  const numericScore = typeof score === "number" ? score : Number(score);

  return Number.isFinite(numericScore) && numericScore > 0 ? numericScore : null;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function readLastChecked(result: DisplayDataResponse | null) {
  const value = result?.data?.display?.profile?.fetched_at ?? result?.fetchedAt;

  return value ? formatDateTime(value) : null;
}

function readNumericValue(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;

  const numericValue = typeof value === "number" ? value : Number(String(value).split("/")[0].replace(/[^\d.-]/g, ""));

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function readAccountEmiValue(account: CreditAccount) {
  const crifAccount = account as CreditAccount & {
    "ACTUAL-PAYMENT"?: string | number | null;
    "INSTALLMENT-AMT"?: string | number | null;
    OBLIGATION?: string | number | null;
    Scheduled_Monthly_Payment_Amount?: string | number | null;
  };

  return [crifAccount.OBLIGATION, crifAccount["INSTALLMENT-AMT"], crifAccount["ACTUAL-PAYMENT"], account.emi, crifAccount.Scheduled_Monthly_Payment_Amount]
    .find((value) => value !== null && value !== undefined && String(value).trim() !== "");
}

function scoreToNeedleAngle(score: number) {
  const safeScore = Math.min(900, Math.max(300, score));
  const progress = (safeScore - 300) / 600;

  return Math.round(180 + progress * 180);
}

function getScoreStatus(score: number | null) {
  if (score === null) {
    return {
      label: "Pending",
      body: "Latest score is not available.",
      tone: "bg-slate-100 text-slate-600",
    };
  }

  if (score >= 750) {
    return {
      label: "Good",
      body: "You have access to most loan products.",
      tone: "bg-emerald-50 text-emerald-700",
    };
  }

  if (score >= 650) {
    return {
      label: "Average",
      body: "Your profile can improve with focused repayment and utilization actions.",
      tone: "bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Needs attention",
    body: "Your profile may need repair actions before applying for new credit.",
    tone: "bg-rose-50 text-rose-700",
  };
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

function formatCompactDate(value?: string | null) {
  const raw = String(value ?? "").trim();

  if (!raw) return "--";

  if (/^\d{8}$/.test(raw)) {
    if (raw === "11111111" || raw === "00000000") {
      return "--";
    }

    const firstFour = Number(raw.slice(0, 4));
    const year = firstFour >= 1900 ? raw.slice(0, 4) : raw.slice(4);
    const month = firstFour >= 1900 ? raw.slice(4, 6) : raw.slice(2, 4);
    const day = firstFour >= 1900 ? raw.slice(6, 8) : raw.slice(0, 2);

    return `${day}/${month}/${year}`;
  }

  return raw.replace(/^(\d{2})-(\d{2})-(\d{4})$/, "$1/$2/$3");
}

function formatRupees(value: unknown) {
  const amount = readNumericValue(value);

  if (!amount) return "Rs. 0";

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "INR",
  }).format(amount).replace("₹", "Rs. ");
}

function formatTenure(value: unknown) {
  const tenure = readNumericValue(value);

  return tenure ? `${tenure} months` : "--";
}

function formatInterest(value: unknown) {
  const rate = readNumericValue(value);

  return rate ? `${rate}%` : "--";
}

function getReportFileName(contentDisposition: string | null) {
  if (!contentDisposition) {
    const now = new Date();

    const timestamp =
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      "_" +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");

    return `scorecare-cibil-report-${timestamp}.pdf`;
  }


  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  const quotedMatch = /filename="?([^"]+)"?/i.exec(contentDisposition);
  const fileName = utf8Match?.[1] ?? quotedMatch?.[1];

  return fileName ? decodeURIComponent(fileName.trim()) : "Scorecare-cibil-report.pdf";
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
    data?: {
      unreadCount?: number | null;
    };
    status?: string;
  };

  return {
    unreadCount: result.status === "success" ? result.data?.unreadCount ?? 0 : 0,
  };
}

function toTitleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
