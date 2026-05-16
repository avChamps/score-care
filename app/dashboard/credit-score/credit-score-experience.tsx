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
import { useMemo, useState } from "react";
import {
  AppCard,
  PageContent,
  PortalShell,
  PortalTopBar,
  PrimaryPortalButton,
} from "@/components/dashboard/portal-ui";
import { cn } from "@/lib/utils";

type Tab = "score" | "predictor";

const behaviourItems = [
  {
    title: "Timely Payments",
    value: "94%",
    rating: "Good",
    body: "You have paid 94% of your dues on time. Consistent on-time payments positively impact your credit score.",
  },
  {
    title: "Credit Utilization",
    value: "38%",
    rating: "Good",
    body: "You are currently using 38% of your total available credit. Keeping utilization below 30% may help improve your score.",
  },
  {
    title: "Active Accounts",
    value: "3",
    rating: "Good",
    body: "You have 3 active credit accounts in good standing.",
  },
  {
    title: "Credit Age",
    value: "5.2 years",
    rating: "Stable",
    body: "A longer credit history generally strengthens your credit profile.",
  },
  {
    title: "Credit Mix",
    value: "Balanced",
    rating: "Good",
    body: "A healthy mix of secured and unsecured accounts can support long-term score strength.",
  },
];

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
  const [activeTab, setActiveTab] = useState<Tab>("score");
  const [score, setScore] = useState(782);
  const [lastChecked, setLastChecked] = useState("2023-01-01, 12:00");
  const [checksRemaining, setChecksRemaining] = useState(2);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [showScoreInfo, setShowScoreInfo] = useState(false);

  const predictedScore = useMemo(() => {
    const impact = predictorActions
      .filter((action) => selectedActions.includes(action.id))
      .reduce((total, action) => total + action.impact, 0);

    return Math.min(900, Math.max(300, score + impact));
  }, [score, selectedActions]);

  function refreshScore() {
    setScore(792);
    setLastChecked("Just now");
    setChecksRemaining((count) => Math.max(0, count - 1));
  }

  function downloadReport() {
    const report = [
      "SCORECARE Credit Report",
      `CIBIL Score: ${score}`,
      `Last checked: ${lastChecked}`,
      "",
      "Credit Behaviour",
      ...behaviourItems.map((item) => `${item.title}: ${item.value} (${item.rating}) - ${item.body}`),
    ].join("\n");

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scorecare-credit-report.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function toggleAction(id: string) {
    setSelectedActions((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <PortalShell active="score">
      <PortalTopBar title="Your CIBIL Score" />
      <PageContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">Last updated: 21/1/2026</p>
            <p className="mt-1 text-[0.72rem] text-slate-400">Track your score and test how actions may affect it.</p>
          </div>
          <button
            aria-label="Credit score information"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-cyan-600 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
            type="button"
            onClick={() => setShowScoreInfo(true)}
          >
            <Info className="size-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <TabButton active={activeTab === "score"} onClick={() => setActiveTab("score")}>
            <Gauge className="size-5" /> Score
          </TabButton>
          <TabButton active={activeTab === "predictor"} onClick={() => setActiveTab("predictor")}>
            <Sparkles className="size-5" /> Predictor
          </TabButton>
        </div>

        {activeTab === "score" ? (
          <div key="score-tab" className="mt-5 space-y-6 animate-[creditPanelIn_0.42s_ease-out]">
            <ScorePanel
              checksRemaining={checksRemaining}
              lastChecked={lastChecked}
              onDownload={downloadReport}
              onRefresh={refreshScore}
              score={score}
            />
            <section>
              <h2 className="text-lg font-bold tracking-tight text-slate-950">Your Credit Behaviour</h2>
              <div className="mt-3 grid gap-3">
                {behaviourItems.map((item, index) => (
                  <BehaviourCard key={item.title} index={index} {...item} />
                ))}
              </div>
            </section>
          </div>
        ) : (
          <PredictorPanel
            currentScore={score}
            onReset={() => setSelectedActions([])}
            onToggle={toggleAction}
            predictedScore={predictedScore}
            selectedActions={selectedActions}
          />
        )}
      </PageContent>
      {showScoreInfo ? <ScoreInfoDialog onClose={() => setShowScoreInfo(false)} /> : null}
    </PortalShell>
  );
}

function ScoreInfoDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-sm animate-[creditPanelIn_0.2s_ease-out]">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-4">
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

        <div className="mt-4 space-y-3 text-xs leading-5 text-slate-600">
          <p>
            A CIBIL score is a 3-digit credit score between 300 and 900. A higher score usually shows stronger repayment behaviour and may improve loan or credit card eligibility.
          </p>
          <p>
            Scores are influenced by on-time payments, credit utilization, credit age, account mix, and recent enquiries.
          </p>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="font-bold text-slate-800">Quick guide</p>
            <p className="mt-1">750+ is generally considered strong, 650-749 is moderate, and lower scores may need improvement.</p>
          </div>
        </div>

        <button
          className="mt-5 h-10 w-full rounded-full bg-cyan-600 text-xs font-bold text-white shadow-lg shadow-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-700"
          type="button"
          onClick={onClose}
        >
          Got it
        </button>
      </div>
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
  checksRemaining,
  lastChecked,
  onDownload,
  onRefresh,
  score,
}: {
  checksRemaining: number;
  lastChecked: string;
  onDownload: () => void;
  onRefresh: () => void;
  score: number;
}) {
  return (
    <AppCard className="animate-[creditPanelIn_0.45s_ease-out]">
      <div>
        <h2 className="text-base font-bold">Your CIBIL Score</h2>
        <p className="mt-1 text-xs text-slate-500">Last checked: {lastChecked}</p>
      </div>
      <CreditMeter score={score} />
      <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold leading-5 text-emerald-700">
        Good score! You have access to most loan products.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-xs font-bold text-slate-800 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-md"
          type="button"
          onClick={onRefresh}
        >
          <RotateCcw className="size-5" /> Get Latest Score
        </button>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-xs font-bold text-slate-800 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-200 hover:shadow-md"
          type="button"
          onClick={onDownload}
        >
          <Download className="size-5" /> Download Report
        </button>
      </div>
      <p className="mt-4 text-center text-xs font-medium text-slate-500">{checksRemaining} score checks remaining</p>
    </AppCard>
  );
}

function CreditMeter({ score }: { score: number }) {
  const percent = (score - 300) / 600;
  const angle = -180 + percent * 180;

  return (
    <div className="relative mx-auto mt-3 h-52 max-w-md">
      <svg className="absolute left-1/2 top-2 h-36 w-full max-w-sm -translate-x-1/2 overflow-visible animate-[meterFade_0.55s_ease-out]" viewBox="0 0 260 140" aria-hidden="true">
        <path d="M 20 120 A 110 110 0 0 1 240 120" fill="none" stroke="#e2e8f0" strokeLinecap="round" strokeWidth="20" />
        <path d="M 20 120 A 110 110 0 0 1 240 120" fill="none" pathLength="100" stroke="#ef4444" strokeDasharray="24 76" strokeDashoffset="0" strokeLinecap="round" strokeWidth="20" />
        <path d="M 20 120 A 110 110 0 0 1 240 120" fill="none" pathLength="100" stroke="#bef264" strokeDasharray="24 76" strokeDashoffset="-25" strokeLinecap="round" strokeWidth="20" />
        <path d="M 20 120 A 110 110 0 0 1 240 120" fill="none" pathLength="100" stroke="#34d399" strokeDasharray="24 76" strokeDashoffset="-50" strokeLinecap="round" strokeWidth="20" />
        <path d="M 20 120 A 110 110 0 0 1 240 120" fill="none" pathLength="100" stroke="#22c55e" strokeDasharray="24 76" strokeDashoffset="-75" strokeLinecap="round" strokeWidth="20" />
      </svg>
      <div
        className="absolute left-1/2 top-[6.65rem] h-2 w-24 origin-left rounded-full bg-cyan-500 transition-transform duration-700 ease-out [clip-path:polygon(0_50%,100%_0,100%_100%)]"
        style={{ transform: `rotate(${angle}deg)` }}
      />
      <div className="absolute left-1/2 top-[6.42rem] size-4 -translate-x-1/2 rounded-full bg-cyan-500 shadow-lg shadow-cyan-200 animate-[scoreGlow_1.9s_ease-in-out_infinite]" />
      <div className="absolute inset-x-0 bottom-9 flex justify-between text-base font-semibold text-slate-500">
        <span>300</span>
        <span>900</span>
      </div>
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center">
        <p className="text-2xl font-black text-slate-950">{score}</p>
        <p className="text-xs font-bold text-emerald-600">Excellent</p>
      </div>
    </div>
  );
}

function BehaviourCard({ title, value, rating, body, index }: { title: string; value: string; rating: string; body: string; index: number }) {
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
          <CheckCircle2 className="size-7 text-emerald-500" />
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-600">{body}</p>
    </AppCard>
  );
}

function PredictorPanel({
  currentScore,
  onReset,
  onToggle,
  predictedScore,
  selectedActions,
}: {
  currentScore: number;
  onReset: () => void;
  onToggle: (id: string) => void;
  predictedScore: number;
  selectedActions: string[];
}) {
  const delta = predictedScore - currentScore;

  return (
    <div key="predictor-tab" className="mt-5 space-y-5 animate-[creditPanelIn_0.42s_ease-out]">
      <div className="grid grid-cols-2 gap-3">
        {predictorActions.map(({ id, title, Icon, tone }, index) => {
          const selected = selectedActions.includes(id);

          return (
            <button
              key={id}
              className={cn(
                "min-h-32 rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg",
                selected && "border-cyan-300 bg-cyan-50 shadow-lg shadow-cyan-100",
              )}
              style={{ animationDelay: `${index * 45}ms` }}
              type="button"
              onClick={() => onToggle(id)}
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
      </div>

      <AppCard className="animate-[creditPanelIn_0.5s_ease-out_120ms_both]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-500">Predicted score</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{predictedScore}</p>
          </div>
          <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold", delta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
            {delta >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            {delta >= 0 ? "+" : ""}
            {delta} points
          </span>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Predictions are estimates based on common credit scoring patterns. Actual results may vary based on complete bureau data.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" type="button" onClick={onReset}>
            <XCircle className="size-4" /> Clear actions
          </button>
          <PrimaryPortalButton type="button" className="h-10 text-xs">
            <Sparkles className="size-4" /> Predict Score
          </PrimaryPortalButton>
        </div>
      </AppCard>
    </div>
  );
}
