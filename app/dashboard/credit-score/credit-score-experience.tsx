"use client";

import {
  BadgeIndianRupee,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Gauge,
  Info,
  ReceiptText,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppCard,
  PageContent,
  PortalShell,
  PortalTopBar,
  PrimaryPortalButton,
} from "@/components/dashboard/portal-ui";
import { SubscribePromptOverlay, useSubscribePrompt } from "@/components/dashboard/subscribe-prompt";
import { apiRequest, apiUrl } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { CibilDisplayDataError, getCachedCibilDisplayData, getStoredLatestCibilScoreCheckData } from "@/lib/cibil-display-cache";
import { useSubscriptionAccess } from "@/lib/subscription-access";
import { cn } from "@/lib/utils";

type Tab = "accounts" | "enquiries" | "repair";

type CreditAccount = {
  member_name?: string | null;
  type?: string | null;
  current_balance?: string | number | null;
  high_credit_amount?: string | number | null;
  amount_overdue?: string | number | null;
  emi?: string | number | null;
  opened?: string | null;
  account_closed?: string | null;
  payment_history?: string[] | null;
};

type CreditEnquiry = {
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
  };
};

type BehaviourItem = {
  title: string;
  value: string;
  rating: string;
  body: string;
  tone: "good" | "warn" | "danger" | "neutral";
};

type ReportAccountItem = {
  id: string;
  impact: "High impact" | "Medium impact";
  impactTone: string;
  lender: string;
  loanType: string;
  opened: string;
  status: "On Time" | "Inactive" | "Closed";
  statusTone: string;
};

type ReportEnquiryItem = {
  date: string;
  id: string;
  kind: "Hard" | "Soft";
  lender: string;
  loanType: string;
  pointsImpact?: string;
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

const fallbackReportAccounts: ReportAccountItem[] = [
  {
    id: "fallback-hdfc",
    impact: "High impact",
    impactTone: "bg-[#4EE6D2]/12 text-[#4EE6D2]",
    lender: "HDFC Bank",
    loanType: "Personal Loan",
    opened: "13 Jun 2026",
    status: "On Time",
    statusTone: "bg-[#4EE6D2]/12 text-[#4EE6D2]",
  },
  {
    id: "fallback-sbi",
    impact: "Medium impact",
    impactTone: "bg-[#ffd166]/14 text-[#ffd166]",
    lender: "SBI",
    loanType: "Home Loan",
    opened: "11 May 2025",
    status: "Inactive",
    statusTone: "bg-white/[0.08] text-[#9fb2c6]",
  },
  {
    id: "fallback-axis",
    impact: "High impact",
    impactTone: "bg-[#4EE6D2]/12 text-[#4EE6D2]",
    lender: "Axis Bank",
    loanType: "Credit Card",
    opened: "04 Feb 2024",
    status: "On Time",
    statusTone: "bg-[#4EE6D2]/12 text-[#4EE6D2]",
  },
  {
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

const fallbackReportEnquiries: ReportEnquiryItem[] = [
  { date: "13 Jun 2026", id: "fallback-enquiry-hdfc", kind: "Hard", lender: "HDFC Bank", loanType: "Personal Loan", pointsImpact: "-5 pts impact" },
  { date: "28 May 2026", id: "fallback-enquiry-sbi", kind: "Soft", lender: "SBI", loanType: "Home Loan" },
  { date: "09 Apr 2026", id: "fallback-enquiry-axis", kind: "Hard", lender: "Axis Bank", loanType: "Credit Card", pointsImpact: "-3 pts impact" },
];

const repairTimelineSteps = ["Report Analysis", "Error Detection", "Dispute Filing", "Lender Negotiation", "Score Verification"];
const repairTimelineCopy = [
  "Review accounts, enquiries, balances, and negative signals.",
  "Find wrong ownership, duplicate entries, late marks, and closure gaps.",
  "Prepare bureau-ready disputes with supporting documents.",
  "Coordinate lender follow-up until account correction is confirmed.",
  "Verify bureau update and score movement after resolution.",
];

export function CreditScoreExperience() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("accounts");
  const [displayData, setDisplayData] = useState<DisplayDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [selectedActions] = useState<string[]>([]);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [scoreHelpAnswer, setScoreHelpAnswer] = useState("");
  const [scoreHelpError, setScoreHelpError] = useState("");
  const [scoreHelpLoading, setScoreHelpLoading] = useState(false);
  const { isFreeTier, loading: accessLoading } = useSubscriptionAccess();
  const { closeSubscribePrompt, promptSubscribe, showSubscribePrompt } = useSubscribePrompt();

  const score = readScore(displayData);
  const lastChecked = readLastChecked(displayData);
  const accounts = displayData?.data?.display?.accounts ?? [];
  const enquiries = displayData?.data?.display?.enquiries ?? [];
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

    const token = sessionStorage.getItem("scorecare_token");

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

  async function downloadReport() {
    if (downloading) return;

    if (isFreeTier) {
      promptSubscribe();
      return;
    }

    const token = sessionStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    setDownloading(true);
    setError("");

    try {
      const downloadPath = displayData?.data?.report?.download_url || "/credit-reports/cibil/download-report";
      const response = await fetch(apiUrl(downloadPath), {
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
    } catch {
      setError("Could not download your CIBIL report. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function refreshCachedScore() {
    if (loading) return;

    const token = sessionStorage.getItem("scorecare_token");

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

    const token = sessionStorage.getItem("scorecare_token");

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

  return (
    <PortalShell active="score">
      <PortalTopBar title="Credit Report" />
      <PageContent className="bg-[#eef4f8]">
        <div className="mx-auto max-w-md">
          <div className="rounded-[2rem] bg-[#081625] p-4 text-white shadow-[0_24px_60px_rgba(8,22,37,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#4EE6D2]">Credit Report</p>
                <h1 className="mt-1 text-lg font-semibold tracking-tight">Report Insights</h1>
                <p className="mt-1 text-[0.72rem] text-[#9fb2c6]">
                  Updated {loading ? "Loading..." : lastChecked ?? "--"}
                </p>
              </div>
              <button
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#ff4d7d] px-3 text-[0.7rem] font-semibold text-white shadow-[0_14px_28px_rgba(255,77,125,0.26)] disabled:opacity-55"
                type="button"
                onClick={downloadReport}
                disabled={downloading || !displayData?.data?.report?.has_pdf}
              >
                <Download className="size-3.5" />
                {downloading ? "Loading" : "PDF"}
              </button>
            </div>

            {error ? <p className="mt-3 rounded-2xl bg-[#ff4d7d]/10 px-3 py-2 text-[0.72rem] font-medium text-[#ff8cab]">{error}</p> : null}

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-[1.35rem] bg-white/[0.06] p-1.5">
              {(["accounts", "enquiries", "repair"] as Tab[]).map((tab) => (
                <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
                  {toTitleCase(tab)}
                </TabButton>
              ))}
            </div>
          </div>

          <div className="mt-4 animate-[creditPanelIn_0.42s_ease-out]">
            {activeTab === "accounts" ? (
              <ReportAccountsTab accounts={accounts} loading={loading} />
            ) : activeTab === "enquiries" ? (
              <ReportEnquiriesTab enquiries={enquiries} loading={loading} />
            ) : (
              <ReportRepairTab accounts={accounts} />
            )}
          </div>
        </div>
      </PageContent>
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
        "flex items-center justify-center rounded-full px-2.5 py-2 text-[0.7rem] font-semibold capitalize transition duration-300",
        active ? "bg-[#4EE6D2] text-[#06111f] shadow-[0_10px_22px_rgba(78,230,210,0.22)]" : "text-[#9fb2c6] hover:bg-white/[0.08] hover:text-white",
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ReportAccountsTab({ accounts, loading }: { accounts: CreditAccount[]; loading: boolean }) {
  const items = buildReportAccounts(accounts);

  return (
    <div className="space-y-3">
      {loading ? (
        <ReportLoadingCard label="Loading accounts..." />
      ) : (
        items.map((account) => <ReportAccountCard key={account.id} account={account} />)
      )}
    </div>
  );
}

function ReportEnquiriesTab({ enquiries, loading }: { enquiries: CreditEnquiry[]; loading: boolean }) {
  const items = buildReportEnquiries(enquiries);

  return (
    <div className="space-y-3">
      <div className="rounded-[1.5rem] border border-[#ffd166]/25 bg-[#fff7df] px-4 py-3 shadow-sm">
        <div className="flex gap-3">
          <Info className="mt-0.5 size-4 shrink-0 text-[#d97706]" />
          <div>
            <p className="text-xs font-semibold text-[#111827]">Hard enquiries may affect approval chances</p>
            <p className="mt-1 text-[0.7rem] leading-4 text-[#7c6a45]">Multiple hard checks in a short period can reduce your score temporarily.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <ReportLoadingCard label="Loading enquiries..." />
      ) : (
        items.map((enquiry) => <ReportEnquiryCard key={enquiry.id} enquiry={enquiry} />)
      )}
    </div>
  );
}

function ReportRepairTab({ accounts }: { accounts: CreditAccount[] }) {
  const disputeStats = buildDisputeStats(accounts);
  const disputes = buildDisputeCards(accounts);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[1.75rem] bg-[#081625] text-white shadow-[0_18px_40px_rgba(8,22,37,0.2)]">
        <div className="bg-[radial-gradient(circle_at_85%_0%,rgba(78,230,210,0.28),transparent_34%),linear-gradient(160deg,#10243a,#081625)] px-4 py-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#4EE6D2]">Credit Repair Service</p>
          <h2 className="mt-2 text-base font-semibold">Repair negative report signals</h2>
          <p className="mt-2 text-[0.72rem] leading-5 text-[#9fb2c6]">Expert review, disputes, lender follow-up, and score verification in one guided flow.</p>
          <button className="mt-4 h-11 w-full rounded-2xl bg-[#ff4d7d] text-xs font-semibold text-white shadow-[0_14px_28px_rgba(255,77,125,0.26)]" type="button">
            Start Full Repair — ₹499/mo
          </button>
        </div>
      </section>

      <section className="rounded-[1.75rem] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#0f172a]">Repair timeline</h2>
        <div className="mt-4 space-y-3">
          {repairTimelineSteps.map((step, index) => (
            <div key={step} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e8fbf8] text-[0.68rem] font-semibold text-[#089981]">{index + 1}</span>
              <div className="border-b border-slate-100 pb-3 last:border-b-0">
                <p className="text-xs font-semibold text-[#172033]">{step}</p>
                <p className="mt-1 text-[0.68rem] text-[#64748b]">{repairTimelineCopy[index]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] bg-[#081625] p-4 text-white shadow-[0_18px_40px_rgba(8,22,37,0.2)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#4EE6D2]">Dispute Centre</p>
            <h2 className="mt-1 text-sm font-semibold">Case progress</h2>
          </div>
          <span className="rounded-full bg-[#ff4d7d]/14 px-3 py-1 text-[0.68rem] font-semibold text-[#ff8cab]">Live</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {disputeStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/[0.06] px-3 py-3">
              <p className="text-sm font-semibold">{stat.value}</p>
              <p className="mt-1 text-[0.62rem] leading-3 text-[#9fb2c6]">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {disputes.map((dispute) => (
            <div key={dispute.title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold">{dispute.title}</p>
                  <p className="mt-1 text-[0.68rem] text-[#9fb2c6]">{dispute.stage}</p>
                </div>
                <span className="rounded-full bg-[#4EE6D2]/12 px-2.5 py-1 text-[0.62rem] font-semibold text-[#4EE6D2]">{dispute.progress}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#4EE6D2]" style={{ width: `${dispute.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReportAccountCard({ account }: { account: ReportAccountItem }) {
  return (
    <article className="rounded-[1.65rem] bg-[#081625] p-4 text-white shadow-[0_18px_40px_rgba(8,22,37,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{account.lender}</h2>
          <p className="mt-1 text-[0.72rem] text-[#9fb2c6]">{account.loanType}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-3 py-1 text-[0.64rem] font-semibold", account.statusTone)}>
          {account.status}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={cn("rounded-full px-3 py-1.5 text-[0.66rem] font-semibold", account.impactTone)}>{account.impact}</span>
        <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[0.66rem] font-medium text-[#9fb2c6]">Opened {account.opened}</span>
      </div>
    </article>
  );
}

function ReportEnquiryCard({ enquiry }: { enquiry: ReportEnquiryItem }) {
  return (
    <article className="rounded-[1.65rem] bg-[#081625] p-4 text-white shadow-[0_18px_40px_rgba(8,22,37,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{enquiry.lender}</h2>
          <p className="mt-1 text-[0.72rem] text-[#9fb2c6]">{enquiry.loanType} • {enquiry.date}</p>
        </div>
        <span className={cn("shrink-0 rounded-full px-3 py-1 text-[0.64rem] font-semibold", enquiry.kind === "Hard" ? "bg-[#ff4d7d]/14 text-[#ff8cab]" : "bg-[#4EE6D2]/12 text-[#4EE6D2]")}>
          {enquiry.kind}
        </span>
      </div>
      {enquiry.pointsImpact ? <p className="mt-3 text-[0.72rem] font-medium text-[#ff8cab]">{enquiry.pointsImpact}</p> : null}
    </article>
  );
}

function ReportLoadingCard({ label }: { label: string }) {
  return (
    <div className="rounded-[1.65rem] bg-[#081625] p-4 text-[0.75rem] font-medium text-[#9fb2c6] shadow-[0_18px_40px_rgba(8,22,37,0.18)]">
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
        <span className={cn("rounded-full px-3 py-1.5 text-[0.68rem] font-bold", hasReport ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
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
            <p key={factor} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[0.68rem] font-bold leading-4 text-slate-500">
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
        <span>300</span>
        <span>900</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-2xl font-black text-[var(--portal-ink)]">
          {score ? displayScore : "--"}
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
            <p className="mt-1 text-xl font-bold text-slate-800">{value}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-slate-200 px-3 py-1.5 text-[0.68rem] font-bold text-slate-600">{rating}</span>
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
        <span className={cn("shrink-0 rounded-full px-3 py-1.5 text-[0.68rem] font-bold", overdue > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700")}>
          {overdue > 0 ? "Overdue" : "Current"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniMetric label="Balance" value={formatRupees(account.current_balance)} />
        <MiniMetric label="EMI" value={formatRupees(account.emi)} />
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
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[0.68rem] font-bold text-slate-700">
          {formatRupees(enquiry.enquiry_amount)}
        </span>
      </div>
    </AppCard>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[0.65rem] font-bold text-slate-500">{label}</p>
      <p className="mt-1 truncate text-xs font-black text-slate-900">{value}</p>
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
            <p className="mt-1 text-3xl font-black text-slate-950">{disabled ? "--" : predictedScore}</p>
          </div>
          <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold", delta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
            {delta >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            {disabled ? "No score" : `${delta >= 0 ? "+" : ""}${delta} points`}
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

function buildReportAccounts(accounts: CreditAccount[]): ReportAccountItem[] {
  const mappedAccounts = accounts.slice(0, 8).map((account, index) => {
    const overdue = readNumericValue(account.amount_overdue);
    const closed = Boolean(account.account_closed);
    const status: ReportAccountItem["status"] = closed ? "Closed" : overdue > 0 ? "Inactive" : "On Time";
    const highImpact = readNumericValue(account.high_credit_amount) >= 100000 || overdue > 0;

    return {
      id: `${account.member_name || "account"}-${account.type || index}`,
      impact: highImpact ? "High impact" : "Medium impact",
      impactTone: highImpact ? "bg-[#4EE6D2]/12 text-[#4EE6D2]" : "bg-[#ffd166]/14 text-[#ffd166]",
      lender: account.member_name || fallbackReportAccounts[index % fallbackReportAccounts.length].lender,
      loanType: toTitleCase(account.type || fallbackReportAccounts[index % fallbackReportAccounts.length].loanType),
      opened: formatCompactDate(account.opened),
      status,
      statusTone:
        status === "On Time"
          ? "bg-[#4EE6D2]/12 text-[#4EE6D2]"
          : status === "Closed"
            ? "bg-[#7895ff]/14 text-[#aebcff]"
            : "bg-white/[0.08] text-[#9fb2c6]",
    };
  });

  return mappedAccounts.length ? mappedAccounts : fallbackReportAccounts;
}

function buildReportEnquiries(enquiries: CreditEnquiry[]): ReportEnquiryItem[] {
  const mappedEnquiries = enquiries.slice(0, 8).map((enquiry, index) => {
    const amount = readNumericValue(enquiry.enquiry_amount);
    const kind: ReportEnquiryItem["kind"] = amount > 0 ? "Hard" : "Soft";

    return {
      date: formatCompactDate(enquiry.enquiry_date),
      id: `${enquiry.member || "enquiry"}-${enquiry.enquiry_date || index}`,
      kind,
      lender: enquiry.member || fallbackReportEnquiries[index % fallbackReportEnquiries.length].lender,
      loanType: toTitleCase(enquiry.enquiry_purpose || fallbackReportEnquiries[index % fallbackReportEnquiries.length].loanType),
      pointsImpact: kind === "Hard" ? `-${Math.min(8, Math.max(2, Math.round(amount / 100000) || 4))} pts impact` : undefined,
    };
  });

  return mappedEnquiries.length ? mappedEnquiries : fallbackReportEnquiries;
}

function buildDisputeStats(accounts: CreditAccount[]) {
  const activeDisputes = Math.max(1, accounts.filter((account) => readNumericValue(account.amount_overdue) > 0 || !account.account_closed).length);

  return [
    { label: "Active disputes", value: String(activeDisputes) },
    { label: "Resolved disputes", value: "3" },
    { label: "Points gained", value: "+42" },
  ];
}

function buildDisputeCards(accounts: CreditAccount[]) {
  const candidates = accounts.filter((account) => readNumericValue(account.amount_overdue) > 0 || !account.account_closed).slice(0, 2);
  const mappedDisputes = candidates.map((account, index) => ({
    progress: index === 0 ? 72 : 48,
    stage: index === 0 ? "Lender response pending" : "Documents under review",
    title: `${account.member_name || "Lender"} ${account.type ? toTitleCase(account.type) : "account"} dispute`,
  }));

  return mappedDisputes.length
    ? mappedDisputes
    : [
        { progress: 72, stage: "Lender response pending", title: "Incorrect active loan status" },
        { progress: 48, stage: "Documents under review", title: "Duplicate enquiry removal" },
      ];
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
  const numericValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
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
  if (!value) return "--";

  if (/^\d{8}$/.test(value)) {
    const day = value.slice(0, 2);
    const month = value.slice(2, 4);
    const year = value.slice(4);

    return `${day}/${month}/${year}`;
  }

  return value;
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

  return fileName ? decodeURIComponent(fileName.trim()) : "scorecare-cibil-report.pdf";
}

function toTitleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
