"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Landmark, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubscribePromptOverlay, useSubscribePrompt } from "@/components/dashboard/subscribe-prompt";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { CibilDisplayDataError, getCachedCibilDisplayData } from "@/lib/cibil-display-cache";
import { useSubscriptionAccess } from "@/lib/subscription-access";

type DisplayDataResponse = {
  data?: {
    display?: {
      score?: {
        value?: string | number | null;
        factors?: string[] | null;
      };
      accounts?: AccountRepairSignal[] | null;
    };
  };
};

type AccountRepairSignal = {
  amount_overdue?: string | number | null;
  written_off_amount_principal?: string | number | null;
  written_off_amount_total?: string | number | null;
  settlement_amount?: string | number | null;
};

type DashboardInsights = {
  scoreFixCount: number;
  loanEligibility: string;
};

export function DashboardInsightBanners() {
  const router = useRouter();
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const { isFreeTier, loading: accessLoading } = useSubscriptionAccess();
  const { closeSubscribePrompt, promptSubscribe, showSubscribePrompt } = useSubscribePrompt();

  useEffect(() => {
    if (accessLoading) {
      return;
    }

    if (isFreeTier) {
      void Promise.resolve().then(() => {
        setInsights(null);
        setLoading(false);
      });
      return;
    }

    function handleDisplayUpdate(event: Event) {
      const displayEvent = event as CustomEvent<DisplayDataResponse>;

      setInsights(readDashboardInsights(displayEvent.detail));
      setLoading(false);
    }

    window.addEventListener("scorecare:cibil-display-updated", handleDisplayUpdate);

    async function loadInsights() {
      const token = sessionStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      setLoading(true);

      try {
        const result = (await getCachedCibilDisplayData(token)) as DisplayDataResponse;

        setInsights(readDashboardInsights(result));
      } catch (loadError) {
        if (loadError instanceof CibilDisplayDataError && (loadError.status === 401 || loadError.status === 403)) {
          clearScorecareSession();
          router.replace("/login");
          return;
        }

        setInsights(null);
      } finally {
        setLoading(false);
      }
    }

    loadInsights();

    return () => {
      window.removeEventListener("scorecare:cibil-display-updated", handleDisplayUpdate);
    };
  }, [accessLoading, isFreeTier, router]);

  const scoreFixCount = insights?.scoreFixCount ?? 0;

  return (
    <>
      <SubscribePromptOverlay onClose={closeSubscribePrompt} show={showSubscribePrompt} />
      <VisualBanner
        icon={<ShieldCheck className="size-6" />}
        title="Score Fix"
        body="Open disputes, bureau notes, and repair steps in one desk."
        metric={isFreeTier ? "Subscribe" : loading ? "..." : `${scoreFixCount} ${scoreFixCount === 1 ? "action" : "actions"}`}
        accent="orange"
        onClick={isFreeTier ? promptSubscribe : undefined}
      />
      <VisualBanner
        icon={<Landmark className="size-6" />}
        title="Loan Eligibility"
        body="Pre-check your borrowing range before you apply."
        metric={isFreeTier ? "Subscribe" : loading ? "..." : insights?.loanEligibility ?? "--"}
        accent="blue"
        onClick={isFreeTier ? promptSubscribe : undefined}
      />
    </>
  );
}

function readDashboardInsights(result: DisplayDataResponse): DashboardInsights {
  const display = result.data?.display;
  const score = readNumericValue(display?.score?.value);
  const factorsCount = display?.score?.factors?.filter(Boolean).length ?? 0;
  const accountActionCount = display?.accounts?.filter(hasRepairSignal).length ?? 0;

  return {
    scoreFixCount: factorsCount + accountActionCount,
    loanEligibility: getLoanEligibility(score),
  };
}

function hasRepairSignal(account: AccountRepairSignal) {
  return (
    readNumericValue(account.amount_overdue) > 0 ||
    readNumericValue(account.written_off_amount_principal) > 0 ||
    readNumericValue(account.written_off_amount_total) > 0 ||
    readNumericValue(account.settlement_amount) > 0
  );
}

function readNumericValue(value: unknown) {
  const numberValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getLoanEligibility(score: number) {
  if (score >= 800) return "Up to Rs. 8.5L";
  if (score >= 750) return "Up to Rs. 6L";
  if (score >= 700) return "Up to Rs. 4L";
  if (score >= 650) return "Up to Rs. 2.5L";
  if (score >= 600) return "Up to Rs. 1L";

  return score > 0 ? "Review first" : "--";
}

function VisualBanner({
  icon,
  title,
  body,
  metric,
  accent,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  metric: string;
  accent: "blue" | "orange";
  onClick?: () => void;
}) {
  const isBlue = accent === "blue";

  return (
    <div className={`portal-card group relative overflow-hidden rounded-[var(--portal-radius)] border p-5 ${onClick ? "cursor-pointer" : ""}`} onClick={onClick}>
      <div className={`absolute inset-y-0 left-0 w-1 ${isBlue ? "bg-[var(--portal-blue)]" : "bg-[var(--portal-orange)]"}`} />
      <div className="relative z-10 flex items-center gap-4">
        <div className={`grid size-12 shrink-0 place-items-center rounded-xl ${isBlue ? "bg-[var(--portal-blue-soft)] text-[var(--portal-blue)]" : "bg-[var(--portal-orange-soft)] text-[var(--portal-orange)]"}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-black tracking-tight text-[var(--portal-ink)]">{title}</p>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-black ${isBlue ? "bg-[var(--portal-blue-soft)] text-[var(--portal-blue)]" : "bg-[var(--portal-orange-soft)] text-[var(--portal-orange)]"}`}>
              {metric}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-5 text-[var(--portal-muted)]">{body}</p>
        </div>
      </div>
    </div>
  );
}
