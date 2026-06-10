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
import { CibilDisplayDataError, getCachedCibilDisplayData } from "@/lib/cibil-display-cache";
import { useSubscriptionAccess } from "@/lib/subscription-access";
import { cn } from "@/lib/utils";

type Tab = "score" | "predictor";

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

export function CreditScoreExperience() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("score");
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
  const scoreFactors = displayData?.data?.display?.score?.factors?.filter(Boolean) ?? [];
  const accounts = displayData?.data?.display?.accounts ?? [];
  const enquiries = displayData?.data?.display?.enquiries ?? [];
  const behaviourItems = useMemo(
    () => buildBehaviourItems(displayData),
    [displayData],
  );
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

    if (isFreeTier) {
      setDisplayData(null);
      setError("");
      setLoading(false);
      return;
    }

    const token = sessionStorage.getItem("scorecare_token");

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

      setError("Could not load your latest CIBIL report data.");
      setDisplayData(null);
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
      <PortalTopBar title="Your CIBIL Score" />
      <PageContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Last updated: {loading ? "Loading..." : lastChecked ?? "--"}
            </p>
            <p className="mt-1 text-[0.72rem] text-slate-400">Track your score and test how actions may affect it.</p>
          </div>
          <button
            aria-label="Credit score information"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-cyan-600 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
            type="button"
            onClick={predictScoreWithAiHelp}
          >
            <Info className="size-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <TabButton active={activeTab === "score"} onClick={() => setActiveTab("score")}>
            <Gauge className="size-5" /> Score
          </TabButton>
          <TabButton active={activeTab === "predictor"} onClick={isFreeTier ? promptSubscribe : () => setActiveTab("predictor")}>
            <Sparkles className="size-5" /> Predictor
          </TabButton>
        </div>

        <div className="mt-5 space-y-6 animate-[creditPanelIn_0.42s_ease-out]">
          <ScorePanel
            downloading={downloading}
            error={error}
            factors={scoreFactors}
            hasReport={Boolean(displayData?.data?.report?.has_pdf)}
            lastChecked={lastChecked}
            loading={loading}
            onDownload={downloadReport}
            onRefresh={loadDisplayData}
            range={displayData?.data?.display?.score?.range ?? "300 to 900"}
            score={score}
          />

          {activeTab === "score" && !isFreeTier ? (
            <ScoreDetails
              accounts={accounts}
              behaviourItems={behaviourItems}
              enquiries={enquiries}
              loading={loading}
            />
          ) : activeTab === "predictor" && !isFreeTier ? (
            <PredictorPanel
              currentScore={baseScore}
              disabled={!score}
              onPredict={predictScoreWithAiHelp}
              predictedScore={predictedScore}
            />
          ) : null}
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
        "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition duration-300",
        active ? "scale-[1.01] bg-cyan-50 text-cyan-700 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
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

function readScore(result: DisplayDataResponse | null) {
  const score =
    result?.data?.display?.score?.value ??
    result?.data?.report?.credit_score;
  const numericScore = typeof score === "number" ? score : Number(score);

  return Number.isFinite(numericScore) && numericScore > 0 ? numericScore : null;
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
