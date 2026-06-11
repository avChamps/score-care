"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import dashboardBg from "@/assets/dashboard-bg.jpg";
import {
  ArrowUpRight,
  ArrowLeft,
  Bell,
  CircleHelp,
  Crown,
  FileText,
  Gift,
  Home,
  Lightbulb,
  Menu,
  ReceiptText,
  LogOut,
  ShieldAlert,
  Share2,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { DashboardAuthGuard } from "@/components/dashboard/dashboard-auth-guard";
import { SupportDrawer } from "@/components/dashboard/topbar-actions";
import { SubscribePromptOverlay, useSubscribePrompt } from "@/components/dashboard/subscribe-prompt";
import { CibilDisplayDataError, getCachedCibilDisplayData, getCachedCibilScoreCheckData, getStoredLatestCibilScoreCheckData } from "@/lib/cibil-display-cache";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

type DashboardData = {
  score: number | null;
  rating: string;
  grade: string;
  monthlyChange: number | string;
  sixMonthChange: number | string;
  targetScore: number | string;
  targetMonth: string;
  activeDisputes: number | string;
  scoreGain: number | string;
  emiDue: string;
  dueMonth: string;
  improvement: number | string;
  offers: number | string;
  trend: number[];
  factors: Array<{ name: string; value: number; meta: string; tone: "good" | "warn" | "alert" }>;
  coach: string;
  coachGain: number;
  coachTime: string;
};

type UserProfile = {
  accessType?: string | null;
  mobileNumber?: string;
  panNumber?: string;
  planStatus?: string | null;
  status?: string | null;
  subscription?: {
    accessType?: string | null;
    planStatus?: string | null;
    status?: string | null;
    subscriptionStatus?: string | null;
  } | null;
  subscriptionStatus?: string | null;
  fullName?: string;
  email?: string;
  dateOfBirth?: string;
  cibilScore?: string | number | null;
};

type NotificationItem = {
  createdAt?: string | null;
  id: string | number;
  isRead?: boolean | null;
  message?: string | null;
  title?: string | null;
};

const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const bottomNav = [
  { label: "Home", href: "/dashboard", Icon: Home },
  { label: "Report", href: "/report", Icon: FileText },
  { label: "Improve", href: "/dashboard/score-fix", Icon: TrendingUp },
  { label: "Offers", href: "/pricing", Icon: Gift },
  { label: "Loans", href: "/dashboard/loans", Icon: ReceiptText },
];
const notificationsPageSize = 10;
const actionPlanAiCache = new Map<string, Promise<string>>();

export function HomeDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("there");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData>(createEmptyDashboard());
  const [error, setError] = useState("");
  const [isFreeTier, setIsFreeTier] = useState(false);
  const [showBenefitsPrompt, setShowBenefitsPrompt] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { closeSubscribePrompt, promptSubscribe, showSubscribePrompt } = useSubscribePrompt();

  useEffect(() => {
    async function loadDashboard() {
      const token = sessionStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) {
        clearScorecareSession();
        window.location.replace("/login");
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const profile = await loadProfile(token);
        const freeTier = isFreeTierProfile(profile);
        const displayData = freeTier ? await loadBasicCibilScoreData(token, profile) : await loadCibilData(token, profile);

        setName(profile?.fullName?.trim() || readDisplayName(displayData) || "there");
        setProfile(profile);
        setIsFreeTier(freeTier);
        setDashboard(freeTier ? buildFreeTierDashboard(displayData) : buildDashboardData(displayData, profile));
      } catch (loadError) {
        if (loadError instanceof CibilDisplayDataError && (loadError.status === 401 || loadError.status === 403)) {
          clearScorecareSession();
          window.location.replace("/login");
          return;
        }

        setName(sessionStorage.getItem("scorecare_full_name")?.trim() || "there");
        setDashboard(createEmptyDashboard());
        setError("Score data is unavailable right now.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const visibleDashboard = dashboard;
  const score = visibleDashboard.score;
  const scorePercent = score ? Math.min(100, Math.max(0, ((score - 300) / 600) * 100)) : 0;
  const growth = visibleDashboard.trend.length > 1 ? visibleDashboard.trend[visibleDashboard.trend.length - 1] - visibleDashboard.trend[0] : 0;
  const lowScore = visibleDashboard.trend.length ? Math.min(...visibleDashboard.trend) : 0;
  const lowIndex = visibleDashboard.trend.indexOf(lowScore);
  const trendPoints = useMemo(
    () => visibleDashboard.trend.map((value, index) => `${(index / Math.max(1, visibleDashboard.trend.length - 1)) * 100},${100 - ((value - 300) / 600) * 100}`).join(" "),
    [visibleDashboard.trend],
  );
  const premiumClickProps = isFreeTier ? {
    onClick: () => setShowBenefitsPrompt(true),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setShowBenefitsPrompt(true);
      }
    },
    role: "button",
    tabIndex: 0,
  } : {};

  return (
    <div className="page min-h-screen overflow-x-hidden bg-[#070B12] pb-32 text-white [font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',system-ui,sans-serif]">
      <DashboardAuthGuard />
      <section
        className="hero-header fixed inset-x-0 top-0 z-0 min-h-[300px] bg-cover bg-center px-5 pb-28 pt-7 shadow-[0_22px_48px_rgba(108,114,255,0.26)] sm:px-8"
        style={{ backgroundImage: `linear-gradient(145deg, rgba(108,114,255,0.42), rgba(154,124,255,0.28)), url(${dashboardBg.src})` }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <button className="grid size-12 place-items-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_12px_24px_rgba(20,26,86,0.18)] backdrop-blur-xl" type="button" aria-label="Open profile menu" onClick={() => setShowProfile(true)}>
              <Menu className="size-6" strokeWidth={1.8} />
            </button>
            {isFreeTier ? (
              <button
                aria-label="Premium benefits"
                className="grid size-12 place-items-center rounded-full border border-white/20 bg-white/10 text-[#FFD34D] shadow-[0_12px_24px_rgba(20,26,86,0.18)] backdrop-blur-xl"
                type="button"
                onClick={() => setShowBenefitsPrompt(true)}
              >
                <Crown className="size-6 fill-[#FFD34D]/20" strokeWidth={1.8} />
              </button>
            ) : null}
          </div>

          <div className="mt-10">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase leading-none tracking-[3.5px] text-white/78">ScoreCare</p>
              <h1 className="mt-3 truncate text-[19px] font-semibold leading-6 text-white">Hi, {name} 👋</h1>
              <p className="mt-2 max-w-[17rem] text-[13px] font-medium leading-5 text-white/72">Your credit health dashboard is ready.</p>
            </div>
          </div>
        </div>
      </section>

      <main className="dashboard-shell relative z-10 mx-auto mt-[210px] max-w-5xl rounded-t-[32px] bg-[#070B12] px-4 pb-8 pt-5 shadow-[0_-18px_44px_rgba(7,11,18,0.48)] sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="mt-5 rounded-[26px] bg-[linear-gradient(145deg,#111821,#151E2A)] p-7 text-center text-[13px] font-medium text-[#AAB6C8] shadow-[0_18px_38px_rgba(0,0,0,0.2)]">Preparing your dashboard...</div>
        ) : score ? (
          <>
            <section {...premiumClickProps} className={cn("mt-5 rounded-[28px] bg-[radial-gradient(circle_at_80%_0%,rgba(94,242,194,0.12),transparent_34%),linear-gradient(145deg,#111821,#151E2A)] p-5 shadow-[0_22px_46px_rgba(0,0,0,0.24)]", isFreeTier && "cursor-pointer")}>
              <div className="grid gap-5 sm:grid-cols-[15rem_1fr] sm:items-center">
                <div className="relative mx-auto grid size-52 place-items-center">
                  <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 220 220" aria-hidden="true">
                    <circle cx="110" cy="110" r="94" fill="none" stroke="#273241" strokeWidth="14" />
                    <circle
                      cx="110"
                      cy="110"
                      r="94"
                      fill="none"
                      stroke={score >= 750 ? "#5EF2C2" : score >= 700 ? "#FFD34D" : "#FF5C8A"}
                      strokeLinecap="round"
                      strokeWidth="14"
                      strokeDasharray={`${scorePercent * 5.9} 590`}
                      className="drop-shadow-[0_0_12px_rgba(94,242,194,0.55)] transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-7 rounded-full bg-[#0B111A] shadow-[inset_0_12px_28px_rgba(0,0,0,0.26)]" />
                  <div className="relative text-center">
                    <p className="text-[46px] font-semibold leading-none tracking-normal">{score}</p>
                    <p className="mt-2 text-[11px] font-medium text-[#5EF2C2]">{visibleDashboard.rating}</p>
                    <p className="mt-1 text-[11px] font-medium text-[#AAB6C8]">out of 900</p>
                    <p className="mt-3 inline-flex rounded-full bg-white/8 px-3 py-1 text-[11px] font-medium text-[#FFD34D]">Grade {visibleDashboard.grade}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <SummaryTile label="Monthly" value={formatSignedValue(visibleDashboard.monthlyChange)} onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined} />
                  <SummaryTile label="6 Months" value={formatSignedValue(visibleDashboard.sixMonthChange)} onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined} />
                  <SummaryTile label="Target" value={String(visibleDashboard.targetScore)} target onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined} />
                </div>
              </div>
            </section>

            <section className="mt-5 grid grid-cols-2 gap-4">
              <QuickCard href="/dashboard/score-fix" Icon={ShieldAlert} title="Dispute Centre" value={formatActiveValue(visibleDashboard.activeDisputes)} meta={formatPossibleGain(visibleDashboard.scoreGain)} alert locked={isFreeTier} onLockedClick={() => setShowBenefitsPrompt(true)} />
              <QuickCard href="/dashboard/loans" Icon={ReceiptText} title="Pay EMIs" value={visibleDashboard.emiDue} meta={`Due ${visibleDashboard.dueMonth}`} locked={isFreeTier} onLockedClick={() => setShowBenefitsPrompt(true)} />
              <QuickCard href="/dashboard/score-fix" Icon={TrendingUp} title="Improve Score" value={formatSignedValue(visibleDashboard.improvement)} meta="score points" locked={isFreeTier} onLockedClick={() => setShowBenefitsPrompt(true)} />
              <QuickCard href="/pricing" Icon={Gift} title="Get Offers" value={`${visibleDashboard.offers}`} meta="pre-approved" offer locked={isFreeTier} onLockedClick={() => setShowBenefitsPrompt(true)} />
            </section>

            <section {...premiumClickProps} className={cn("mt-5 rounded-[28px] bg-[linear-gradient(145deg,#111821,#151E2A)] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.2)]", isFreeTier && "cursor-pointer")}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[17px] font-semibold tracking-normal">Score Journey</h2>
                <span className="rounded-full bg-[#5EF2C2]/12 px-3 py-1 text-[11px] font-medium text-[#5EF2C2]">+{growth} growth</span>
              </div>
              <svg className="mt-5 h-36 w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="10 month score trend">
                <defs>
                  <filter id="journeyGlow">
                    <feGaussianBlur stdDeviation="1.8" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <polyline points={trendPoints} fill="none" stroke="#5EF2C2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#journeyGlow)" />
                {visibleDashboard.trend.map((value, index) => (
                  <circle key={`${months[index]}-${value}`} cx={(index / Math.max(1, visibleDashboard.trend.length - 1)) * 100} cy={100 - ((value - 300) / 600) * 100} r="2.2" fill="#FFD34D" />
                ))}
              </svg>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <JourneyStat label="Lowest" value={`${lowScore} ${months[lowIndex]}`} onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined} />
                <JourneyStat label="Current" value={`${score} Jun`} onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined} />
                <JourneyStat label="Target" value={`${visibleDashboard.targetScore} ${visibleDashboard.targetMonth}`} gold onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined} />
              </div>
            </section>

            <section {...premiumClickProps} className={cn("mt-5 rounded-[28px] bg-[linear-gradient(145deg,#111821,#151E2A)] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.2)]", isFreeTier && "cursor-pointer")}>
              <h2 className="text-[17px] font-semibold tracking-normal">Score Factors</h2>
              <div className="mt-6 space-y-5">
                {visibleDashboard.factors.map((factor) => (
                  <div key={factor.name}>
                    <div className="flex items-center justify-between gap-3 text-[13px]">
                      <p className="font-medium text-white">{factor.name}</p>
                      <p className={cn("font-medium", factor.tone === "good" && "text-[#5EF2C2]", factor.tone === "warn" && "text-[#FFD34D]", factor.tone === "alert" && "text-[#FF5C8A]")}>{factor.meta}</p>
                    </div>
                    <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white/8">
                      <div
                        className={cn("h-full rounded-full shadow-[0_0_12px_currentColor]", factor.tone === "good" && "bg-[#5EF2C2] text-[#5EF2C2]", factor.tone === "warn" && "bg-[#FFD34D] text-[#FFD34D]", factor.tone === "alert" && "bg-[#FF5C8A] text-[#FF5C8A]")}
                        style={{ width: `${factor.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section {...premiumClickProps} className={cn("mt-5 rounded-[28px] bg-[radial-gradient(circle_at_100%_0%,rgba(94,242,194,0.14),transparent_34%),linear-gradient(135deg,#111821,#151E2A)] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.2)]", isFreeTier && "cursor-pointer")}>
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#5EF2C2]/14 text-[#5EF2C2]">
                  <Lightbulb className="size-7" />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-[#5EF2C2]">AI Credit Coach</p>
                  <h2 className="mt-2 text-[14px] font-medium leading-5 tracking-normal">{visibleDashboard.coach}</h2>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium">
                    <span className="rounded-full bg-[#5EF2C2]/12 px-3 py-1 text-[#5EF2C2]">+{visibleDashboard.coachGain} points</span>
                    <span className="rounded-full bg-white/8 px-3 py-1 text-[#AAB6C8]">{visibleDashboard.coachTime}</span>
                  </div>
                </div>
              </div>
              <button className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#5EF2C2,#22D983)] text-[13px] font-semibold text-[#06221a] shadow-[0_12px_24px_rgba(94,242,194,0.2)]" type="button" onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : () => setShowActionPlan(true)}>
                View Action Plan <ArrowUpRight className="size-5" />
              </button>
            </section>
          </>
        ) : (
          <div className="mt-5 rounded-[26px] bg-[linear-gradient(145deg,#111821,#151E2A)] p-7 text-center text-[13px] font-medium text-[#AAB6C8]">{error || visibleDashboard.coach}</div>
        )}
      </main>

      <div className="fixed bottom-4 left-0 right-0 z-30 px-4 pb-[env(safe-area-inset-bottom)]">
        <nav className="floating-bottom-nav mx-auto grid max-w-[20rem] grid-cols-5 rounded-full border border-white/10 bg-[#151E2A]/82 px-2 py-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.36)] backdrop-blur-2xl">
          {bottomNav.map(({ label, href, Icon }) => {
            const active = label === "Home";

            return (
              <Link
                key={label}
                href={href}
                data-dashboard-loans={href === "/dashboard/loans" ? "true" : undefined}
                aria-disabled={!active}
                tabIndex={active ? 0 : -1}
                className={cn("flex flex-col items-center justify-center gap-0.5 rounded-full px-0.5 py-1 text-[10px] font-medium text-[#8E99AA]", active ? "text-[#FFD34D]" : "pointer-events-none opacity-65")}
                onClick={(event) => {
                  if (!active) {
                    event.preventDefault();
                  }
                }}
              >
                <span className={cn("grid size-7 place-items-center rounded-full", active && "bg-[#FF7A00]/26 shadow-[0_0_16px_rgba(255,122,0,0.3)]")}>
                  <Icon className="size-4" strokeWidth={active ? 2.1 : 1.75} />
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {showProfile ? <ProfilePanel profile={profile} name={name} onClose={() => setShowProfile(false)} onHelp={() => setShowHelp(true)} /> : null}
      {showHelp ? (
        <div className="portal-theme fixed inset-0 z-[80] bg-[rgba(23,32,51,0.42)] backdrop-blur-sm" onClick={() => setShowHelp(false)}>
          <aside
            className="ml-auto flex h-dvh w-full max-w-md flex-col border-l border-[var(--portal-border)] bg-[var(--portal-bg)] shadow-[0_8px_24px_rgba(23,32,51,0.16)]"
            onClick={(event) => event.stopPropagation()}
          >
            <SupportDrawer onClose={() => setShowHelp(false)} />
          </aside>
        </div>
      ) : null}
      {showBenefitsPrompt ? (
        <BenefitsPrompt
          onClose={() => setShowBenefitsPrompt(false)}
          onSubscribe={() => {
            setShowBenefitsPrompt(false);
            promptSubscribe();
          }}
        />
      ) : null}
      {showActionPlan ? <ActionPlanPopup dashboard={visibleDashboard} onClose={() => setShowActionPlan(false)} /> : null}
      <SubscribePromptOverlay show={showSubscribePrompt} onClose={closeSubscribePrompt} />
    </div>
  );
}

function SummaryTile({ label, onClick, value, target = false }: { label: string; onClick?: () => void; value: string; target?: boolean }) {
  return (
    <button className={cn("rounded-[20px] bg-white/[0.06] p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]", onClick && "cursor-pointer")} type="button" onClick={onClick}>
      <p className="text-[11px] font-normal text-[#AAB6C8]">{label}</p>
      <p className={cn("mt-2 flex items-center gap-1 text-[16px] font-semibold", target ? "text-[#FFD34D]" : "text-[#5EF2C2]")}>
        {!target ? <ArrowUpRight className="size-4" /> : <Target className="size-4" />}
        {value}
      </p>
    </button>
  );
}

function QuickCard({ href, Icon, title, value, meta, alert = false, locked = false, offer = false, onLockedClick }: { href: string; Icon: typeof ShieldAlert; title: string; value: string; meta: string; alert?: boolean; locked?: boolean; offer?: boolean; onLockedClick?: () => void }) {
  if (locked) {
    return (
      <button className="min-h-36 rounded-[26px] bg-[radial-gradient(circle_at_85%_85%,rgba(94,242,194,0.11),transparent_35%),linear-gradient(145deg,#111821,#151E2A)] p-4 text-left shadow-[0_18px_36px_rgba(0,0,0,0.2)]" type="button" onClick={onLockedClick}>
        <QuickCardContent Icon={Icon} alert={alert} meta={meta} offer={offer} title={title} value={value} />
      </button>
    );
  }

  return (
    <button className="min-h-36 rounded-[26px] bg-[radial-gradient(circle_at_85%_85%,rgba(94,242,194,0.11),transparent_35%),linear-gradient(145deg,#111821,#151E2A)] p-4 text-left shadow-[0_18px_36px_rgba(0,0,0,0.2)]" type="button">
      <QuickCardContent Icon={Icon} alert={alert} meta={meta} offer={offer} title={title} value={value} />
    </button>
  );
}

function QuickCardContent({ Icon, alert, meta, offer, title, value }: { Icon: typeof ShieldAlert; alert?: boolean; meta: string; offer?: boolean; title: string; value: string }) {
  return (
    <>
      <span className={cn("grid size-12 place-items-center rounded-[18px] shadow-[0_12px_24px_rgba(0,0,0,0.2)]", alert ? "bg-[#FF5C8A]/14 text-[#FF5C8A]" : offer ? "bg-[#FFD34D]/14 text-[#FFD34D]" : "bg-[#5EF2C2]/14 text-[#5EF2C2]")}>
        <Icon className="size-6" strokeWidth={1.8} />
      </span>
      <p className="mt-4 text-[14px] font-medium leading-tight text-white">{title}</p>
      <p className="mt-2 text-[16px] font-semibold tracking-normal text-white">{value}</p>
      <p className={cn("mt-1 text-[12px] font-medium", alert ? "text-[#FF5C8A]" : offer ? "text-[#FFD34D]" : "text-[#5EF2C2]")}>{meta}</p>
    </>
  );
}

function JourneyStat({ label, onClick, value, gold = false }: { label: string; onClick?: () => void; value: string; gold?: boolean }) {
  return (
    <button className={cn("rounded-[20px] bg-white/[0.06] p-3 text-left", onClick && "cursor-pointer")} type="button" onClick={onClick}>
      <p className="text-[11px] font-normal text-[#AAB6C8]">{label}</p>
      <p className={cn("mt-1 text-[12px] font-semibold", gold ? "text-[#FFD34D]" : "text-white")}>{value}</p>
    </button>
  );
}

function ActionPlanPopup({ dashboard, onClose }: { dashboard: DashboardData; onClose: () => void }) {
  const [aiPlan, setAiPlan] = useState("");
  const [aiPlanError, setAiPlanError] = useState("");
  const [aiPlanLoading, setAiPlanLoading] = useState(true);
  const points = buildActionPlanPoints(dashboard);
  const aiPoints = parseAiActionPlanPoints(aiPlan);

  useEffect(() => {
    let active = true;

    async function loadAiActionPlan() {
      const token = sessionStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) {
        clearScorecareSession();
        window.location.replace("/login");
        return;
      }

      if (active) {
        setAiPlan("");
        setAiPlanError("");
        setAiPlanLoading(true);
      }

      try {
        const prompt = buildActionPlanAiPrompt(dashboard);
        let actionPlanRequest = actionPlanAiCache.get(prompt);

        if (!actionPlanRequest) {
          actionPlanRequest = loadGeminiActionPlan(token, prompt);
          actionPlanAiCache.set(prompt, actionPlanRequest);
        }

        const actionPlan = await actionPlanRequest;

        if (active) {
          setAiPlan(actionPlan);
        }
      } catch {
        if (active) {
          setAiPlanError("Could not load AI action plan right now.");
        }
      } finally {
        if (active) {
          setAiPlanLoading(false);
        }
      }
    }

    void loadAiActionPlan();

    return () => {
      active = false;
    };
  }, [dashboard]);

  return (
    <div className="fixed inset-0 z-[72] flex items-end bg-black/60 px-4 pb-4 backdrop-blur-sm">
      <section className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] bg-[#0D131C] shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <div className="bg-[radial-gradient(circle_at_90%_0%,rgba(94,242,194,0.28),transparent_35%),linear-gradient(145deg,#121C28,#0D131C)] px-5 pb-5 pt-4">
          <button className="ml-auto grid size-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur" type="button" aria-label="Close action plan" onClick={onClose}>
            <X className="size-5" />
          </button>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[3px] text-[#5EF2C2]">AI Credit Coach</p>
          <h2 className="mt-2 text-[22px] font-semibold leading-7 text-white">Your action plan</h2>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium">
            <span className="rounded-full bg-[#5EF2C2]/14 px-3 py-1 text-[#5EF2C2]">+{dashboard.coachGain} points</span>
            <span className="rounded-full bg-white/8 px-3 py-1 text-[#AAB6C8]">{dashboard.coachTime}</span>
          </div>
        </div>

        <div className="grid min-h-[216px] gap-3 px-5 py-5">
          {aiPlanLoading ? (
            <ActionPlanSkeleton />
          ) : null}
          {aiPlanError ? <p className="rounded-2xl bg-[#FF5C8A]/10 px-4 py-3 text-[13px] font-medium leading-5 text-[#FF8AAB]">{aiPlanError}</p> : null}
          {(!aiPlanLoading && aiPoints.length ? aiPoints : !aiPlanLoading && !aiPlan ? points : []).map(({ Icon, text, title, tone }) => (
            <div key={text} className="flex gap-3 rounded-2xl bg-white/[0.06] px-4 py-3">
              <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full", tone === "mint" ? "bg-[#5EF2C2]/14 text-[#5EF2C2]" : tone === "gold" ? "bg-[#FFD34D]/14 text-[#FFD34D]" : "bg-[#FF7A00]/14 text-[#FF9F45]")}>
                <Icon className="size-4" strokeWidth={2} />
              </span>
              <p className="text-[13px] font-medium leading-5 text-[#D7DEE9]">
                {title ? <span className="font-semibold text-white">{title}: </span> : null}
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

async function loadGeminiActionPlan(token: string, prompt: string) {
  try {
    const response = await apiRequest("/ai/gemini", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        message: prompt,
      },
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(readAiMessage(result) || "Unable to load action plan");
    }

    return readAiMessage(result);
  } catch (error) {
    actionPlanAiCache.delete(prompt);
    throw error;
  }
}

function ActionPlanSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex gap-3 rounded-2xl bg-white/[0.06] px-4 py-3">
          <span className="mt-0.5 size-8 shrink-0 animate-pulse rounded-full bg-white/10" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-2/5 animate-pulse rounded-full bg-white/12" />
            <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-4/5 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </>
  );
}

function buildActionPlanAiPrompt(dashboard: DashboardData) {
  return [
    "Create a concise personalized CIBIL improvement action plan.",
    "Return exactly 4 lines in this format: Title: action.",
    "Do not include markdown, numbering, bullets, or intro text. Keep it practical, specific, and under 90 words.",
    `Current score: ${dashboard.score ?? "unavailable"}`,
    `Target score: ${dashboard.targetScore} by ${dashboard.targetMonth}`,
    `Expected score gain: ${dashboard.coachGain} points in ${dashboard.coachTime}`,
    `Improvement gap: ${dashboard.improvement}`,
    `Active disputes/default items: ${dashboard.activeDisputes}`,
    `EMI due: ${dashboard.emiDue}`,
    `Credit factors: ${dashboard.factors.map((factor) => `${factor.name} ${factor.value}% (${factor.meta})`).join(", ") || "unavailable"}`,
    `Local coach note: ${dashboard.coach}`,
  ].join("\n");
}

function parseAiActionPlanPoints(plan: string) {
  const icons = [Target, Lightbulb, TrendingUp, ShieldAlert];
  const tones = ["gold", "mint", "mint", "orange"] as const;

  return plan
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "")
        .replace(/\*\*/g, "")
        .trim(),
    )
    .filter((line) => line && !/^here'?s\b/i.test(line))
    .slice(0, 4)
    .map((line, index) => {
      const [title, ...body] = line.split(":");
      const text = body.join(":").trim();

      return {
        Icon: icons[index] ?? Lightbulb,
        title: text ? title.trim() : "",
        text: text || line,
        tone: tones[index] ?? "mint",
      };
    });
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

function buildActionPlanPoints(dashboard: DashboardData) {
  const weakestFactor = dashboard.factors.filter((factor) => factor.value > 0).sort((first, second) => first.value - second.value)[0];

  return [
    {
      Icon: Target,
      title: "",
      text: `Move from ${dashboard.score} to ${dashboard.targetScore} by ${dashboard.targetMonth}.`,
      tone: "gold" as const,
    },
    {
      Icon: Lightbulb,
      title: "",
      text: weakestFactor ? `Focus first on ${weakestFactor.name.toLowerCase()} because it is marked ${weakestFactor.meta}.` : dashboard.coach,
      tone: "mint" as const,
    },
    {
      Icon: TrendingUp,
      title: "",
      text: `Expected improvement is ${formatSignedValue(dashboard.improvement)} points with a possible +${dashboard.coachGain} point gain.`,
      tone: "mint" as const,
    },
    {
      Icon: ShieldAlert,
      title: "",
      text: `${formatActiveValue(dashboard.activeDisputes)} dispute item needs review before applying for new credit.`,
      tone: "orange" as const,
    },
  ];
}

function BenefitsPrompt({ onClose, onSubscribe }: { onClose: () => void; onSubscribe: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/60 px-4 pb-4 backdrop-blur-sm">
      <section className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] bg-[#0D131C] shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <div
          className="min-h-44 bg-cover bg-center px-5 py-6"
          style={{ backgroundImage: `linear-gradient(180deg, rgba(9,14,22,0.1), rgba(9,14,22,0.9)), url(${dashboardBg.src})` }}
        >
          <button className="ml-auto grid size-9 place-items-center rounded-full bg-white/12 text-white backdrop-blur" type="button" aria-label="Close benefits" onClick={onClose}>
            <X className="size-5" />
          </button>
          <div className="mt-10 max-w-[18rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[3px] text-[#5EF2C2]">Premium Benefits</p>
            <h2 className="mt-2 text-[22px] font-semibold leading-7 text-white">Unlock your complete credit dashboard</h2>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="grid gap-3 text-[13px] font-medium leading-5 text-[#AAB6C8]">
            <p className="rounded-2xl bg-white/[0.06] px-4 py-3">Complete CIBIL report insights and score factors.</p>
            <p className="rounded-2xl bg-white/[0.06] px-4 py-3">Dispute tracking, EMI visibility, offers, and AI action plan.</p>
            <p className="rounded-2xl bg-white/[0.06] px-4 py-3">Personalized score improvement recommendations.</p>
          </div>

          <button className="mt-5 h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#FFD34D,#FF7A00)] text-[14px] font-semibold text-[#201300] shadow-[0_14px_28px_rgba(255,122,0,0.24)]" type="button" onClick={onSubscribe}>
            Subscription
          </button>
          <button className="mx-auto mt-3 block text-[11px] font-medium text-[#6F7B8E]" type="button" onClick={onClose}>
            skip for later
          </button>
        </div>
      </section>
    </div>
  );
}

function ProfilePanel({ name, onClose, onHelp, profile }: { name: string; onClose: () => void; onHelp: () => void; profile: UserProfile | null }) {
  const phone = profile?.mobileNumber || sessionStorage.getItem("scorecare_mobile_number") || "--";
  const completion = calculateProfileCompletion(profile);
  const [notificationError, setNotificationError] = useState("");
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  async function openNotifications() {
    const token = sessionStorage.getItem("scorecare_token");

    setShowNotifications(true);
    setNotificationError("");

    if (!token || isTokenExpired(token)) {
      setNotificationError("Please login again to view notifications.");
      return;
    }

    setNotificationLoading(true);

    try {
      setNotifications(await loadNotifications(token));
    } catch {
      setNotificationError("Unable to load notifications.");
    } finally {
      setNotificationLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#070B12] px-4 pb-28 pt-7 text-white [font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',system-ui,sans-serif]">
      <section className="relative mx-auto max-w-md overflow-hidden rounded-[30px] bg-[linear-gradient(160deg,#ebe7d9,#faf7ed_48%,#d9d0bd)] p-5 text-[#111827] shadow-[0_22px_46px_rgba(58,75,140,0.38)]">
        <button className="absolute left-5 top-5 grid size-8 place-items-center rounded-full bg-black/18 text-white backdrop-blur" type="button" aria-label="Close profile" onClick={onClose}>
          <X className="size-6" strokeWidth={1.6} />
        </button>

        <div className="mt-8 rounded-[24px] bg-white/35 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          <div className="mb-5 inline-flex rounded-full bg-[#C9F9DF] px-4 py-1.5 text-[11px] font-semibold text-[#07844E]">{completion}% Complete</div>
          <div className="grid gap-3.5">
            <ProfileField label="Full name" value={profile?.fullName || name} />
            <ProfileField label="Phone number" value={formatPhone(phone)} />
            <ProfileField label="PAN" value={profile?.panNumber || "--"} />
          </div>
        </div>

      </section>

      <section className="mx-auto mt-6 max-w-md rounded-[26px] bg-[#111821] p-5 shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
        <p className="text-[12px] font-medium uppercase tracking-wide text-[#AAB6C8]">Other Options</p>
        <ProfileOption title="Notification" Icon={Bell} onClick={openNotifications} />
        <ProfileOption title="Help" Icon={CircleHelp} onClick={onHelp} />
        <ProfileOption title="Share App" Icon={Share2} />
        <ProfileOption title="Logout" Icon={LogOut} danger onClick={logoutUser} />
      </section>

      {showNotifications ? (
        <NotificationsScreen
          error={notificationError}
          loading={notificationLoading}
          notifications={notifications}
          onBack={() => setShowNotifications(false)}
        />
      ) : null}

      <p className="mt-6 text-center text-[12px] font-normal text-[#6F7B8E]">Application Version 7.0.4</p>
    </div>
  );
}

function NotificationsScreen({ error, loading, notifications, onBack }: { error: string; loading: boolean; notifications: NotificationItem[]; onBack: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] bg-white text-[#1F2937] [font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',system-ui,sans-serif]">
      <header className="flex h-[72px] items-center gap-2 border-b border-black/10 bg-white px-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <button className="grid size-6 place-items-center text-[#1F2937]" type="button" aria-label="Back" onClick={onBack}>
          <ArrowLeft className="size-6" strokeWidth={2.2} />
        </button>
        <h1 className="text-[14px] font-semibold text-[#1F2937]">Notifications</h1>
      </header>

      <main>
        {loading ? (
          <p className="px-5 py-5 text-[12px] font-normal text-[#111827]">Loading notifications...</p>
        ) : error ? (
          <p className="px-5 py-5 text-[12px] font-normal text-[#FF5C8A]">{error}</p>
        ) : notifications.length ? (
          notifications.map((notification) => (
            <article key={notification.id} className="border-b border-black/20 px-5 py-5">
              <h2 className="text-[13px] font-semibold leading-5 text-black">{notification.title || "Notification"}</h2>
              <p className="mt-2 text-[12px] font-normal leading-5 text-black">{notification.message || "--"}</p>
              {notification.createdAt ? <p className="mt-5 text-right text-[11px] font-normal text-black">{formatNotificationRelativeTime(notification.createdAt)}</p> : null}
            </article>
          ))
        ) : (
          <p className="px-5 py-5 text-[12px] font-normal text-[#111827]">No notifications yet.</p>
        )}
      </main>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-[2.2px] text-[#6F7280]">{label}</p>
      <p className="mt-1 break-words text-[14px] font-semibold tracking-[0.6px] text-[#111827]">{value || "--"}</p>
    </div>
  );
}

function ProfileOption({ Icon, danger = false, href, onClick, title }: { Icon?: ComponentType<{ className?: string; strokeWidth?: number }>; danger?: boolean; href?: string; onClick?: () => void; title: string }) {
  const content = (
    <>
      <span className="flex items-center gap-3">
        {Icon ? <Icon className="size-5" strokeWidth={1.7} /> : null}
        <span className={cn("text-[14px] font-normal", danger ? "text-[#FF5C8A]" : "text-white")}>{title}</span>
      </span>
      <span className={cn("text-[24px] font-light leading-none", danger ? "text-[#FF5C8A]" : "text-white")}>›</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="flex w-full items-center justify-between border-b border-white/8 py-4 text-left last:border-b-0">
        {content}
      </Link>
    );
  }

  return (
    <button className="flex w-full items-center justify-between border-b border-white/8 py-4 text-left last:border-b-0" type="button" onClick={onClick}>
      {content}
    </button>
  );
}

async function loadProfile(token: string) {
  const response = await apiRequest("/users/me/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const result = await response.json();

  if (response.status === 401 || response.status === 403) {
    clearScorecareSession();
    window.location.replace("/login");
    return null;
  }

  if (!response.ok) {
    throw new Error(result?.message || "Unable to load profile");
  }

  const profile = readProfile(result);

  if (profile?.fullName) sessionStorage.setItem("scorecare_full_name", profile.fullName);
  if (profile?.mobileNumber) sessionStorage.setItem("scorecare_mobile_number", profile.mobileNumber);
  if (profile?.panNumber) sessionStorage.setItem("scorecare_pan_number", profile.panNumber);
  if (profile?.email) sessionStorage.setItem("scorecare_email", profile.email);
  if (profile?.dateOfBirth) sessionStorage.setItem("scorecare_date_of_birth", profile.dateOfBirth);

  return profile;
}

function readProfile(result: unknown) {
  if (!result || typeof result !== "object") {
    return null;
  }

  const response = result as {
    accessType?: unknown;
    data?: {
      accessType?: unknown;
      profile?: unknown;
      user?: unknown;
    };
    profile?: unknown;
    user?: unknown;
  };
  const profile = response.data?.user ?? response.data?.profile ?? response.user ?? response.profile ?? (response.data?.accessType ? response.data : result);

  return profile && typeof profile === "object" ? profile as UserProfile : null;
}

async function loadCibilData(token: string, profile: UserProfile | null) {
  try {
    const displayData = await getCachedCibilDisplayData(token, { forceRefresh: true });

    if (readScore(displayData)) {
      return displayData;
    }
  } catch {
    if (profile?.panNumber && profile.mobileNumber && profile.fullName) {
      return await getCachedCibilScoreCheckData(token, {
        pan: profile.panNumber,
        mobile: profile.mobileNumber,
        name: profile.fullName,
        consent: "Y",
        gender: "male",
      });
    }

    return getStoredLatestCibilScoreCheckData(token) ?? profile;
  }

  if (profile?.panNumber && profile.mobileNumber && profile.fullName) {
    return await getCachedCibilScoreCheckData(token, {
      pan: profile.panNumber,
      mobile: profile.mobileNumber,
      name: profile.fullName,
      consent: "Y",
      gender: "male",
    });
  }

  return getStoredLatestCibilScoreCheckData(token) ?? profile;
}

async function loadBasicCibilScoreData(token: string, profile: UserProfile | null) {
  if (!profile?.panNumber || !profile.mobileNumber || !profile.fullName) {
    return profile;
  }

  return getCachedCibilScoreCheckData(token, {
    pan: profile.panNumber,
    mobile: profile.mobileNumber,
    name: profile.fullName,
    consent: "Y",
    gender: "male",
  });
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
      notifications?: NotificationItem[] | null;
    };
    status?: string;
  };

  return result.status === "success" ? result.data?.notifications ?? [] : [];
}

function buildDashboardData(result: unknown, profile: UserProfile | null): DashboardData {
  const score = readScore(result) ?? readScore(profile);
  const accounts = readAccounts(result);
  const enquiries = readEnquiries(result);
  const summary = readReportSummary(result);
  const overdueAccounts = accounts.filter((account) => readNumber(account.amount_overdue ?? account.Amount_Past_Due) > 0).length;
  const defaultAccounts = summary.defaultAccounts || overdueAccounts;
  const emiDue = accounts.reduce((total, account) => total + readNumber(account.emi ?? account.Scheduled_Monthly_Payment_Amount), 0);
  const activeAccounts = summary.activeAccounts || accounts.filter(isActiveAccount).length;
  const utilization = calculateUtilization(accounts, summary.outstandingBalance);
  const targetScore = getTargetScore(score);
  const recentEnquiries = summary.recentEnquiries || enquiries.length;
  const paymentHistory = calculatePaymentHistory(accounts, defaultAccounts);
  const creditAge = calculateCreditAge(accounts);
  const trend = buildScoreTrend(score, accounts);

  return {
    score,
    rating: getRating(score),
    grade: getGrade(score),
    monthlyChange: 0,
    sixMonthChange: 0,
    targetScore,
    targetMonth: getTargetMonth(),
    activeDisputes: defaultAccounts,
    scoreGain: defaultAccounts ? defaultAccounts * 12 : 0,
    emiDue: emiDue ? formatCurrency(emiDue) : summary.outstandingBalance ? formatCurrency(summary.outstandingBalance) : "--",
    dueMonth: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date()),
    improvement: score ? Math.max(0, targetScore - score) : 0,
    offers: activeAccounts,
    trend,
    factors: [
      { name: "Payment History", value: paymentHistory.value, meta: paymentHistory.meta, tone: paymentHistory.tone },
      { name: "Credit Utilization", value: utilization.strength, meta: utilization.label, tone: utilization.tone },
      { name: "Credit Age", value: creditAge.value, meta: creditAge.meta, tone: creditAge.tone },
      { name: "Credit Mix", value: Math.min(90, activeAccounts * 18), meta: `${activeAccounts} active`, tone: activeAccounts > 1 ? "good" : "warn" },
      { name: "New Inquiries", value: recentEnquiries > 2 ? 45 : 78, meta: `${recentEnquiries} recent`, tone: recentEnquiries > 2 ? "alert" : "good" },
    ],
    coach: buildCoachText(defaultAccounts, utilization.percent, recentEnquiries),
    coachGain: defaultAccounts ? defaultAccounts * 12 : utilization.percent > 30 ? 24 : 0,
    coachTime: "30-60 days",
  };
}

function buildFreeTierDashboard(result: unknown): DashboardData {
  const score = readScore(result);

  return {
    score,
    rating: getRating(score),
    grade: getGrade(score),
    monthlyChange: "-",
    sixMonthChange: "-",
    targetScore: "-",
    targetMonth: "--",
    activeDisputes: "-",
    scoreGain: "-",
    emiDue: "-",
    dueMonth: "--",
    improvement: "-",
    offers: "-",
    trend: score ? Array.from({ length: 10 }, () => score) : [],
    factors: [
      { name: "Payment History", value: 0, meta: "-", tone: "warn" },
      { name: "Credit Utilization", value: 0, meta: "-", tone: "warn" },
      { name: "Credit Age", value: 0, meta: "-", tone: "warn" },
      { name: "Credit Mix", value: 0, meta: "-", tone: "warn" },
      { name: "New Inquiries", value: 0, meta: "-", tone: "warn" },
    ],
    coach: "Subscribe to unlock credit factors, disputes, EMIs, offers, and action plan.",
    coachGain: 0,
    coachTime: "--",
  };
}

function isFreeTierProfile(profile: UserProfile | null) {
  const accessType = normalizeStatus(profile?.accessType ?? profile?.subscription?.accessType);
  const subscriptionStatus = normalizeStatus(profile?.subscriptionStatus ?? profile?.subscription?.subscriptionStatus ?? profile?.subscription?.status ?? profile?.subscription?.planStatus ?? profile?.planStatus ?? profile?.status);

  if (["active", "paid", "premium", "subscribed"].some((status) => accessType.includes(status) || subscriptionStatus.includes(status))) {
    return false;
  }

  return ["free", "expired", "inactive"].some((status) => accessType.includes(status) || subscriptionStatus.includes(status));
}

function normalizeStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function createEmptyDashboard(message = "Score data is unavailable right now."): DashboardData {
  return {
    score: null,
    rating: "Unavailable",
    grade: "--",
    monthlyChange: 0,
    sixMonthChange: 0,
    targetScore: 0,
    targetMonth: "--",
    activeDisputes: 0,
    scoreGain: 0,
    emiDue: "--",
    dueMonth: "--",
    improvement: 0,
    offers: 0,
    trend: [],
    factors: [],
    coach: message,
    coachGain: 0,
    coachTime: "--",
  };
}

function readScore(result: unknown) {
  const data = result as {
    cibilScore?: unknown;
    score?: unknown;
    credit_score?: unknown;
    data?: {
      cibilScore?: unknown;
      score?: unknown;
      credit_score?: unknown;
      display?: { score?: { value?: unknown } };
      credit_report?: {
        SCORE?: {
          FCIREXScore?: unknown;
        };
      };
      report?: { cibilScore?: unknown; score?: unknown; credit_score?: unknown };
    };
  } | null;
  const value =
    data?.data?.display?.score?.value ??
    data?.data?.credit_report?.SCORE?.FCIREXScore ??
    data?.data?.report?.cibilScore ??
    data?.data?.report?.score ??
    data?.data?.report?.credit_score ??
    data?.data?.cibilScore ??
    data?.data?.score ??
    data?.data?.credit_score ??
    data?.cibilScore ??
    data?.score ??
    data?.credit_score;
  const score = readNumber(value);

  return score > 0 ? score : null;
}

function readDisplayName(result: unknown) {
  const data = result as { data?: { display?: { profile?: { name?: unknown } }; name?: unknown } } | null;
  const name = data?.data?.display?.profile?.name ?? data?.data?.name;

  return typeof name === "string" ? name.trim() : "";
}

function readAccounts(result: unknown) {
  const data = result as {
    data?: {
      display?: { accounts?: Array<Record<string, unknown>> };
      credit_report?: { CAIS_Account?: { CAIS_Account_DETAILS?: Array<Record<string, unknown>> } };
    };
  } | null;

  if (Array.isArray(data?.data?.display?.accounts)) return data.data.display.accounts;

  return Array.isArray(data?.data?.credit_report?.CAIS_Account?.CAIS_Account_DETAILS)
    ? data.data.credit_report.CAIS_Account.CAIS_Account_DETAILS
    : [];
}

function readEnquiries(result: unknown) {
  const data = result as {
    data?: {
      display?: { enquiries?: Array<Record<string, unknown>> };
      credit_report?: { CAPS?: { CAPS_Application_Details?: Array<Record<string, unknown>> } };
    };
  } | null;

  if (Array.isArray(data?.data?.display?.enquiries)) return data.data.display.enquiries;

  return Array.isArray(data?.data?.credit_report?.CAPS?.CAPS_Application_Details)
    ? data.data.credit_report.CAPS.CAPS_Application_Details
    : [];
}

function calculateUtilization(accounts: Array<Record<string, unknown>>, outstandingBalance: number) {
  const activeAccounts = accounts.filter(isActiveAccount);
  const totals = activeAccounts.reduce(
    (sum, account) => ({
      balance: sum.balance + readNumber(account.current_balance ?? account.Current_Balance),
      limit: sum.limit + readNumber(account.high_credit_amount ?? account.Credit_Limit_Amount ?? account.Highest_Credit_or_Original_Loan_Amount),
    }),
    { balance: 0, limit: 0 },
  );
  const balance = totals.balance || outstandingBalance;
  const percent = totals.limit ? Math.round((balance / totals.limit) * 100) : 0;

  if (percent > 50) return { percent, strength: 45, label: `${percent}% - Reduce`, tone: "alert" as const };
  if (percent > 30) return { percent, strength: 62, label: `${percent}% - Reduce`, tone: "warn" as const };

  return { percent, strength: 86, label: percent ? `${percent}%` : "Healthy", tone: "good" as const };
}

function isActiveAccount(account: Record<string, unknown>) {
  const closedValue = account.account_closed ?? account.Date_Closed;

  if (closedValue === null || closedValue === undefined || closedValue === "") {
    return true;
  }

  return !parseExperianDate(closedValue);
}

function readReportSummary(result: unknown) {
  const data = result as {
    data?: {
      credit_report?: {
        CAPS?: {
          CAPS_Summary?: {
            CAPSLast180Days?: unknown;
          };
        };
        CAIS_Account?: {
          CAIS_Summary?: {
            Credit_Account?: {
              CreditAccountTotal?: unknown;
              CreditAccountActive?: unknown;
              CreditAccountClosed?: unknown;
              CreditAccountDefault?: unknown;
            };
            Total_Outstanding_Balance?: {
              Outstanding_Balance_All?: unknown;
            };
          };
        };
      };
    };
  } | null;
  const creditAccount = data?.data?.credit_report?.CAIS_Account?.CAIS_Summary?.Credit_Account;
  const outstanding = data?.data?.credit_report?.CAIS_Account?.CAIS_Summary?.Total_Outstanding_Balance;

  return {
    totalAccounts: readNumber(creditAccount?.CreditAccountTotal),
    activeAccounts: readNumber(creditAccount?.CreditAccountActive),
    closedAccounts: readNumber(creditAccount?.CreditAccountClosed),
    defaultAccounts: readNumber(creditAccount?.CreditAccountDefault),
    outstandingBalance: readNumber(outstanding?.Outstanding_Balance_All),
    recentEnquiries: readNumber(data?.data?.credit_report?.CAPS?.CAPS_Summary?.CAPSLast180Days),
  };
}

function calculatePaymentHistory(accounts: Array<Record<string, unknown>>, defaultAccounts: number) {
  const latePayments = accounts.reduce((total, account) => {
    const history = account.CAIS_Account_History;

    if (!Array.isArray(history)) return total;

    return total + history.filter((item) => readNumber((item as Record<string, unknown>).Days_Past_Due) > 0).length;
  }, 0);

  if (defaultAccounts || latePayments > 2) {
    return { value: 58, meta: defaultAccounts ? `${defaultAccounts} default` : `${latePayments} late`, tone: "alert" as const };
  }

  if (latePayments) {
    return { value: 72, meta: `${latePayments} late`, tone: "warn" as const };
  }

  return { value: 94, meta: "Excellent", tone: "good" as const };
}

function calculateCreditAge(accounts: Array<Record<string, unknown>>) {
  const openDates = accounts
    .map((account) =>
      parseExperianDate(
        account.opened ??
        account.Open_Date ??
        account.open_date ??
        account.date_opened ??
        account.Date_Opened
      )
    )
    .filter((date): date is Date => Boolean(date));

  if (!openDates.length) {
    return { value: 50, meta: "Not available", tone: "warn" as const };
  }

  const oldest = openDates.reduce((min, date) => (date < min ? date : min), openDates[0]);
  const years = Math.max(0, (Date.now() - oldest.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  return {
    value: Math.min(95, Math.round((years / 10) * 100)),
    meta: `${years.toFixed(1)} yrs`,
    tone: years >= 3 ? "good" as const : "warn" as const,
  };
}

function buildScoreTrend(score: number | null, accounts: Array<Record<string, unknown>>) {
  if (!score) return [];

  const lateByMonth = new Map<string, number>();

  accounts.forEach((account) => {
    const history = account.CAIS_Account_History;

    if (!Array.isArray(history)) return;

    history.forEach((item) => {
      const record = item as Record<string, unknown>;
      const year = readNumber(record.Year);
      const month = readNumber(record.Month);

      if (!year || !month) return;

      const key = `${year}-${String(month).padStart(2, "0")}`;
      lateByMonth.set(key, (lateByMonth.get(key) ?? 0) + (readNumber(record.Days_Past_Due) > 0 ? 1 : 0));
    });
  });

  const keys = Array.from(lateByMonth.keys()).sort().slice(-10);

  if (!keys.length) return Array.from({ length: 10 }, () => score);

  let runningScore = Math.max(300, score - keys.length * 3);

  return keys.map((key, index) => {
    runningScore = Math.min(score, runningScore + (lateByMonth.get(key) ? 0 : 4));

    return index === keys.length - 1 ? score : runningScore;
  });
}

function parseExperianDate(value: unknown) {
  const raw = String(value ?? "").trim();

  if (!raw) return null;

  const digits = raw.replace(/\D/g, "");

  let yyyy = 0;
  let mm = 0;
  let dd = 0;

  if (/^\d{8}$/.test(digits)) {
    const firstFour = Number(digits.slice(0, 4));

    if (firstFour >= 1900) {
      yyyy = firstFour;
      mm = Number(digits.slice(4, 6));
      dd = Number(digits.slice(6, 8));
    } else {
      dd = Number(digits.slice(0, 2));
      mm = Number(digits.slice(2, 4));
      yyyy = Number(digits.slice(4, 8));
    }
  } else {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const currentYear = new Date().getFullYear();

  if (yyyy < 1900 || yyyy > currentYear) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;

  const date = new Date(yyyy, mm - 1, dd);

  return Number.isNaN(date.getTime()) ? null : date;
}

function readNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^\d.-]/g, ""));

  return Number.isFinite(number) ? number : 0;
}

function getRating(score: number | null) {
  if (!score) return "Unavailable";
  if (score >= 750) return "EXCELLENT";
  if (score >= 700) return "GOOD";
  if (score >= 650) return "FAIR";

  return "NEEDS WORK";
}

function getGrade(score: number | null) {
  if (!score) return "--";
  if (score >= 800) return "A+";
  if (score >= 750) return "A";
  if (score >= 700) return "B+";
  if (score >= 650) return "B";

  return "C";
}

function getTargetScore(score: number | null) {
  if (!score) return 0;
  if (score < 750) return 750;
  if (score < 800) return 800;
  if (score < 850) return 850;

  return Math.min(900, score + 25);
}

function getTargetMonth() {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);

  return new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "INR",
  }).format(value);
}

function formatSignedValue(value: number | string) {
  return typeof value === "number" ? `+${value}` : value;
}

function formatActiveValue(value: number | string) {
  return typeof value === "number" ? `${value} Active` : value;
}

function formatPossibleGain(value: number | string) {
  return typeof value === "number" ? `+${value} possible` : value;
}

function formatNotificationRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

function buildCoachText(overdueAccounts: number, utilization: number, enquiries: number) {
  if (overdueAccounts) return "Clear overdue accounts first to reduce negative repayment signals.";
  if (utilization > 30) return "Reduce credit utilization below 30% before your next statement date.";
  if (enquiries > 2) return "Pause new credit applications while recent enquiries cool down.";

  return "Maintain on-time payments and keep utilization low to protect your score.";
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) return "--";

  return digits.startsWith("91") && digits.length > 10 ? `+${digits.slice(0, 2)} ${digits.slice(2)}` : `+91 ${digits}`;
}

function calculateProfileCompletion(profile: UserProfile | null) {
  const fields = [profile?.fullName, profile?.mobileNumber, profile?.panNumber, profile?.email, profile?.dateOfBirth];
  const completed = fields.filter(Boolean).length;

  return Math.round((completed / fields.length) * 100);
}

function logoutUser() {
  clearScorecareSession();
  window.location.replace("/login");
}
