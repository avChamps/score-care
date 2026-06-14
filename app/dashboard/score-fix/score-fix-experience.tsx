"use client";

import { Bell, Crown, Menu, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfilePanel, type UserProfile } from "@/app/dashboard/home-dashboard";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { CibilDisplayDataError, getCachedCibilDisplayData, getStoredLatestCibilScoreCheckData } from "@/lib/cibil-display-cache";
import { useSubscriptionAccess } from "@/lib/subscription-access";
import { cn } from "@/lib/utils";

const improveTabs = ["Simulator", "90-Day Plan"] as const;

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

const notificationsPageSize = 10;
const baselineUtilization = 42;
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
  const { isFreeTier } = useSubscriptionAccess();

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
                onClick={() => setActiveTab(tab)}
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

          {activeTab === "90-Day Plan" ? <Placeholder text="No plan available yet" /> : null}
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
  const positive = action.impact > 0;

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

function Placeholder({ text }: { text: string }) {
  return <div className="rounded-[24px] border border-white/10 bg-[#111821] p-5 text-sm font-semibold text-slate-400">{text}</div>;
}

function clampScore(score: number) {
  return Math.min(900, Math.max(300, Math.round(score)));
}

function getUtilizationImpact(utilization: number) {
  return Math.round((baselineUtilization - utilization) * 0.8);
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
