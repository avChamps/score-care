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
  Bot,
  ChartNoAxesCombined,
  CircleHelp,
  CreditCard,
  Crown,
  FileText,
  Gift,
  Home,
  Lightbulb,
  Languages,
  Menu,
  ReceiptText,
  LogOut,
  ShieldAlert,
  Share2,
  Target,
  TrendingUp,
  Wrench,
  X,
  LucideIcon,

  // FAQ Screen Icons
  Search,
  ChevronDown,
  ChevronLeft,
  Phone,
  Mail,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  House,
  BadgeIndianRupee,
  Sparkles,
  Star,
} from "lucide-react";

import { DashboardAuthGuard } from "@/components/dashboard/dashboard-auth-guard";
import { SupportDrawer } from "@/components/dashboard/topbar-actions";
import { SubscribePromptOverlay, getSubscriptionPlans, useSubscribePrompt } from "@/components/dashboard/subscribe-prompt";
import { Skeleton } from "@/components/ui/skeleton";
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
  hasReportData?: boolean;
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
  selectedLanguage?: string | null;
  cibilScore?: string | number | null;
};

type NotificationItem = {
  createdAt?: string | null;
  id: string | number;
  isRead?: boolean | null;
  message?: string | null;
  readAt?: string | null;
  title?: string | null;
};

type FaqCategory = {
  id: string;
  Icon: LucideIcon;
  label: string;
  color: string;
  questions: Array<{ q: string; a: string }>;
};

type GeneralSettings = {
  website: string;
  email: string;
  mobileNumber: string;
  whatsappNumber: string;
};

const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const bottomNav = [
  { label: "Home", href: "/dashboard", Icon: Home },
  { label: "Report", href: "/report", Icon: FileText },
  { label: "Improve", href: "/dashboard/score-fix", Icon: TrendingUp },
  { label: "Offers", href: "/pricing", Icon: Gift },
  { label: "Loans", href: "/dashboard/loans", Icon: ReceiptText },
];
const appTiles = [
  { href: "/dashboard/score-fix", Icon: Wrench, title: "Dispute Centre", value: "1 active", meta: "+25 pts", alert: true },
  { href: "/dashboard/loans", Icon: BadgeIndianRupee, title: "Pay EMIs", value: "₹29,050", meta: "due Jun" },
  { href: "/dashboard/credit-score", Icon: ChartNoAxesCombined, title: "Improve Score", value: "+58 pts", meta: "possible" },
  { href: "/pricing", Icon: CreditCard, title: "Get Offers", value: "3", meta: "pre-approved", offer: true },
];
const freeTierAppTiles = [
  { href: "/dashboard/credit-score", Icon: CreditCard, title: "Credit Score", value: "-", meta: "-" },
  { href: "/dashboard/loans", Icon: BadgeIndianRupee, title: "Pay EMIs", value: "-", meta: "-" },
  { href: "/dashboard/credit-score", Icon: ChartNoAxesCombined, title: "Improve Score", value: "-", meta: "-" },
  { href: "/pricing", Icon: CreditCard, title: "Get Offers", value: "-", meta: "-", offer: true },
];
const notificationsPageSize = 10;
const actionPlanAiCache = new Map<string, Promise<string>>();
const languageOptions = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
  { code: "mr", label: "Marathi" },
  { code: "bn", label: "Bengali" },
];
const faqCategoryStyles = [
  { Icon: House, color: "#6C63FF" },
  { Icon: BadgeIndianRupee, color: "#FF9D28" },
  { Icon: HelpCircle, color: "#07844E" },
];
const FAQ_DATA: FaqCategory[] = [
  {
    id: "general",
    Icon: House,
    label: "General",
    color: "#6C63FF",
    questions: [
      {
        q: "What is Scorecare?",
        a: "Scorecare is India's most complete credit health app...",
      },
      {
        q: "Is Scorecare free to use?",
        a: "Yes — the Starter plan is free forever...",
      },
    ],
  },
  {
    id: "scores",
    Icon: BadgeIndianRupee,
    label: "Credit Score",
    color: "#FF9D28",
    questions: [
      {
        q: "What is a credit score?",
        a: "A credit score is a 3-digit number between 300 and 900...",
      },
    ],
  },
];

export function HomeDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);
  const [name, setName] = useState("there");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData>(createEmptyDashboard());
  const [error, setError] = useState("");
  const [isFreeTier, setIsFreeTier] = useState(false);
  const [showBenefitsPrompt, setShowBenefitsPrompt] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
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
        setIsLanguageLoading(readStoredLanguage() !== "en");
        setError("");

        const profile = await loadProfile(token);
        const shouldWaitForLanguage = applyProfileLanguage(profile);
        setIsLanguageLoading(shouldWaitForLanguage);
        const freeTier = isFreeTierProfile(profile);
        const displayData = freeTier ? await loadBasicCibilScoreData(token, profile) : await loadCibilData(token, profile);

        setName(profile?.fullName?.trim() || readDisplayName(displayData) || "there");
        setProfile(profile);
        setIsFreeTier(freeTier);
        setDashboard(freeTier ? buildFreeTierDashboard(displayData) : buildDashboardData(displayData, profile));
        if (shouldWaitForLanguage) {
          await waitForLanguageApply();
        }
        setIsLanguageLoading(false);
      } catch (loadError) {
        if (loadError instanceof CibilDisplayDataError && (loadError.status === 401 || loadError.status === 403)) {
          clearScorecareSession();
          window.location.replace("/login");
          return;
        }

        setName(sessionStorage.getItem("scorecare_full_name")?.trim() || "there");
        setDashboard(createEmptyDashboard());
        setError("Score data is unavailable right now.");
        setIsLanguageLoading(false);
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
  const reportUnavailable = Boolean(error) || !visibleDashboard.hasReportData;
  const dashboardTiles = isFreeTier ? freeTierAppTiles : buildAppTiles(visibleDashboard, reportUnavailable);

  return (
    <div className="page min-h-screen overflow-x-hidden bg-[#050912] pb-32 text-white [font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',system-ui,sans-serif]">
      <DashboardAuthGuard />
      <div id="google_translate_element" className="hidden" />
      <section
        className="hero-header fixed inset-x-0 top-0 z-0 min-h-[340px] bg-cover bg-center px-5 pb-16 pt-6 shadow-[0_26px_58px_rgba(94,99,235,0.34)] sm:min-h-[430px] sm:px-8 sm:pb-28 sm:pt-7"
        style={{ backgroundImage: `linear-gradient(135deg, rgba(104,111,242,0.86), rgba(178,167,255,0.62) 48%, rgba(116,112,255,0.78)), url(${dashboardBg.src})` }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <button className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl sm:size-16" type="button" aria-label="Open profile menu" onClick={() => setShowProfile(true)}>
              <Menu className="size-5 sm:size-6" strokeWidth={1.8} />
            </button>
            {isFreeTier ? (
              <button
                aria-label="Premium benefits"
                className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-[#FFD34D] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl sm:size-16"
                type="button"
                onClick={() => setShowBenefitsPrompt(true)}
              >
                <Crown className="size-6 fill-[#FFD34D]/20" strokeWidth={1.8} />
              </button>
            ) : null}
          </div>

          <div className="mt-10 max-w-sm sm:mt-16">
            <div className="min-w-0">
              <p className="text-[18px] font-medium italic leading-5 text-[#10206B] sm:text-[20px] sm:leading-6">Up to</p>
              <h1 className="mt-1 text-[31px] font-bold italic leading-none text-[#10206B] sm:text-[35px]">800+</h1>
              <p className="mt-1.5 text-[20px] font-medium leading-5 text-white sm:text-[22px] sm:leading-6">Credit Ready</p>

              <p className="mt-4 inline-flex items-center rounded-full bg-[#112C8F] px-4 py-2 text-white shadow-[0_12px_26px_rgba(17,44,143,0.22)] sm:mt-5">
                <span className="text-[13px] font-medium sm:text-[14px]">
                  Hi,
                </span>
                <span className="ml-1 text-[12px] font-semibold sm:text-[13px]">
                  {name}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="dashboard-shell relative z-10 mx-auto mt-[280px] max-w-5xl rounded-t-[30px] bg-[#050912] px-4 pb-8 pt-5 sm:mt-[350px] sm:px-6 sm:pt-7 lg:px-8">
        {isLoading ? (
          <DashboardHomeSkeleton />
        ) : score ? (
          <>

            <section
              {...premiumClickProps}
              className={cn(
                "mt-3 overflow-hidden rounded-[14px] bg-[radial-gradient(circle_at_10%_100%,rgba(24,72,96,0.20),transparent_32%),radial-gradient(circle_at_86%_0%,rgba(28,61,95,0.24),transparent_34%),linear-gradient(145deg,#071522,#0A1725)] shadow-[0_18px_42px_rgba(0,0,0,0.30)]",
                isFreeTier && "cursor-pointer"
              )}
            >
              <div className="relative h-[235px] sm:h-[255px]">
                <div className="absolute left-1/2 top-2 grid size-[178px] -translate-x-1/2 place-items-center sm:size-[198px]">
                  <svg
                    className="absolute inset-0 size-full"
                    viewBox="0 0 220 220"
                    aria-hidden="true"
                  >
                    <defs>
                      <filter id="scoreArcGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <circle
                      cx="110"
                      cy="110"
                      r="86"
                      fill="none"
                      stroke="#203A62"
                      strokeLinecap="round"
                      strokeWidth="14"
                      pathLength="100"
                      strokeDasharray="75 25"
                      transform="rotate(135 110 110)"
                    />

                    <circle
                      cx="110"
                      cy="110"
                      r="86"
                      fill="none"
                      stroke={score >= 700 ? "#08DB69" : "#FF5C8A"}
                      strokeLinecap="round"
                      strokeWidth="14"
                      pathLength="100"
                      strokeDasharray={`${scorePercent * 0.75} 100`}
                      transform="rotate(135 110 110)"
                      filter="url(#scoreArcGlow)"
                      className="transition-all duration-500"
                    />
                  </svg>

                  <div className="absolute inset-[42px] rounded-full bg-[#091829] shadow-[inset_0_12px_28px_rgba(0,0,0,0.34)]" />

                  <div className="relative -mt-5 text-center">
                    <p className="text-[34px] font-black leading-none tracking-[-0.04em] text-white sm:text-[40px]">
                      {score}
                    </p>

                    <p className="mt-1 text-[9px] font-black tracking-[0.18em] text-[#08DB69] sm:text-[10px]">
                      {visibleDashboard.rating}
                    </p>

                    <p className="mt-1 text-[8px] font-normal text-[#AAB6C8] sm:text-[9px]">
                      out of 900
                    </p>

                    <p className="mt-1.5 text-[9px] font-black text-[#08DB69] sm:text-[10px]">
                      Grade {visibleDashboard.grade}+
                    </p>
                  </div>

                  <span className="absolute left-[5%] top-[74%] -translate-y-1/2 text-[10px] font-medium text-[#627286]">
                    300
                  </span>

                  <span className="absolute right-[5%] top-[74%] -translate-y-1/2 text-[10px] font-medium text-[#627286]">
                    900
                  </span>
                </div>

                <div className="absolute bottom-3 left-0 right-0 mx-3 grid h-[60px] grid-cols-3 overflow-hidden rounded-[13px] bg-[#172638] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <SummaryTile
                    label="This month"
                    value={formatSignedValue(visibleDashboard.monthlyChange)}
                    onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined}
                  />

                  <SummaryTile
                    label="6 months"
                    value={formatSignedValue(visibleDashboard.sixMonthChange)}
                    onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined}
                  />

                  <SummaryTile
                    label="Target"
                    value={String(visibleDashboard.targetScore)}
                    target
                    onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined}
                  />
                </div>
              </div>
            </section>


            <section className="mt-5 grid grid-cols-2 gap-4">
              {dashboardTiles.map((tile) => (
                <QuickCard key={tile.title} {...tile} disabled={!isFreeTier && reportUnavailable} locked={isFreeTier} onLockedClick={() => setShowBenefitsPrompt(true)} />
              ))}
              {/* <button className="min-h-[122px] rounded-[20px] border border-white/10 bg-white/[0.07] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_36px_rgba(0,0,0,0.24)] backdrop-blur-xl" type="button" onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : () => setShowActionPlan(true)}>
                <QuickCardContent Icon={Bot} meta="AI Agents" title="Your" value="Score Coach" />
              </button> */}
            </section>

            <section {...premiumClickProps} className={cn("mt-5 rounded-[28px] bg-[linear-gradient(145deg,#111821,#151E2A)] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.2)]", isFreeTier && "cursor-pointer")}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-medium tracking-normal">Score Journey</h2>
                <span className="rounded-full bg-[#5EF2C2]/12 px-3 py-1 text-[10px] font-medium text-[#5EF2C2]">+{growth} growth</span>
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
              <h2 className="text-[17px] font-bold tracking-normal">Score Factors</h2>
              <div className="mt-6 space-y-5">
                {visibleDashboard.factors.map((factor) => (
                  <div key={factor.name}>
                    <div className="flex items-center justify-between gap-3 text-[12px]">
                      <p className="font-normal text-[13px] text-white">{factor.name}</p>
                      <p className={cn("font-normal", factor.tone === "good" && "text-[#5EF2C2]", factor.tone === "warn" && "text-[#FFD34D]", factor.tone === "alert" && "text-[#FF5C8A]")}>{factor.meta}</p>
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
                  <p className="text-[11px] font-medium text-[#5EF2C2]">AI Credit Coach</p>
                  <h2 className="mt-2 text-[13px] font-normal leading-5 tracking-normal">{visibleDashboard.coach}</h2>
                  <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-medium">
                    <span className="rounded-full bg-[#5EF2C2]/12 px-3 py-1 text-[#5EF2C2]">+{visibleDashboard.coachGain} points</span>
                    <span className="rounded-full bg-white/8 px-3 py-1 text-[#AAB6C8]">{visibleDashboard.coachTime}</span>
                  </div>
                </div>
              </div>
              <button className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#5EF2C2,#22D983)] text-[12px] font-medium text-[#06221a] shadow-[0_12px_24px_rgba(94,242,194,0.2)]" type="button" onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : () => setShowActionPlan(true)}>
                View Action Plan <ArrowUpRight className="size-5" />
              </button>
            </section>
          </>
        ) : (
          <div className="mt-5 rounded-[26px] bg-[linear-gradient(145deg,#111821,#151E2A)] p-7 text-center text-[13px] font-medium text-[#AAB6C8]">{error || visibleDashboard.coach}</div>
        )}
      </main>

      <div className="fixed bottom-4 left-0 right-0 z-30 px-4 pb-[env(safe-area-inset-bottom)]">
        <nav className="floating-bottom-nav mx-auto grid max-w-[27rem] grid-cols-5 rounded-full border border-white/12 bg-[#171F29]/88 px-2 py-1.5 shadow-[0_18px_42px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
          {bottomNav.map(({ label, href, Icon }) => {
            const active = label === "Home";

            return (
              <Link
                key={label}
                href={href}
                data-dashboard-loans={href === "/dashboard/loans" ? "true" : undefined}
                aria-disabled={!active}
                tabIndex={active ? 0 : -1}
                className={cn("flex flex-col items-center justify-center gap-0.5 rounded-full px-0.5 py-1 text-[11px] font-normal text-[#B9C0CC]", active ? "text-[#FF9D28]" : "pointer-events-none opacity-72")}
                onClick={(event) => {
                  if (!active) {
                    event.preventDefault();
                  }
                }}
              >
                <span className={cn("grid size-8 place-items-center rounded-full", active && "bg-[#9B5C18]/74 shadow-[0_0_18px_rgba(255,122,0,0.4)]")}>
                  <Icon className="size-4" strokeWidth={active ? 2 : 1.65} />
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {isLanguageLoading ? <LanguageApplyLoader /> : null}
      {showProfile ? <ProfilePanel profile={profile} name={name} onClose={() => setShowProfile(false)} onHelp={() => setShowHelp(true)} onLanguageLoadingChange={setIsLanguageLoading} onProfileUpdate={setProfile} /> : null}
      {showHelp ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[rgba(7,11,18,0.66)] px-5 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
          <HelpSupportModal
            onClose={() => setShowHelp(false)}
            onLiveChat={() => {
              setShowHelp(false);
              setShowAiChat(true);
            }}
          />
        </div>
      ) : null}
      {showAiChat ? (
        <div className="portal-theme fixed inset-0 z-[90] bg-[rgba(23,32,51,0.42)] backdrop-blur-sm" onClick={() => setShowAiChat(false)}>
          <aside
            className="ml-auto flex h-dvh w-full max-w-md flex-col border-l border-white/[0.08] bg-[#050912] shadow-[0_8px_24px_rgba(0,0,0,0.32)]"
            onClick={(event) => event.stopPropagation()}
          >
            <SupportDrawer onClose={() => setShowAiChat(false)} />
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


function HelpSupportModal({ onClose, onLiveChat }: { onClose: () => void; onLiveChat: () => void }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [faqData, setFaqData] = useState<FaqCategory[]>([]);
  const [general, setGeneral] = useState<GeneralSettings | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [isFaqLoading, setIsFaqLoading] = useState(true);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [toast, setToast] = useState({ msg: "", visible: false });

  useEffect(() => {
    let isMounted = true;

    async function loadFaqs() {
      try {
        const response = await apiRequest("/faqs");

        if (!response.ok) {
          return;
        }

        const apiFaqs = readFaqCategories(await response.json());

        if (isMounted) {
          setFaqData(apiFaqs);
        }
      } catch {
        if (isMounted) {
          setFaqData([]);
        }
      } finally {
        if (isMounted) {
          setIsFaqLoading(false);
        }
      }
    }

    void loadFaqs();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadGeneral() {
      try {
        const response = await apiRequest("/general");

        if (!response.ok) {
          return;
        }

        const apiGeneral = readGeneralSettings(await response.json());

        if (isMounted) {
          setGeneral(apiGeneral);
        }
      } catch {
        if (isMounted) {
          setGeneral(null);
        }
      }
    }

    void loadGeneral();

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  };

  const openLiveChat = () => {
    onClose();
    onLiveChat();
  };

  async function submitHelpFeedback(isLiked: boolean) {
    if (feedbackLoading) return;

    setFeedbackLoading(true);

    try {
      await submitFeedback({
        rating: isLiked ? 5 : 1,
        message: isLiked ? "Help page was helpful" : "Help page was not helpful",
        isLiked,
        isDisliked: !isLiked,
      });
      window.dispatchEvent(new Event("scorecare:profile-notifications-refresh"));
      window.dispatchEvent(new Event("scorecare:notifications-updated"));
      showToast(isLiked ? "Thanks for the feedback!" : "We'll improve this page!");
    } catch {
      showToast("Unable to submit feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  }

  const searchLower = search.toLowerCase();

  const filteredData = faqData.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      (item) =>
        (!searchLower ||
          item.q.toLowerCase().includes(searchLower) ||
          item.a.toLowerCase().includes(searchLower)) &&
        (activeCategory === "all" || activeCategory === cat.id)
    ),
  })).filter((cat) => cat.questions.length > 0);

  const totalResults = filteredData.reduce((s, c) => s + c.questions.length, 0);
  const totalQ = faqData.reduce((s, c) => s + c.questions.length, 0);
  const supportEmail = general?.email.trim() || "";
  const supportMobile = general?.mobileNumber.trim() || "";
  const whatsappNumber = general?.whatsappNumber.trim() || "";
  const website = general?.website.trim() || "";

  const toggle = (key: string) => setOpenItem(openItem === key ? null : key);

  return (
    <section
      className="fixed inset-0 z-[80] overflow-y-auto bg-[#070B12] px-4 pb-28 pt-7 text-white [font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',system-ui,sans-serif]"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mx-auto max-w-md pb-10">
        <div
          className={cn(
            "fixed left-1/2 top-5 z-[9999] -translate-x-1/2 rounded-full bg-[#5EF2C2] px-5 py-2.5 text-[12px] font-semibold text-[#06221A] shadow-[0_14px_30px_rgba(94,242,194,0.22)] transition-transform",
            toast.visible ? "translate-y-0" : "-translate-y-24"
          )}
        >
          {toast.msg}
        </div>

        <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(160deg,#ebe7d9,#faf7ed_48%,#d9d0bd)] p-5 text-[#111827] shadow-[0_22px_46px_rgba(58,75,140,0.38)]">
          <div className="relative">
            <div className="mb-7 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="grid size-9 place-items-center rounded-full bg-black/15 text-white backdrop-blur"
                aria-label="Close help"
              >
                <ChevronLeft className="size-5" strokeWidth={1.8} />
              </button>

              <p className="rounded-full bg-white/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#6F7B8E]">Support</p>
            </div>

            <div className="grid size-14 place-items-center rounded-2xl bg-[#112C8F] text-white shadow-[0_12px_26px_rgba(17,44,143,0.22)]">
              <HelpCircle className="size-7" strokeWidth={1.8} />
            </div>

            <h2 className="mt-5 text-[26px] font-bold leading-tight text-[#10206B]">
              How can we help?
            </h2>

            <p className="mt-2 text-[12px] font-medium leading-5 text-[#6F7B8E]">
              {totalQ} answers across {faqData.length} topics
            </p>

            <div className="mt-5 flex items-center gap-2.5 rounded-[18px] border border-white/60 bg-white/50 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
              <Search className="size-5 text-[#6F7B8E]" strokeWidth={1.8} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search questions"
                className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#111827] outline-none placeholder:text-[#8A94A6]"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="grid size-6 place-items-center rounded-full bg-[#111827]/10 text-[#6F7B8E]"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" strokeWidth={2} />
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {[
                ["24/7", "Support", "#112C8F"],
                ["10 sec", "Response", "#FF9D28"],
                ["98%", "Resolved", "#07844E"],
              ].map(([value, label, color]) => (
                <div
                  key={label}
                  className="rounded-[16px] bg-white/45 px-2 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                >
                  <p className="text-[15px] font-bold" style={{ color }}>
                    {value}
                  </p>
                  <p className="mt-0.5 text-[9px] font-medium leading-snug text-[#6F7B8E]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-5 overflow-x-auto pb-1.5">
            <div className="flex w-max gap-2">
              <CategoryPill
                Icon={Sparkles}
                label="All Topics"
                color="#6C63FF"
                active={activeCategory === "all"}
                onClick={() => setActiveCategory("all")}
              />

              {faqData.map((cat) => (
                <CategoryPill
                  key={cat.id}
                  Icon={cat.Icon}
                  label={cat.label}
                  color={cat.color}
                  active={activeCategory === cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                />
              ))}
            </div>
          </div>

          {search ? (
            <div className="mb-4 rounded-[18px] bg-[#111821] px-4 py-3 text-[12px] font-medium text-[#AAB6C8]">
              {totalResults > 0 ? (
                <>
                  Found{" "}
                  <strong className="text-[#5EF2C2]">
                    {totalResults} answer{totalResults > 1 ? "s" : ""}
                  </strong>{" "}
                  for &quot;{search}&quot;
                </>
              ) : (
                <>No results for &quot;{search}&quot; - try different words</>
              )}
            </div>
          ) : null}

          {isFaqLoading ? (
            <FaqSkeleton />
          ) : filteredData.length === 0 ? (
            <div className="rounded-[26px] bg-[#111821] px-5 py-10 text-center">
              <Search className="mx-auto mb-3 size-9 text-[#6F7B8E]" strokeWidth={1.7} />
              <p className="mb-2 text-[16px] font-semibold text-white">
                No results found
              </p>
              <p className="text-[12px] leading-6 text-[#AAB6C8]">
                Try different words or browse a category above.
              </p>
            </div>
          ) : null}

          {filteredData.map((cat) => (
            <div key={cat.id} className="mb-7">
              {(activeCategory === "all" || !search) && (
                <div className="mb-3 flex items-center gap-2.5">
                  <div
                    className="grid size-[36px] place-items-center rounded-[14px] border"
                    style={{
                      backgroundColor: `${cat.color}22`,
                      borderColor: `${cat.color}44`,
                      color: cat.color,
                    }}
                  >
                    <cat.Icon className="size-5" strokeWidth={1.8} />
                  </div>

                  <div>
                    <p className="text-[14px] font-semibold text-white">
                      {cat.label}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-[#AAB6C8]">
                      {cat.questions.length} question
                      {cat.questions.length > 1 ? "s" : ""}
                    </p>
                  </div>

                  <div
                    className="ml-2 h-px flex-1"
                    style={{ backgroundColor: `${cat.color}22` }}
                  />
                </div>
              )}

              {cat.questions.map((item, index) => {
                const key = `${cat.id}-${index}`;

                return (
                  <AccordionItem
                    key={key}
                    q={item.q}
                    a={item.a}
                    color={cat.color}
                    index={index}
                    isOpen={openItem === key}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          ))}

          <div className="mb-4 rounded-[26px] bg-[#111821] p-5 shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
            <h3 className="text-[15px] font-semibold text-white">
              Still need help?
            </h3>
            <p className="mt-1 text-[12px] leading-6 text-[#AAB6C8]">
              Contact SCORECARE support for profile, report, subscription, and score queries.
            </p>

            <div className="mt-4 flex gap-2.5">
              <ContactCard
                Icon={MessageCircle}
                label="Live Chat"
                sub="Reply in 10 sec"
                color="#5EF2C2"
                onClick={openLiveChat}
              />
              <ContactCard
                Icon={Phone}
                label="Call Us"
                sub="Mon-Sat"
                color="#FF9D28"
                onClick={() => {
                  if (supportMobile) {
                    window.location.href = `tel:${supportMobile}`;
                  }
                }}
              />
              <ContactCard
                Icon={Mail}
                label="Email"
                sub="24 hrs"
                color="#6C63FF"
                onClick={() => {
                  if (supportEmail) {
                    window.location.href = `mailto:${supportEmail}?subject=Scorecare Support`;
                  }
                }}
              />
            </div>
          </div>

          <button
            type="button"
            className="mb-4 flex w-full items-center gap-3.5 rounded-[22px] bg-[linear-gradient(135deg,#5EF2C2,#22D983)] px-4 py-3.5 text-left text-[#06221A] shadow-[0_12px_24px_rgba(94,242,194,0.2)]"
            onClick={() => {
              if (whatsappNumber) {
                window.open(`https://wa.me/${toDialNumber(whatsappNumber)}`, "_blank");
              }
            }}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-[16px] bg-white/30">
              <MessageCircle className="size-6" strokeWidth={1.8} />
            </span>

            <span className="flex-1">
              <span className="block text-[13px] font-semibold">
                Chat on WhatsApp
              </span>
              <span className="mt-0.5 block text-[11px] font-medium opacity-75">
                Get help for disputes, payments and score queries
              </span>
            </span>

            <ArrowUpRight className="size-5" strokeWidth={1.8} />
          </button>

          <div className="rounded-[22px] bg-[#111821] px-4 py-4">
            <p className="mb-3 text-[13px] font-semibold text-white">
              Was this page helpful?
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={feedbackLoading}
                onClick={() => submitHelpFeedback(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[16px] bg-[#5EF2C2]/12 p-2.5 text-[12px] font-semibold text-[#5EF2C2]"
              >
                <ThumbsUp className="size-4" strokeWidth={1.8} /> Yes
              </button>

              <button
                type="button"
                disabled={feedbackLoading}
                onClick={() => submitHelpFeedback(false)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[16px] bg-[#FF5C8A]/12 p-2.5 text-[12px] font-semibold text-[#FF5C8A]"
              >
                <ThumbsDown className="size-4" strokeWidth={1.8} /> No
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] font-medium text-[#6F7B8E]">
            {website ? "SCORECARE support" : ""}
          </p>
        </div>
      </div>
    </section>
  );
}

function CategoryPill({ active, color, Icon, label, onClick }: { active: boolean; color: string; Icon: ComponentType<{ className?: string; strokeWidth?: number }>; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn("flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-semibold transition", active ? "text-white" : "text-[#AAB6C8]")}
      style={{
        backgroundColor: active ? color : "#111821",
        borderColor: active ? `${color}66` : "rgba(255,255,255,0.07)",
      }}
      onClick={onClick}
    >
      <Icon className="size-4" strokeWidth={1.8} />
      {label}
    </button>
  );
}

function FaqSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-12 bg-white/[0.06]" />
      <Skeleton className="h-12 bg-white/[0.06]" />
      <Skeleton className="h-12 bg-white/[0.06]" />
      <Skeleton className="h-12 bg-white/[0.06]" />
    </div>
  );
}

function AccordionItem({ a, color, index, isOpen, onToggle, q }: { a: string; color: string; index: number; isOpen: boolean; onToggle: () => void; q: string }) {
  return (
    <div className="mb-2.5 overflow-hidden rounded-[20px] bg-[#111821] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <button type="button" className="flex w-full items-center gap-3 px-4 py-3.5 text-left" onClick={onToggle}>
        <span className="grid size-8 shrink-0 place-items-center rounded-[12px] text-[11px] font-semibold" style={{ backgroundColor: `${color}22`, color }}>
          {index + 1}
        </span>
        <span className="flex-1 text-[13px] font-medium leading-5 text-white">{q}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-[#AAB6C8] transition-transform", isOpen && "rotate-180")} strokeWidth={1.8} />
      </button>
      {isOpen ? <p className="border-t border-white/[0.06] px-4 py-3 text-[12px] leading-6 text-[#AAB6C8]">{a}</p> : null}
    </div>
  );
}

function readFaqCategories(result: unknown): FaqCategory[] {
  const value = result as { data?: unknown; faqs?: unknown };
  const data = value?.data as { categories?: unknown; faqs?: unknown; items?: unknown } | unknown[];
  const source = Array.isArray(data)
    ? data
    : Array.isArray(data?.categories)
      ? data.categories
      : Array.isArray(data?.faqs)
        ? data.faqs
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(value?.faqs)
            ? value.faqs
            : [];

  if (source.some((item) => Array.isArray((item as { questions?: unknown })?.questions))) {
    return source.map((category, index) => normalizeFaqCategory(category, index)).filter((category) => category.questions.length);
  }

  return groupFlatFaqs(source);
}

function normalizeFaqCategory(category: unknown, index: number): FaqCategory {
  const item = category as { category?: unknown; categoryLabel?: unknown; id?: unknown; label?: unknown; name?: unknown; questions?: unknown; title?: unknown };
  const style = faqCategoryStyles[index % faqCategoryStyles.length];
  const label = String(item.categoryLabel ?? item.label ?? item.name ?? item.title ?? item.category ?? "General");
  const id = String(item.id ?? label.toLowerCase().replace(/\s+/g, "-"));
  const questions = Array.isArray(item.questions) ? item.questions.map(normalizeFaqItem).filter(isFaqItem) : [];

  return {
    id,
    Icon: style.Icon,
    label,
    color: style.color,
    questions,
  };
}

function groupFlatFaqs(faqs: unknown[]): FaqCategory[] {
  const categories = new Map<string, Array<{ q: string; a: string }>>();

  faqs.forEach((faq) => {
    const item = faq as { answer?: unknown; category?: unknown; categoryLabel?: unknown; question?: unknown; title?: unknown };
    const question = String(item.question ?? item.title ?? "").trim();
    const answer = String(item.answer ?? "").trim();

    if (!question || !answer) {
      return;
    }

    const category = String(item.categoryLabel ?? item.category ?? "General");
    categories.set(category, [...(categories.get(category) ?? []), { q: question, a: answer }]);
  });

  return Array.from(categories.entries()).map(([label, questions], index) => {
    const style = faqCategoryStyles[index % faqCategoryStyles.length];

    return {
      id: label.toLowerCase().replace(/\s+/g, "-"),
      Icon: style.Icon,
      label,
      color: style.color,
      questions,
    };
  });
}

function normalizeFaqItem(faq: unknown) {
  const item = faq as { a?: unknown; answer?: unknown; q?: unknown; question?: unknown; title?: unknown };
  const question = String(item.q ?? item.question ?? item.title ?? "").trim();
  const answer = String(item.a ?? item.answer ?? "").trim();

  return question && answer ? { q: question, a: answer } : null;
}

function isFaqItem(faq: { q: string; a: string } | null): faq is { q: string; a: string } {
  return Boolean(faq);
}

function readGeneralSettings(result: unknown): GeneralSettings {
  const value = result as { data?: Partial<GeneralSettings> };

  return {
    website: String(value.data?.website ?? ""),
    email: String(value.data?.email ?? ""),
    mobileNumber: String(value.data?.mobileNumber ?? ""),
    whatsappNumber: String(value.data?.whatsappNumber ?? ""),
  };
}

function toDialNumber(value: string) {
  return value.replace(/\D/g, "");
}

function ContactCard({ color, Icon, label, onClick, sub }: { color: string; Icon: ComponentType<{ className?: string; strokeWidth?: number }>; label: string; onClick: () => void; sub: string }) {
  return (
    <button type="button" className="flex-1 rounded-[18px] bg-white/[0.06] px-2 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" onClick={onClick}>
      <span className="mx-auto grid size-9 place-items-center rounded-[13px]" style={{ backgroundColor: `${color}22`, color }}>
        <Icon className="size-5" strokeWidth={1.8} />
      </span>
      <span className="mt-2 block text-[11px] font-semibold text-white">{label}</span>
      <span className="mt-0.5 block text-[9px] font-medium leading-snug text-[#AAB6C8]">{sub}</span>
    </button>
  );
}



function SummaryTile({
  label,
  onClick,
  value,
  target = false,
}: {
  label: string;
  onClick?: () => void;
  value: string;
  target?: boolean;
}) {
  const positive = String(value).startsWith("+");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col items-center justify-center border-r border-white/[0.03] px-1 text-center last:border-r-0",
        onClick && "cursor-pointer"
      )}
    >
      <p
        className={cn(
          "flex items-center justify-center gap-1 text-[16px] font-black leading-none tracking-[-0.02em] sm:text-[18px]",
          target ? "text-[#FFD21F]" : "text-[#00F0C8]"
        )}
      >
        {!target && positive ? (
          <ArrowUpRight className="size-4" strokeWidth={3} />
        ) : null}
        {value}
      </p>

      <p className="mt-2 truncate text-[11px] font-medium text-[#AAB6C8] sm:text-[12px]">
        {label}
      </p>
    </button>
  );
}

function DashboardHomeSkeleton() {
  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-[24px] bg-[linear-gradient(145deg,#111821,#151E2A)] p-3 shadow-[0_22px_46px_rgba(0,0,0,0.24)] sm:rounded-[28px] sm:p-5">
        <div className="grid gap-4">
          <div className="mx-auto grid size-36 place-items-center rounded-full bg-white/[0.06] sm:size-52">
            <div className="size-24 animate-pulse rounded-full bg-white/[0.08] sm:size-36" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-[16px] bg-white/[0.06] sm:h-20 sm:rounded-[20px]" />
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={cn("animate-pulse rounded-[20px] bg-[#121820]", index < 2 ? "min-h-36" : "min-h-24")} />
        ))}
      </section>

      <section className="rounded-[28px] bg-[linear-gradient(145deg,#111821,#151E2A)] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.2)]">
        <div className="h-4 w-28 animate-pulse rounded-full bg-white/[0.08]" />
        <div className="mt-5 h-32 animate-pulse rounded-[22px] bg-white/[0.06]" />
      </section>
    </div>
  );
}

function LanguageApplyLoader() {
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#050912] px-4 pb-8 pt-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="size-14 animate-pulse rounded-full bg-white/[0.08] sm:size-16" />
          <div className="size-14 animate-pulse rounded-full bg-white/[0.08] sm:size-16" />
        </div>
        <div className="mt-12">
          <div className="h-4 w-36 animate-pulse rounded-full bg-white/[0.08]" />
          <div className="mt-3 h-7 w-52 animate-pulse rounded-full bg-white/[0.08]" />
        </div>
        <main className="mt-12 rounded-t-[30px] bg-[#050912] pb-8 pt-5">
          <DashboardHomeSkeleton />
        </main>
      </div>
    </div>
  );
}

function buildAppTiles(dashboard: DashboardData, unavailable: boolean) {
  if (unavailable) {
    return appTiles.map((tile) => ({ ...tile, value: "-", meta: "-" }));
  }

  return [
    {
      ...appTiles[0],
      value: dashboard.activeDisputes === "-" ? "-" : `${dashboard.activeDisputes} active`,
      meta: dashboard.scoreGain === "-" ? "-" : `${formatSignedValue(dashboard.scoreGain)} pts`,
    },
    {
      ...appTiles[1],
      value: dashboard.emiDue || "-",
      meta: dashboard.dueMonth && dashboard.dueMonth !== "--" ? `due ${dashboard.dueMonth}` : "-",
    },
    {
      ...appTiles[2],
      value: dashboard.improvement === "-" ? "-" : `${formatSignedValue(dashboard.improvement)} pts`,
      meta: dashboard.improvement === "-" ? "-" : "possible",
    },
    {
      ...appTiles[3],
      value: String(dashboard.offers ?? "-"),
      meta: dashboard.offers === "-" ? "-" : "pre-approved",
    },
  ];
}

function QuickCard({ disabled = false, href, Icon, title, value, meta, alert = false, locked = false, offer = false, onLockedClick }: { disabled?: boolean; href: string; Icon: ComponentType<{ className?: string; strokeWidth?: number }>; title: string; value: string; meta: string; alert?: boolean; locked?: boolean; offer?: boolean; onLockedClick?: () => void }) {
  const className = "min-h-[122px] rounded-[20px] border border-white/10 bg-white/[0.07] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_36px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:bg-white/[0.1]";

  if (disabled) {
    return (
      <div className={className}>
        <QuickCardContent Icon={Icon} alert={alert} meta={meta} offer={offer} title={title} value={value} />
      </div>
    );
  }

  if (locked) {
    return (
      <button className={className} data-dashboard-subscribe="true" type="button" onClick={onLockedClick}>
        <QuickCardContent Icon={Icon} alert={alert} meta={meta} offer={offer} title={title} value={value} />
      </button>
    );
  }

  return (
    <Link className={className} href={href}>
      <QuickCardContent Icon={Icon} alert={alert} meta={meta} offer={offer} title={title} value={value} />
    </Link>
  );
}

function QuickCardContent({ Icon, alert, meta, offer, title, value }: { Icon: ComponentType<{ className?: string; strokeWidth?: number }>; alert?: boolean; meta: string; offer?: boolean; title: string; value: string }) {
  return (
    <>
      <span className={cn("grid size-10 place-items-center rounded-[13px] border border-white/10 bg-[#173B66]/80 text-[#DFEBFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_18px_rgba(21,101,192,0.3)]", alert && "bg-[#4B1E43]/70 text-[#FF8AAB]", offer && "bg-[#4A431C]/70 text-[#FFD34D]")}>
        <Icon className="size-5" strokeWidth={1.7} />
      </span>
      <p className="mt-4 text-[13px] font-black leading-5 text-white">{title}</p>
     <p
  className={cn(
    "mt-1 text-[11px] font-lighter tracking-normal",
    alert
      ? "text-[#FF5C8A]"
      : offer
      ? "text-[#FFD34D]"
      : "text-[#21E6C1]"
  )}
>
  {value} {meta}
</p>
     
     </>
  );
}

function JourneyStat({ label, onClick, value, gold = false }: { label: string; onClick?: () => void; value: string; gold?: boolean }) {
  return (
    <button className={cn("rounded-[20px] bg-white/[0.06] p-3 text-left", onClick && "cursor-pointer")} type="button" onClick={onClick}>
      <p className="text-[10px] font-normal text-[#AAB6C8]">{label}</p>
      <p className={cn("mt-1 text-[11px] font-medium", gold ? "text-[#FFD34D]" : "text-white")}>{value}</p>
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

function BenefitsSkeleton() {
  return (
    <>
      <Skeleton className="h-11 bg-white/[0.06]" />
      <Skeleton className="h-11 bg-white/[0.06]" />
      <Skeleton className="h-11 bg-white/[0.06]" />
    </>
  );
}

function BenefitsPrompt({ onClose, onSubscribe }: { onClose: () => void; onSubscribe: () => void }) {
  const [showLeavingMessage, setShowLeavingMessage] = useState(false);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [isLoadingBenefits, setIsLoadingBenefits] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadBenefits() {
      try {
        const plans = await getSubscriptionPlans();
        const apiBenefits = Array.from(new Set(plans.flatMap((plan) => plan.benefits).filter(Boolean)));

        if (isMounted) {
          setBenefits(apiBenefits);
        }
      } catch {
        if (isMounted) {
          setBenefits([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBenefits(false);
        }
      }
    }

    void loadBenefits();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/60 px-4 pb-4 backdrop-blur-sm">
      <section className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] bg-[#0D131C] shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <div
          className="min-h-44 bg-cover bg-center px-5 py-6"
          style={{ backgroundImage: `linear-gradient(180deg, rgba(9,14,22,0.1), rgba(9,14,22,0.9)), url(${dashboardBg.src})` }}
        >
          <button className="ml-auto grid size-9 place-items-center rounded-full bg-white/12 text-white backdrop-blur" type="button" aria-label="Close benefits" onClick={() => setShowLeavingMessage(true)}>
            <X className="size-5" />
          </button>
          <div className="mt-10 max-w-[18rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[3px] text-[#5EF2C2]">Premium Benefits</p>
            <h2 className="mt-2 text-[22px] font-semibold leading-7 text-white">Unlock your complete credit dashboard</h2>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="grid gap-3 text-[13px] font-medium leading-5 text-[#AAB6C8]">
            {isLoadingBenefits ? <BenefitsSkeleton /> : benefits.map((benefit) => (
              <p key={benefit} className="rounded-2xl bg-white/[0.06] px-4 py-3">{benefit}</p>
            ))}
          </div>

          <button className="mt-5 h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#FFD34D,#FF7A00)] text-[14px] font-semibold text-[#201300] shadow-[0_14px_28px_rgba(255,122,0,0.24)]" type="button" onClick={onSubscribe}>
            Subscription
          </button>
          <button className="mx-auto mt-3 block text-[11px] font-medium text-[#6F7B8E]" type="button" onClick={() => setShowLeavingMessage(true)}>
            skip for later
          </button>
        </div>
      </section>
      {showLeavingMessage ? (
        <div className="absolute inset-0 z-10 flex items-end bg-black/60 px-4 pb-4 backdrop-blur-sm" onClick={onClose}>
          <section className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] bg-[#0D131C] shadow-[0_24px_70px_rgba(0,0,0,0.42)]" onClick={(event) => event.stopPropagation()}>
            <div
              className="min-h-44 bg-cover bg-center px-5 py-6"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(9,14,22,0.1), rgba(9,14,22,0.9)), url(${dashboardBg.src})` }}
            >
              <button className="ml-auto grid size-9 place-items-center rounded-full bg-white/12 text-white backdrop-blur" type="button" aria-label="Close benefits message" onClick={onClose}>
                <X className="size-5" />
              </button>
              <div className="mt-10 max-w-[18rem]">
                <p className="text-[11px] font-semibold uppercase tracking-[3px] text-[#5EF2C2]">Before you leave</p>
                <h2 className="mt-2 text-[22px] font-semibold leading-7 text-white">Enjoy more benefits with premium</h2>
              </div>
            </div>

            <div className="px-5 pb-5 pt-4">
              <div className="grid gap-3 text-[13px] font-medium leading-5 text-[#AAB6C8]">
                {isLoadingBenefits ? <BenefitsSkeleton /> : benefits.map((benefit) => (
                  <p key={benefit} className="rounded-2xl bg-white/[0.06] px-4 py-3">{benefit}</p>
                ))}
              </div>

              <button className="mt-5 h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#FFD34D,#FF7A00)] text-[14px] font-semibold text-[#201300] shadow-[0_14px_28px_rgba(255,122,0,0.24)]" type="button" onClick={onSubscribe}>
                View subscription
              </button>
              <button className="mx-auto mt-3 block text-[11px] font-medium text-[#6F7B8E]" type="button" onClick={onClose}>
                Continue free
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function DownloadReportsPopup({ downloads, onClose }: { downloads: Array<{ id: string; downloadedAt: string; title: string }>; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/60 px-4 pb-4 backdrop-blur-sm">
      <section className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] bg-[#0D131C] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-bold text-white">Download Reports</h2>
          <button className="grid size-9 place-items-center rounded-full bg-white/10 text-white" type="button" aria-label="Close download reports" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        {downloads.length ? (
          <div className="mt-5 space-y-3">
            {downloads.map((download) => (
              <div key={download.id} className="rounded-[18px] bg-white/[0.06] px-4 py-3">
                <p className="text-[13px] font-semibold text-white">{download.title}</p>
                <p className="mt-1 text-[11px] text-[#AAB6C8]">{formatDownloadDateTime(new Date(download.downloadedAt))}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-white/[0.06]">
              <div className="grid size-14 animate-pulse place-items-center rounded-full bg-[#5EF2C2]/12 text-[#5EF2C2]">
                <FileText className="size-7" strokeWidth={1.8} />
              </div>
            </div>
            <p className="mt-5 text-[15px] font-semibold text-white">No records found</p>
            <p className="mt-2 text-[12px] leading-5 text-[#AAB6C8]">Downloaded reports will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function LanguageSettingsPopup({
  onClose,
  onSelect,
  selectedLanguage,
}: {
  onClose: () => void;
  onSelect: (language: string) => void;
  selectedLanguage: string;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/60 px-4 pb-4 backdrop-blur-sm">
      <section className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] bg-[#0D131C] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-bold text-white">Language Settings</h2>
          <button className="grid size-9 place-items-center rounded-full bg-white/10 text-white" type="button" aria-label="Close language settings" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-2">
          {languageOptions.map((language) => (
            <button
              key={language.code}
              type="button"
              className={cn(
                "flex h-12 items-center justify-between rounded-[16px] px-4 text-left text-[13px] font-semibold transition",
                selectedLanguage === language.code ? "bg-[#5EF2C2] text-[#06221a]" : "bg-white/[0.06] text-white hover:bg-white/[0.1]"
              )}
              onClick={() => onSelect(language.code)}
            >
              {language.label}
              {selectedLanguage === language.code ? <span className="text-[11px] font-bold">Selected</span> : null}
            </button>
          ))}
        </div>

      </section>
    </div>
  );
}

function ProfilePanel({ name, onClose, onHelp, onLanguageLoadingChange, onProfileUpdate, profile }: { name: string; onClose: () => void; onHelp: () => void; onLanguageLoadingChange: (loading: boolean) => void; onProfileUpdate: (profile: UserProfile | null) => void; profile: UserProfile | null }) {
  const phone = profile?.mobileNumber || sessionStorage.getItem("scorecare_mobile_number") || "--";
  const completion = calculateProfileCompletion(profile);
  const [notificationError, setNotificationError] = useState("");
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsMarkingAll, setNotificationsMarkingAll] = useState(false);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(() => normalizeLanguageCode(profile?.selectedLanguage) || readStoredLanguage());
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showDownloadReports, setShowDownloadReports] = useState(false);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    void refreshProfileNotifications();

    window.addEventListener("scorecare:profile-notifications-refresh", refreshProfileNotifications);

    return () => {
      window.removeEventListener("scorecare:profile-notifications-refresh", refreshProfileNotifications);
    };
  }, []);

  useEffect(() => {
    if (showLanguageSettings) {
      loadGoogleTranslate();
    }
  }, [showLanguageSettings]);

  useEffect(() => {
    const profileLanguage = normalizeLanguageCode(profile?.selectedLanguage);

    if (!profileLanguage) return;

    setSelectedLanguage(profileLanguage);
    applyProfileLanguage(profile);
  }, [profile?.selectedLanguage]);

  useEffect(() => {
    if (!ratingSubmitted) return;

    const timer = window.setTimeout(() => {
      setShowRatingForm(false);
      setRatingSubmitted(false);
      setSelectedRating(0);
      setRatingComment("");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [ratingSubmitted]);

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
      const result = await loadNotifications(token);
      setNotifications(result.notifications);
      setNotificationUnreadCount(result.unreadCount);
    } catch {
      setNotificationError("Unable to load notifications.");
    } finally {
      setNotificationLoading(false);
    }
  }

  async function refreshProfileNotifications() {
    const token = sessionStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) return;

    try {
      const result = await loadNotifications(token);
      setNotifications(result.notifications);
      setNotificationUnreadCount(result.unreadCount);
    } catch {
      setNotificationUnreadCount(0);
    }
  }

  async function markAllNotificationsRead() {
    const token = sessionStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      setNotificationError("Please login again to update notifications.");
      return;
    }

    setNotificationsMarkingAll(true);
    setNotificationError("");

    try {
      await markNotificationsReadAll(token);
      const readAt = new Date().toISOString();

      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true, readAt })));
      setNotificationUnreadCount(0);
      window.dispatchEvent(new Event("scorecare:notifications-updated"));
    } catch {
      setNotificationError("Unable to mark all notifications read.");
    } finally {
      setNotificationsMarkingAll(false);
    }
  }

  async function updateSelectedLanguage(language: string) {
    const token = sessionStorage.getItem("scorecare_token");
    const selectedLanguageLabel = languageOptions.find((item) => item.code === language)?.label;

    if (!token || isTokenExpired(token) || !selectedLanguageLabel) return;

    onLanguageLoadingChange(language !== "en");
    setSelectedLanguage(language);
    applyGoogleLanguageWithRetry(language);
    setShowLanguageSettings(false);

    try {
      await updateUserLanguage(token, selectedLanguageLabel);
      const updatedProfile = await loadProfile(token);
      const updatedLanguage = normalizeLanguageCode(updatedProfile?.selectedLanguage);

      onProfileUpdate(updatedProfile);

      if (updatedLanguage) {
        setSelectedLanguage(updatedLanguage);
        applyGoogleLanguageWithRetry(updatedLanguage);
      }
    } finally {
      if (language !== "en") {
        await waitForLanguageApply();
      }
      onLanguageLoadingChange(false);
    }
  }

  async function submitRatingFeedback() {
    if (!selectedRating || ratingLoading) return;

    setRatingLoading(true);
    setRatingError("");

    try {
      await submitFeedback({
        rating: selectedRating,
        message: ratingComment.trim() || "Score Care rating",
        isLiked: selectedRating >= 4,
        isDisliked: selectedRating <= 2,
      });

      const token = sessionStorage.getItem("scorecare_token");

      if (token && !isTokenExpired(token)) {
        const result = await loadNotifications(token);
        setNotifications(result.notifications);
        setNotificationUnreadCount(result.unreadCount);
      }

      setRatingSubmitted(true);
    } catch {
      setRatingError("Unable to submit feedback.");
    } finally {
      setRatingLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#070B12] px-4 pb-28 pt-7 text-white [font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',system-ui,sans-serif]">
      <section className="relative mx-auto max-w-md overflow-hidden rounded-[30px] bg-[linear-gradient(160deg,#ebe7d9,#faf7ed_48%,#d9d0bd)] p-5 text-[#111827] shadow-[0_22px_46px_rgba(58,75,140,0.38)]">
        <button className="absolute left-5 top-5 grid size-8 place-items-center rounded-full bg-black/18 text-white backdrop-blur" type="button" aria-label="Close profile" onClick={onClose}>
          <X className="size-6" strokeWidth={1.6} />
        </button>

        <div className="mt-8 rounded-[24px] bg-white/35 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          <div className="mb-5 inline-flex rounded-full bg-[#C9F9DF] px-4 py-1.5 text-[10px] font-medium text-[#07844E]">{completion}% Complete</div>
          <div className="grid gap-3.5">
            <ProfileField label="Full name" value={profile?.fullName || name} />
            <ProfileField label="Phone number" value={formatPhone(phone)} />
            <ProfileField label="PAN" value={profile?.panNumber || "--"} />
            <ProfileField
              label="Date of Birth"
              value={
                profile?.dateOfBirth
                  ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                  : "--"
              }
            />
          </div>
        </div>

      </section>

      <section className="mx-auto mt-6 max-w-md rounded-[26px] bg-[#111821] p-5 shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#AAB6C8]">
          Credit Service
        </p>

        <ProfileOption
          title="Download Reports"
          subtitle="View downloaded report history"
          Icon={FileText}
          onClick={() => setShowDownloadReports(true)}
        />

        <ProfileOption
          title="Loans"
          subtitle="Smart Offers"
          Icon={ReceiptText}
          disabled
        />
      </section>

      <section className="mx-auto mt-6 max-w-md rounded-[26px] bg-[#111821] p-5 shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#AAB6C8]">
          Other Options
        </p>

        <ProfileOption
          title="Notification"
          subtitle="Alerts, Updates & Reminders"
          Icon={Bell}
          badgeCount={notificationUnreadCount}
          onClick={openNotifications}
        />

        <ProfileOption
          title="Help & Support"
          subtitle="Chat, Support & FAQ"
          Icon={CircleHelp}
          onClick={onHelp}
        />

        <ProfileOption
          title="Share App"
          subtitle="Invite Friends & Family"
          Icon={Share2}
        />

        <ProfileOption
          title="Rate Score Care"
          subtitle="Help us improve"
          Icon={Star}
          onClick={() => setShowRatingForm((current) => !current)}
        />

        {showRatingForm ? (
          <div className="mb-3 rounded-[22px] border border-[#5EF2C2]/15 bg-[#070B12] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Select ${value} star rating`}
                    className="grid size-9 place-items-center rounded-full bg-white/[0.04] text-[#6F7B8E] transition hover:bg-[#5EF2C2]/10 hover:text-[#5EF2C2]"
                    onClick={() => {
                      setSelectedRating(value);
                      setRatingSubmitted(false);
                    }}
                  >
                    <Star className={cn("size-5", selectedRating >= value && "fill-[#5EF2C2] text-[#5EF2C2]")} strokeWidth={1.8} />
                  </button>
                );
              })}
            </div>

            <textarea
              value={ratingComment}
              onChange={(event) => {
                setRatingComment(event.target.value);
                setRatingSubmitted(false);
              }}
              placeholder="Share your feedback"
              className="mt-4 min-h-24 w-full resize-none rounded-[18px] border border-white/[0.08] bg-[#111821] px-4 py-3 text-[13px] font-medium leading-5 text-white outline-none placeholder:text-[#AAB6C8]/60 focus:border-[#5EF2C2]/60 focus:ring-4 focus:ring-[#5EF2C2]/10"
            />

            {ratingSubmitted ? (
              <p className="mt-3 text-[12px] font-medium text-[#5EF2C2]">Thanks for your feedback.</p>
            ) : null}

            {ratingError ? (
              <p className="mt-3 text-[12px] font-medium text-[#FF5C8A]">{ratingError}</p>
            ) : null}

            <button
              type="button"
              className="mt-4 h-11 w-full rounded-[16px] bg-[#2DB094] text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(45,176,148,0.22)] transition hover:bg-[#249a81] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedRating || ratingLoading}
              onClick={submitRatingFeedback}
            >
              {ratingLoading ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        ) : null}

        <ProfileOption
          title="Language Settings"
          subtitle={languageOptions.find((language) => language.code === selectedLanguage)?.label || profile?.selectedLanguage || "English"}
          Icon={Languages}
          onClick={() => setShowLanguageSettings(true)}
        />

        <ProfileOption
          title="Logout"
          subtitle="Sign Out From Account"
          Icon={LogOut}
          danger
          onClick={logoutUser}
        />
      </section>

      {showNotifications ? (
        <NotificationsScreen
          error={notificationError}
          loading={notificationLoading}
          markingAll={notificationsMarkingAll}
          notifications={notifications}
          onBack={() => setShowNotifications(false)}
          onReadAll={markAllNotificationsRead}
          unreadCount={notificationUnreadCount}
        />
      ) : null}

      {showDownloadReports ? <DownloadReportsPopup downloads={[]} onClose={() => setShowDownloadReports(false)} /> : null}

      {showLanguageSettings ? (
        <LanguageSettingsPopup
          selectedLanguage={selectedLanguage}
          onClose={() => setShowLanguageSettings(false)}
          onSelect={(language) => void updateSelectedLanguage(language)}
        />
      ) : null}

      <p className="mt-6 text-center text-[11px] font-normal text-[#6F7B8E]">V 1.0.0</p>
    </div>
  );
}



function NotificationsScreen({ error, loading, markingAll, notifications, onBack, onReadAll, unreadCount }: { error: string; loading: boolean; markingAll: boolean; notifications: NotificationItem[]; onBack: () => void; onReadAll: () => void; unreadCount: number }) {
  return (
    <div className="fixed inset-0 z-[60] bg-white text-[#1F2937] [font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',system-ui,sans-serif]">
      <header className="flex h-[72px] items-center gap-2 border-b border-black/10 bg-white px-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <button className="grid size-6 place-items-center text-[#1F2937]" type="button" aria-label="Back" onClick={onBack}>
          <ArrowLeft className="size-6" strokeWidth={2.2} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] font-medium text-[#1F2937]">Notifications</h1>
          <p className="mt-0.5 text-[10px] font-medium text-[#6F7B8E]">{unreadCount} unread</p>
        </div>
        <button
          className="rounded-full border border-black/10 px-3 py-1.5 text-[11px] font-semibold text-[#1F2937] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!unreadCount || markingAll}
          onClick={onReadAll}
        >
          {markingAll ? "Updating..." : "Read all"}
        </button>
      </header>

      <main>
        {loading ? (
          <NotificationScreenSkeleton />
        ) : error ? (
          <p className="px-5 py-5 text-[11px] font-normal text-[#FF5C8A]">{error}</p>
        ) : notifications.length ? (
          notifications.map((notification) => (
            <article key={notification.id} className={cn("border-b border-black/20 px-5 py-5", !notification.isRead && "bg-[#F2FFFA]")}>
              <h2 className="text-[16px] font-medium leading-5 text-black">{notification.title || "Notification"}</h2>
              <p className="mt-2 text-[15px] font-normal leading-4 text-black">{notification.message || "--"}</p>
              {notification.createdAt ? <p className="mt-5 text-right text-[10px] font-normal text-black">{formatNotificationRelativeTime(notification.createdAt)}</p> : null}
            </article>
          ))
        ) : (
          <p className="px-5 py-5 text-[11px] font-normal text-[#111827]">No notifications yet.</p>
        )}
      </main>
    </div>
  );
}

function NotificationScreenSkeleton() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, index) => (
        <article key={index} className="border-b border-black/10 px-5 py-5">
          <div className="h-3 w-2/5 animate-pulse rounded-full bg-black/10" />
          <div className="mt-3 space-y-2">
            <div className="h-2.5 w-full animate-pulse rounded-full bg-black/10" />
            <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-black/10" />
          </div>
          <div className="ml-auto mt-5 h-2.5 w-20 animate-pulse rounded-full bg-black/10" />
        </article>
      ))}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[14px] font-medium uppercase tracking-[2px] text-[#6F7280]">{label}</p>
      <p className="mt-1 break-words text-[15px] font-medium tracking-[0.3px] text-[#111827]">{value || "--"}</p>
    </div>
  );
}


function ProfileOption({
  title,
  subtitle,
  Icon,
  badgeCount,
  danger,
  disabled,
  onClick,
}: {
  title: string;
  subtitle?: string;
  Icon: LucideIcon;
  badgeCount?: number;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-4 py-4 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="relative">
        <Icon
          className={cn(
            "size-5",
            danger ? "text-[#FF5C8A]" : "text-[#AAB6C8]"
          )}
        />
        {badgeCount ? (
          <span className="absolute -right-2.5 -top-2.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#FF5C8A] px-1 text-[9px] font-bold leading-none text-white">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        ) : null}
      </span>

      <div className="flex-1 text-left">
        <p
          className={cn(
            "text-[14px] font-medium",
            danger ? "text-[#FF5C8A]" : "text-white"
          )}
        >
          {title}
        </p>

        {subtitle && (
          <p className="mt-0.5 text-[11px] text-[#6F7B8E]">
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
}

function normalizeLanguageCode(language?: string | null) {
  if (!language) return "";

  const normalizedLanguage = language.trim().toLowerCase();
  const option = languageOptions.find((item) => item.code.toLowerCase() === normalizedLanguage || item.label.toLowerCase() === normalizedLanguage);

  return option?.code || "";
}

function readStoredLanguage() {
  if (typeof window === "undefined") {
    return "en";
  }

  return normalizeLanguageCode(localStorage.getItem("scorecare_language")) || "en";
}

function loadGoogleTranslate() {
  if (typeof window === "undefined") {
    return;
  }

  const googleWindow = window as typeof window & {
    google?: {
      translate?: {
        TranslateElement?: new (options: { includedLanguages: string; pageLanguage: string }, elementId: string) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  };

  googleWindow.googleTranslateElementInit = () => {
    if (!googleWindow.google?.translate?.TranslateElement || !document.getElementById("google_translate_element")) {
      return;
    }

    new googleWindow.google.translate.TranslateElement(
      {
        includedLanguages: languageOptions.map((language) => language.code).join(","),
        pageLanguage: "en",
      },
      "google_translate_element"
    );

    const storedLanguage = readStoredLanguage();

    if (storedLanguage !== "en") {
      applyGoogleLanguageWithRetry(storedLanguage);
    }
  };

  if (document.getElementById("scorecare-google-translate-script")) {
    googleWindow.googleTranslateElementInit();
    return;
  }

  const script = document.createElement("script");
  script.id = "scorecare-google-translate-script";
  script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

function applyGoogleLanguageWithRetry(language: string) {
  const delays = [0, 300, 800, 1500];

  delays.forEach((delay) => {
    window.setTimeout(() => {
      const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");

      if (!select && delay !== delays[delays.length - 1]) return;
      if (select?.value === language) return;

      applyGoogleLanguage(language, false);
    }, delay);
  });
}

function applyProfileLanguage(profile: UserProfile | null) {
  const profileLanguage = normalizeLanguageCode(profile?.selectedLanguage);

  if (!profileLanguage) return false;

  if (profileLanguage === "en") {
    resetGoogleLanguage();
    return false;
  }

  loadGoogleTranslate();
  applyGoogleLanguageWithRetry(profileLanguage);
  return true;
}

function waitForLanguageApply() {
  return new Promise((resolve) => window.setTimeout(resolve, 1700));
}

function applyGoogleLanguage(language: string, reloadWhenMissing = true) {
  localStorage.setItem("scorecare_language", language);
  document.cookie = `googtrans=/en/${language};path=/`;
  document.cookie = `googtrans=/en/${language};domain=${window.location.hostname};path=/`;
  document.body.style.top = "0";

  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");

  if (!select && reloadWhenMissing) {
    window.location.reload();
    return;
  }

  if (!select) {
    return;
  }

  select.value = language;
  select.dispatchEvent(new Event("change"));
}

function resetGoogleLanguage() {
  localStorage.setItem("scorecare_language", "en");
  document.cookie = "googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `googtrans=;domain=${window.location.hostname};path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = "googtrans=/en/en;path=/";
  document.cookie = `googtrans=/en/en;domain=${window.location.hostname};path=/`;
  document.body.style.top = "0";

  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");

  if (select) {
    select.value = "en";
    select.dispatchEvent(new Event("change"));
  }
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
  if (profile?.selectedLanguage) localStorage.setItem("scorecare_language", normalizeLanguageCode(profile.selectedLanguage) || profile.selectedLanguage);

  return profile;
}

async function updateUserLanguage(token: string, selectedLanguageLabel: string) {
  const response = await apiRequest("/users/me/language", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: { selectedLanguage: selectedLanguageLabel },
  });
  const result = await response.json();

  if (response.status === 401 || response.status === 403) {
    clearScorecareSession();
    window.location.replace("/login");
    return;
  }

  if (!response.ok) {
    throw new Error(result?.message || "Unable to update language");
  }
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
      unreadCount?: number | null;
    };
    status?: string;
  };

  return {
    notifications: result.status === "success" ? result.data?.notifications ?? [] : [],
    unreadCount: result.status === "success" ? result.data?.unreadCount ?? 0 : 0,
  };
}

async function markNotificationsReadAll(token: string) {
  const response = await apiRequest("/notifications/read-all", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to mark all notifications read.");
  }
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
  const hasReportData = accounts.length > 0 || enquiries.length > 0 || Boolean(summary.outstandingBalance || summary.activeAccounts || summary.defaultAccounts || summary.recentEnquiries);

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
    hasReportData,
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
    hasReportData: false,
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
    hasReportData: false,
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
  const totals = activeAccounts.reduce<{ balance: number; limit: number }>(
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

function formatNotificationRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

function formatDownloadDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
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

async function submitFeedback(payload: { rating: number; message: string; isLiked: boolean; isDisliked: boolean }) {
  const token = sessionStorage.getItem("scorecare_token");

  if (!token || isTokenExpired(token)) {
    throw new Error("Please login again to submit feedback.");
  }

  const response = await apiRequest("/feedback", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  });

  if (!response.ok) {
    throw new Error("Unable to submit feedback.");
  }
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
