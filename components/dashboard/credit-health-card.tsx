"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppCard } from "@/components/dashboard/portal-ui";
import { SubscribePromptOverlay, useSubscribePrompt } from "@/components/dashboard/subscribe-prompt";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { CibilDisplayDataError, getCachedCibilDisplayData } from "@/lib/cibil-display-cache";
import { useSubscriptionAccess } from "@/lib/subscription-access";

type DisplayDataResponse = {
  data?: {
    report?: {
      has_pdf?: boolean;
    };
    display?: {
      profile?: {
        name?: string | null;
        fetched_at?: string | null;
      };
      score?: {
        value?: string | number | null;
        factors?: string[];
        range?: string | null;
      };
      accounts?: unknown[];
      enquiries?: unknown[];
    };
  };
};

type CreditHealth = {
  score: number | null;
  scoreLabel: string;
  riskLabel: string;
  range: string;
  factors: string[];
  accountsCount: number;
  enquiriesCount: number;
  hasReport: boolean;
  fetchedAt: string | null;
};

export function CreditHealthCard() {
  const router = useRouter();
  const [health, setHealth] = useState<CreditHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isFreeTier, loading: accessLoading } = useSubscriptionAccess();
  const { closeSubscribePrompt, promptSubscribe, showSubscribePrompt } = useSubscribePrompt();

  useEffect(() => {
    if (accessLoading) {
      return;
    }

    if (isFreeTier) {
      void Promise.resolve().then(() => {
        setHealth(null);
        setError("Subscribe to unlock report health.");
        setLoading(false);
      });
      return;
    }

    function handleDisplayUpdate(event: Event) {
      const displayEvent = event as CustomEvent<DisplayDataResponse>;

      setHealth(readCreditHealth(displayEvent.detail));
      setError("");
      setLoading(false);
    }

    window.addEventListener("scorecare:cibil-display-updated", handleDisplayUpdate);

    async function loadCreditHealth() {
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

        setHealth(readCreditHealth(result));
      } catch (loadError) {
        if (loadError instanceof CibilDisplayDataError && (loadError.status === 401 || loadError.status === 403)) {
          clearScorecareSession();
          router.replace("/login");
          return;
        }

        setError("Credit health will appear after your latest CIBIL check.");
      } finally {
        setLoading(false);
      }
    }

    loadCreditHealth();

    return () => {
      window.removeEventListener("scorecare:cibil-display-updated", handleDisplayUpdate);
    };
  }, [accessLoading, isFreeTier, router]);

  const items = [
    { label: "Score", value: loading ? "..." : health?.score ? String(health.score) : "--", tone: getScoreTone(health?.score ?? null) },
    { label: "Accounts", value: loading ? "..." : String(health?.accountsCount ?? 0), tone: "text-[var(--portal-ink)]" },
    { label: "Enquiries", value: loading ? "..." : String(health?.enquiriesCount ?? 0), tone: "text-[var(--portal-blue)]" },
  ];

  return (
    <AppCard
      className={`relative overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_58%,#fff8f1_100%)] ${isFreeTier ? "cursor-pointer" : ""}`}
      onClick={isFreeTier ? promptSubscribe : undefined}
    >
      <SubscribePromptOverlay onClose={closeSubscribePrompt} show={showSubscribePrompt} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-caption font-black uppercase text-[var(--portal-orange)]">Credit health</p>
          <h2 className="mt-1 text-lg font-black tracking-tight text-[var(--portal-ink)]">
            {loading ? "Loading report health" : health ? `${health.scoreLabel} profile` : "Report not ready"}
          </h2>
          <p className="mt-1 text-xs leading-5 text-[var(--portal-muted)]">
            {health ? `${health.riskLabel}. ${health.range}` : error || "Run a CIBIL check to unlock report health."}
          </p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--portal-blue)] text-white shadow-[0_8px_18px_rgba(22,119,255,0.2)]">
          <Sparkles className="size-5" />
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-[var(--portal-border)] bg-white/85 p-3">
            <p className={`text-lg font-black leading-none ${item.tone}`}>{item.value}</p>
            <p className="mt-1 text-caption font-bold leading-tight text-[var(--portal-muted)]">{item.label}</p>
          </div>
        ))}
      </div>

      {health?.factors.length ? (
        <div className="mt-4 space-y-2">
          {health.factors.slice(0, 2).map((factor) => (
            <p key={factor} className="rounded-xl border border-[var(--portal-border)] bg-white/70 px-3 py-2 text-caption font-bold leading-4 text-[var(--portal-muted)]">
              {toTitleCase(factor)}
            </p>
          ))}
        </div>
      ) : null}

      {health?.fetchedAt ? <p className="mt-4 text-caption font-bold text-[var(--portal-muted)]">Fetched {formatDateTime(health.fetchedAt)}</p> : null}
    </AppCard>
  );
}

function readCreditHealth(result: DisplayDataResponse): CreditHealth {
  const display = result.data?.display;
  const score = readNumericScore(display?.score?.value);
  const status = getScoreStatus(score);

  return {
    score,
    scoreLabel: status.label,
    riskLabel: status.risk,
    range: display?.score?.range ?? "300 to 900",
    factors: display?.score?.factors ?? [],
    accountsCount: display?.accounts?.length ?? 0,
    enquiriesCount: display?.enquiries?.length ?? 0,
    hasReport: Boolean(result.data?.report?.has_pdf),
    fetchedAt: display?.profile?.fetched_at ?? null,
  };
}

function readNumericScore(value: unknown) {
  const score = typeof value === "number" ? value : Number(value);

  return Number.isFinite(score) && score > 0 ? score : null;
}

function getScoreStatus(score: number | null) {
  if (score === null) {
    return { label: "Pending", risk: "Not assessed" };
  }

  if (score >= 750) {
    return { label: "Strong", risk: "Low risk" };
  }

  if (score >= 650) {
    return { label: "Moderate", risk: "Needs attention" };
  }

  return { label: "At-risk", risk: "High risk" };
}

function getScoreTone(score: number | null) {
  if (score === null) {
    return "text-[var(--portal-muted)]";
  }

  if (score >= 750) {
    return "text-emerald-600";
  }

  if (score >= 650) {
    return "text-[var(--portal-orange)]";
  }

  return "text-rose-600";
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

function toTitleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
